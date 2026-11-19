from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.farms.models import Farm
from .models import WeatherAlert, WeatherObservation
from .weather_service import (
    get_farm_weather_package,
    get_anonymous_weather_package,
    sync_user_location_weather,
    geocode_location,
    fetch_open_meteo_weather,
    record_weather_observation,
    evaluate_agricultural_alerts,
    WMO_CODE_MAP,
    _format_forecast_days,
)


class CurrentWeatherView(APIView):
    """Real-time weather observation and 7-day forecast for farm parcel or user location."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')
        lat_param = request.query_params.get('lat')
        lon_param = request.query_params.get('lon')

        # 1. Explicit farm_id requested
        if farm_id:
            try:
                farm = Farm.objects.get(pk=farm_id, owner=user)
                weather_pkg = get_farm_weather_package(farm)
                return Response(weather_pkg, status=status.HTTP_200_OK)
            except Farm.DoesNotExist:
                return Response({"error": "Farm not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Specific lat/lon coordinates provided
        if lat_param is not None and lon_param is not None:
            try:
                lat = float(lat_param)
                lon = float(lon_param)

                # Check if coordinates correspond to an existing farm of this user (~5km)
                matching_farm = None
                for f in Farm.objects.filter(owner=user):
                    if f.latitude and f.longitude:
                        if abs(float(f.latitude) - lat) < 0.05 and abs(float(f.longitude) - lon) < 0.05:
                            matching_farm = f
                            break

                if matching_farm:
                    return Response(get_farm_weather_package(matching_farm), status=status.HTTP_200_OK)

                result = fetch_open_meteo_weather(lat, lon)
                payload = result['data']
                cur = payload.get('current', {})
                weather_desc = WMO_CODE_MAP.get(cur.get('weather_code', 0), 'Clear Sky')
                loc_name = f"{lat:.2f}° N, {lon:.2f}° E"

                return Response({
                    "farm_id": None,
                    "farm_name": "Location Telemetry",
                    "location": loc_name,
                    "coordinates": {"latitude": lat, "longitude": lon},
                    "data_source": result.get('source', 'Open-Meteo Live API'),
                    "current": {
                        "temperature_c": cur.get('temperature_2m', 20.0),
                        "feels_like_c": cur.get('apparent_temperature', 20.0),
                        "humidity_pct": cur.get('relative_humidity_2m', 50),
                        "wind_speed_kmh": cur.get('wind_speed_10m', 0.0),
                        "wind_direction_deg": cur.get('wind_direction_10m', 0),
                        "condition": weather_desc,
                        "precipitation_mm": cur.get('precipitation', 0.0)
                    },
                    "forecast_7_day": _format_forecast_days(payload.get('daily', {})),
                    "hourly_24h": payload.get('hourly', {}),
                    "active_alerts_count": 0,
                    "alerts": []
                }, status=status.HTTP_200_OK)
            except (ValueError, TypeError):
                pass

        # 3. Default: User's primary farm matching profile location or first farm
        user_village = getattr(user, 'village', '') or ''
        user_district = getattr(user, 'district', '') or ''
        user_state = getattr(user, 'state', '') or ''

        farm = None
        if user_village:
            farm = Farm.objects.filter(owner=user, village__iexact=user_village).first()
        if not farm and user_district:
            farm = Farm.objects.filter(owner=user, district__iexact=user_district).first()
        if not farm and user_state:
            farm = Farm.objects.filter(owner=user, state__iexact=user_state).first()
        if not farm:
            farm = Farm.objects.filter(owner=user).first()

        if farm:
            weather_pkg = get_farm_weather_package(farm)
            return Response(weather_pkg, status=status.HTTP_200_OK)

        # 4. No farm registered: geocode from user profile (district/state/village)
        lat, lon = geocode_location(user_district, user_state, user_village)
        loc_label = f"{user_village or user_district}, {user_state}" if (user_village or user_district) else "Regional Telemetry"
        return Response(get_anonymous_weather_package(lat, lon, loc_label), status=status.HTTP_200_OK)


class ForecastView(APIView):
    """7-day and hourly weather forecasts for agricultural planning."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')
        lat_param = request.query_params.get('lat')
        lon_param = request.query_params.get('lon')

        farm = (
            Farm.objects.filter(owner=user, pk=farm_id).first()
            if farm_id
            else Farm.objects.filter(owner=user).first()
        )

        if lat_param is not None and lon_param is not None:
            try:
                lat = float(lat_param)
                lon = float(lon_param)
                pkg = get_anonymous_weather_package(lat, lon, farm.farm_name if farm else (f"{user.district}, {user.state}" if user.district else "Regional"))
                return Response({
                    "farm_name": farm.farm_name if farm else f"{user.district or 'Local'}, {user.state or 'India'}",
                    "forecast_7_day": pkg['forecast_7_day'],
                    "hourly_24h": pkg['hourly_24h']
                })
            except (ValueError, TypeError):
                pass

        if farm:
            weather_pkg = get_farm_weather_package(farm)
            return Response({
                "farm_name": farm.farm_name,
                "forecast_7_day": weather_pkg['forecast_7_day'],
                "hourly_24h": weather_pkg['hourly_24h']
            })

        lat, lon = geocode_location(getattr(user, 'district', ''), getattr(user, 'state', ''))
        pkg = get_anonymous_weather_package(lat, lon, f"{user.district}, {user.state}")
        return Response({
            "farm_name": f"{user.district or 'Local'}, {user.state or 'India'}",
            "forecast_7_day": pkg['forecast_7_day'],
            "hourly_24h": pkg['hourly_24h']
        })


class WeatherAlertsView(APIView):
    """Active agricultural weather advisories and meteorological alerts."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm_id')
        alerts = WeatherAlert.objects.filter(is_active=True).select_related('farm')

        if not request.user.is_staff:
            alerts = alerts.filter(farm__owner=request.user)
        if farm_id:
            alerts = alerts.filter(farm_id=farm_id)

        return Response({
            "active_alerts_count": alerts.count(),
            "alerts": [
                {
                    "id": a.id,
                    "farm_name": a.farm.farm_name,
                    "type": a.alert_type,
                    "severity": a.severity,
                    "title": a.title,
                    "message": a.message,
                    "action": a.recommended_farming_action,
                    "valid_from": a.valid_from.strftime('%Y-%m-%d %H:%M'),
                    "valid_until": a.valid_until.strftime('%Y-%m-%d %H:%M')
                } for a in alerts
            ]
        })


class SyncUserWeatherView(APIView):
    """Triggers auto-detection of telemetry and updates the database for user's profile location."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        pkg = sync_user_location_weather(request.user)
        return Response({
            "message": "User location and weather synchronized successfully with database",
            "telemetry": pkg
        }, status=status.HTTP_200_OK)

    def get(self, request):
        pkg = sync_user_location_weather(request.user)
        return Response({
            "message": "User location and weather synchronized successfully with database",
            "telemetry": pkg
        }, status=status.HTTP_200_OK)
