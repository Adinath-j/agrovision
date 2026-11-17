from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Farm, FarmBoundary, SoilRecord
from .serializers import FarmSerializer, FarmBoundarySerializer, SoilRecordSerializer

class IsOwnerOrAdmin(permissions.BasePermission):
    """Custom permission to only allow owners of a farm to edit or view it, unless admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'farm'):
            return obj.farm.owner == request.user
        return False


class FarmViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Farmer landholdings.
    Farmers can only access and modify their own registered farms.
    """
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return Farm.objects.all()
        return Farm.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class FarmBoundaryViewSet(viewsets.ModelViewSet):
    """API for managing GeoJSON polygon boundaries of farms."""
    serializer_class = FarmBoundarySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return FarmBoundary.objects.all()
        return FarmBoundary.objects.filter(farm__owner=user)


class SoilRecordViewSet(viewsets.ModelViewSet):
    """API for tracking historical soil testing lab records."""
    serializer_class = SoilRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        farm_id = self.request.query_params.get('farm_id')
        qs = SoilRecord.objects.all() if (user.is_staff or getattr(user, 'role', '') == 'ADMIN') else SoilRecord.objects.filter(farm__owner=user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return qs


class FarmSummaryView(APIView):
    """Aggregated portfolio summary of a farmer's registered holdings."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farms = Farm.objects.filter(owner=user)
        
        total_farms = farms.count()
        total_hectares = farms.aggregate(total=Sum('area_hectares'))['total'] or 0.0
        states = list(farms.values_list('state', flat=True).distinct())
        districts = list(farms.values_list('district', flat=True).distinct())
        
        soil_breakdown = list(farms.values('soil_type').annotate(count=Count('id')))

        return Response({
            "total_farms": total_farms,
            "total_area_hectares": float(total_hectares),
            "total_area_acres": round(float(total_hectares) * 2.47105, 2),
            "states_covered": states,
            "districts_covered": districts,
            "soil_breakdown": soil_breakdown
        })


class SoilCardOCRView(APIView):
    """
    Soil Health Card Document Intelligence & OCR Endpoint.
    Parses a photograph of a Government Soil Health Card and returns extracted chemical parameters.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('card_image') or request.FILES.get('image')
        if not image_file:
            return Response(
                {"error": "No image uploaded. Please upload a clear photo of your Soil Health Card."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .soil_card_ocr import extract_soil_card_data
        result = extract_soil_card_data(image_file)
        if result.get("status") == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)
