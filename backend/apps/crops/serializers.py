from rest_framework import serializers
from .models import Crop, CropSeason, StateDistrict

class CropSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Crop
        fields = '__all__'


class CropSeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropSeason
        fields = '__all__'


class StateDistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = StateDistrict
        fields = '__all__'
