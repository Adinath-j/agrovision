from rest_framework import serializers
from .models import YieldPrediction

class YieldPredictionSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source='crop.name', read_only=True)
    farm_name = serializers.CharField(source='farm.farm_name', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    growth_stage_display = serializers.CharField(source='get_growth_stage_display', read_only=True)

    class Meta:
        model = YieldPrediction
        fields = '__all__'
        read_only_fields = ['id', 'farmer', 'created_at']
