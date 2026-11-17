from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.farms.models import Farm
from apps.crops.models import Crop, CropSeason
from .models import YieldPrediction
from .serializers import YieldPredictionSerializer
from .prediction_service import predict_pre_sowing_yield, load_model_artifacts
from .in_season_service import predict_in_season_yield

class YieldPredictionHistoryView(generics.ListAPIView):
    """List historical yield prediction runs for the authenticated farmer."""
    serializer_class = YieldPredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        farm_id = self.request.query_params.get('farm_id')
        qs = YieldPrediction.objects.filter(farmer=user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return qs


class PreSowingPredictionEndpoint(APIView):
    """
    Pre-Sowing Yield Prediction API endpoint.
    Executes trained ML pipeline (Random Forest / XGBoost) with SHAP factor contributions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        farm_id = data.get('farm_id')
        crop_id = data.get('crop_id')
        season_name = data.get('season_name', 'Kharif')

        # Retrieve farm
        if farm_id:
            try:
                if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
                    farm = Farm.objects.get(pk=farm_id)
                else:
                    farm = Farm.objects.get(pk=farm_id, owner=user)
            except Farm.DoesNotExist:
                return Response({"error": "Farm not found or does not belong to logged-in user."}, status=status.HTTP_404_NOT_FOUND)
        else:
            farm = Farm.objects.filter(owner=user).first()
            if not farm and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
                farm = Farm.objects.first()
            if not farm:
                return Response({"error": "No registered farms found. Please register a farm first."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve crop
        if crop_id:
            try:
                crop = Crop.objects.get(pk=crop_id)
            except Crop.DoesNotExist:
                return Response({"error": "Specified crop not found in catalog."}, status=status.HTTP_404_NOT_FOUND)
        else:
            crop = Crop.objects.filter(name__iexact='Soybean').first() or Crop.objects.first()

        area_ha = data.get('area_hectares') or float(farm.area_hectares)

        # Call ML prediction service
        try:
            result = predict_pre_sowing_yield(
                farm=farm,
                crop=crop,
                season_name=season_name,
                area_ha=area_ha,
                farmer=user,
                custom_inputs=data
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Prediction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PreSowingModelMetadataView(APIView):
    """Returns validated model benchmark metrics, comparison table, and SHAP factors."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        _, metadata = load_model_artifacts()
        if metadata:
            return Response(metadata, status=status.HTTP_200_OK)
        return Response({"status": "Model training metadata not yet available."}, status=status.HTTP_404_NOT_FOUND)


class InSeasonPredictionEndpoint(APIView):
    """
    In-Season Yield Prediction API endpoint with satellite NDVI & agronomic snapshots.
    Revises expected yield across growth stages (Early Growth, Vegetative, Flowering, Grain Formation, Maturity).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        farm_id = data.get('farm_id')
        crop_id = data.get('crop_id')

        # Retrieve farm
        if farm_id:
            try:
                if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
                    farm = Farm.objects.get(pk=farm_id)
                else:
                    farm = Farm.objects.get(pk=farm_id, owner=user)
            except Farm.DoesNotExist:
                return Response({"error": "Farm not found or does not belong to logged-in user."}, status=status.HTTP_404_NOT_FOUND)
        else:
            farm = Farm.objects.filter(owner=user).first()
            if not farm and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
                farm = Farm.objects.first()
            if not farm:
                return Response({"error": "No registered farms found. Please register a farm first."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve crop
        if crop_id:
            try:
                crop = Crop.objects.get(pk=crop_id)
            except Crop.DoesNotExist:
                return Response({"error": "Specified crop not found in catalog."}, status=status.HTTP_404_NOT_FOUND)
        else:
            crop = Crop.objects.filter(name__iexact='Soybean').first() or Crop.objects.first()

        try:
            result = predict_in_season_yield(
                farm=farm,
                crop=crop,
                farmer=user,
                input_data=data
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"In-season prediction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class YieldProgressionView(APIView):
    """Yield progression across growth stages for a given farm and crop."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm_id')
        crop_id = request.query_params.get('crop_id')

        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            predictions = YieldPrediction.objects.all().order_by('created_at')
        else:
            predictions = YieldPrediction.objects.filter(farmer=request.user).order_by('created_at')
        if farm_id:
            predictions = predictions.filter(farm_id=farm_id)
        if crop_id:
            predictions = predictions.filter(crop_id=crop_id)

        serializer = YieldPredictionSerializer(predictions, many=True)
        records = serializer.data

        # Build chart trajectory
        chart_data = []
        for p in records:
            chart_data.append({
                "id": p["id"],
                "stage": p.get("growth_stage", "PRE_SOWING"),
                "date": p["prediction_date"],
                "yield_kg_ha": float(p["predicted_yield_kg_per_ha"]),
                "production_tonnes": float(p["predicted_total_production_tonnes"]),
                "interval_min": float(p["prediction_interval_min_kg"]) if p.get("prediction_interval_min_kg") else None,
                "interval_max": float(p["prediction_interval_max_kg"]) if p.get("prediction_interval_max_kg") else None,
                "confidence": float(p["confidence_score"]) if p.get("confidence_score") else 75.0
            })

        return Response({
            "farm_id": farm_id,
            "crop_id": crop_id,
            "total_records": len(records),
            "progression_records": records,
            "chart_trajectory": chart_data
        })


class PMFBYClaimEstimatorView(APIView):
    """
    Pradhan Mantri Fasal Bima Yojana (PMFBY) Actuarial Claim Estimator.
    Evaluates yield shortfall against Government Threshold Yield (TY)
    and computes estimated indemnity payouts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        farm_id = data.get('farm_id')
        crop_id = data.get('crop_id')
        indemnity_level = float(data.get('indemnity_level_pct', 85.0))
        season = data.get('season', 'Kharif')

        farm = Farm.objects.filter(id=farm_id, owner=user).first() if farm_id else Farm.objects.filter(owner=user).first()
        if not farm:
            return Response({"error": "No farm parcel found for logged in user."}, status=status.HTTP_404_NOT_FOUND)

        crop = Crop.objects.filter(id=crop_id).first() if crop_id else Crop.objects.first()

        # Determine predicted yield
        pred_yield = data.get('predicted_yield_kg_ha')
        if not pred_yield:
            latest_pred = YieldPrediction.objects.filter(farm=farm, crop=crop).order_by('-created_at').first()
            if latest_pred:
                pred_yield = float(latest_pred.predicted_yield_kg_per_ha)
            else:
                pred_yield = 1250.0

        from .pmfby_service import calculate_pmfby_claim
        result = calculate_pmfby_claim(
            farm=farm,
            crop=crop,
            predicted_yield_kg_ha=float(pred_yield),
            indemnity_level_pct=indemnity_level,
            season=season
        )

        return Response(result, status=status.HTTP_200_OK)
