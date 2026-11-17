from rest_framework import serializers
from .models import Farm, FarmBoundary, SoilRecord

class FarmBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmBoundary
        fields = [
            'id',
            'boundary_geojson',
            'elevation_meters',
            'perimeter_meters',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SoilRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class FarmSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    soil_type_display = serializers.CharField(source='get_soil_type_display', read_only=True)
    irrigation_source_display = serializers.CharField(source='get_irrigation_source_display', read_only=True)
    irrigation_method_display = serializers.CharField(source='get_irrigation_method_display', read_only=True)
    boundary = FarmBoundarySerializer(read_only=True)
    boundary_geojson = serializers.JSONField(required=False, write_only=True)
    soil_records_count = serializers.IntegerField(source='soil_records.count', read_only=True)

    class Meta:
        model = Farm
        fields = [
            'id',
            'owner',
            'owner_username',
            'farm_name',
            'state',
            'district',
            'sub_district',
            'village',
            'survey_khasra_number',
            'area_hectares',
            'latitude',
            'longitude',
            'soil_type',
            'soil_type_display',
            'soil_ph',
            'nitrogen_n',
            'phosphorus_p',
            'potassium_k',
            'organic_carbon_pct',
            'irrigation_source',
            'irrigation_source_display',
            'irrigation_method',
            'irrigation_method_display',
            'has_water_storage',
            'previous_crop',
            'current_status',
            'boundary',
            'boundary_geojson',
            'soil_records_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def create(self, validated_data):
        boundary_geojson = validated_data.pop('boundary_geojson', None)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['owner'] = request.user
        farm = super().create(validated_data)
        if boundary_geojson:
            FarmBoundary.objects.update_or_create(
                farm=farm,
                defaults={'boundary_geojson': boundary_geojson}
            )
        return farm

    def update(self, instance, validated_data):
        boundary_geojson = validated_data.pop('boundary_geojson', None)
        farm = super().update(instance, validated_data)
        if boundary_geojson:
            FarmBoundary.objects.update_or_create(
                farm=farm,
                defaults={'boundary_geojson': boundary_geojson}
            )
        return farm
