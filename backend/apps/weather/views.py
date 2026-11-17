from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.farms.models import Farm
from .models import WeatherAlert, WeatherObservation
from .weather_service import get_farm_weather_package, fetch_open_meteo_weather

class CurrentWeatherView(APIView):
    """Real-time weather observation and 7-day forecast for farm parcel."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')

        if farm_id:
            try:
                farm = Farm.objects.get(pk=farm_id, owner=user)
            except Farm.DoesNotExist:
                return Response({"error": "Farm not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            farm = Farm.objects.filter(owner=user).first()
            if not farm:
                # Provide standard regional observation if farmer has no farm yet
                lat = float(request.query_params.get('lat', 20.1983))
                lon = float(request.query_params.get('lon', 73.8821))
                res = fetch_open_meteo_weather(lat, lon)
                return Response(res['data'])

        weather_pkg = get_farm_weather_package(farm)
        return Response(weather_pkg, status=status.HTTP_200_OK)


class ForecastView(APIView):
    """7-day and hourly weather forecasts for agricultural planning."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')
        farm = Farm.objects.filter(owner=user).filter(pk=farm_id).first() if farm_id else Farm.objects.filter(owner=user).first()
        if not farm:
            return Response({"error": "No registered farms found."}, status=status.HTTP_400_BAD_REQUEST)
        
        weather_pkg = get_farm_weather_package(farm)
        return Response({
            "farm_name": farm.farm_name,
            "forecast_7_day": weather_pkg['forecast_7_day'],
            "hourly_24h": weather_pkg['hourly_24h']
        })


class WeatherAlertsView(APIView):
    """Active agricultural weather advisories and meteorological alerts."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm_id')
        alerts = WeatherAlert.objects.filter(is_active=True)
        if farm_id:
            alerts = alerts.filter(farm_id=farm_id)
        elif not request.user.is_staff:
            alerts = alerts.filter(farm__owner=request.user)

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
