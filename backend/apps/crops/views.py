from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Crop, CropSeason, StateDistrict
from .serializers import CropSerializer, CropSeasonSerializer, StateDistrictSerializer

class CropListView(generics.ListAPIView):
    """List all supported crops in AGROVISION."""
    queryset = Crop.objects.filter(is_active=True)
    serializer_class = CropSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CropDetailView(generics.RetrieveAPIView):
    """Retrieve details and agronomic benchmarks for a specific crop."""
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [permissions.AllowAny]


class CropSeasonListView(generics.ListAPIView):
    """List agricultural cultivation seasons (Kharif, Rabi, Zaid, Whole Year)."""
    queryset = CropSeason.objects.all()
    serializer_class = CropSeasonSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class StateDistrictListView(APIView):
    """List states and their mapped districts for farm registration and prediction inputs."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        state_filter = request.query_params.get('state')
        qs = StateDistrict.objects.all()
        if state_filter:
            qs = qs.filter(state__iexact=state_filter)
        
        # Group districts by state
        states_dict = {}
        for item in qs:
            if item.state not in states_dict:
                states_dict[item.state] = []
            states_dict[item.state].append({
                "district": item.district,
                "agro_climatic_zone": item.agro_climatic_zone,
                "major_soil_type": item.major_soil_type
            })

        return Response({
            "states": list(states_dict.keys()),
            "states_and_districts": states_dict
        })
