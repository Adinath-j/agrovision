from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.farms.models import Farm
from apps.crops.models import Crop
from .models import Recommendation
from .optimization_service import (
    calculate_irrigation_optimization,
    calculate_fertilizer_optimization,
    generate_full_farm_optimization
)

class RecommendationsView(APIView):
    """
    Agricultural decision-support and agronomic optimization recommendations.
    Provides precision irrigation schedule and STCR fertilizer split recommendations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')
        crop_id = request.query_params.get('crop_id')
        growth_stage = request.query_params.get('growth_stage', 'FLOWERING')
        refresh = request.query_params.get('refresh', 'false').lower() == 'true'

        if farm_id:
            farm = Farm.objects.filter(id=farm_id, owner=user).first()
        else:
            farm = Farm.objects.filter(owner=user).first()

        if not farm:
            return Response({
                "status": "empty",
                "message": "No farm parcel found. Please register a farm first.",
                "recommendations": [],
                "irrigation_plan": None,
                "fertilizer_plan": None
            })

        crop = None
        if crop_id:
            crop = Crop.objects.filter(id=crop_id).first()
        if not crop:
            crop = Crop.objects.filter(name__iexact='Soybean').first() or Crop.objects.first()

        # Check existing recommendations
        recs_qs = Recommendation.objects.filter(farm=farm)
        if refresh or not recs_qs.exists():
            generate_full_farm_optimization(farm, crop)
            recs_qs = Recommendation.objects.filter(farm=farm)

        irrigation_plan = calculate_irrigation_optimization(farm, crop, growth_stage)
        fertilizer_plan = calculate_fertilizer_optimization(farm, crop)

        results = [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "priority": r.priority,
                "recommendation": r.recommendation_text,
                "reasoning": r.reasoning,
                "actions": r.action_items,
                "is_implemented": r.is_implemented,
                "date": r.created_at.strftime("%d %b %Y")
            }
            for r in recs_qs
        ]

        return Response({
            "status": "success",
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "crop_name": crop.name if crop else "Soybean",
            "growth_stage": growth_stage,
            "count": len(results),
            "irrigation_plan": irrigation_plan,
            "fertilizer_plan": fertilizer_plan,
            "recommendations": results
        })


class ToggleImplementedView(APIView):
    """Mark an optimization recommendation as completed on the farm."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, rec_id):
        try:
            rec = Recommendation.objects.get(id=rec_id, farm__owner=request.user)
            rec.is_implemented = not rec.is_implemented
            rec.save()
            return Response({
                "status": "success",
                "id": rec.id,
                "is_implemented": rec.is_implemented,
                "message": "Recommendation status updated."
            })
        except Recommendation.DoesNotExist:
            return Response({"error": "Recommendation not found."}, status=status.HTTP_404_NOT_FOUND)
