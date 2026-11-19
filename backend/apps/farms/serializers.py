from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from .models import Farm, FarmBoundary, SoilRecord

class TolerantDecimalField(serializers.DecimalField):
    """
    DecimalField that automatically rounds/quantizes input numbers to the field's
    configured decimal_places, safely converts empty strings to None if nullable,
    and prevents 400 Bad Request 'Ensure that there are no more than X decimal places'.
    """
    def to_internal_value(self, data):
        if data in ('', None):
            if self.allow_null:
                return None
            return super().to_internal_value(data)
        try:
            val_str = str(data).strip()
            if val_str:
                d = Decimal(val_str)
                if self.decimal_places is not None:
                    q = Decimal('10') ** -self.decimal_places
                    d = d.quantize(q, rounding=ROUND_HALF_UP)
                data = d
        except Exception:
            pass
        return super().to_internal_value(data)

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
    boundary_geojson = serializers.JSONField(required=False, allow_null=True, write_only=True)
    soil_records_count = serializers.IntegerField(source='soil_records.count', read_only=True)

    area_hectares = TolerantDecimalField(max_digits=8, decimal_places=2, required=True)
    latitude = TolerantDecimalField(max_digits=10, decimal_places=6, required=False, allow_null=True)
    longitude = TolerantDecimalField(max_digits=10, decimal_places=6, required=False, allow_null=True)
    soil_ph = TolerantDecimalField(max_digits=4, decimal_places=2, required=False, allow_null=True)
    nitrogen_n = TolerantDecimalField(max_digits=7, decimal_places=2, required=False, allow_null=True)
    phosphorus_p = TolerantDecimalField(max_digits=7, decimal_places=2, required=False, allow_null=True)
    potassium_k = TolerantDecimalField(max_digits=7, decimal_places=2, required=False, allow_null=True)
    organic_carbon_pct = TolerantDecimalField(max_digits=4, decimal_places=2, required=False, allow_null=True)

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
        # Automatically record baseline SoilRecord if chemical nutrient parameters were provided
        has_soil_metrics = any(
            v is not None for v in [farm.soil_ph, farm.nitrogen_n, farm.phosphorus_p, farm.potassium_k, farm.organic_carbon_pct]
        )
        if has_soil_metrics:
            from django.utils import timezone
            SoilRecord.objects.create(
                farm=farm,
                test_date=timezone.now().date(),
                lab_name='Soil Health Card / Baseline Test',
                ph=farm.soil_ph,
                nitrogen_kg_ha=farm.nitrogen_n,
                phosphorus_kg_ha=farm.phosphorus_p,
                potassium_kg_ha=farm.potassium_k,
                organic_carbon_pct=farm.organic_carbon_pct,
                remarks='Initial baseline parameters recorded on farm registration.'
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
        has_soil_metrics = any(
            v is not None for v in [farm.soil_ph, farm.nitrogen_n, farm.phosphorus_p, farm.potassium_k, farm.organic_carbon_pct]
        )
        if has_soil_metrics:
            from django.utils import timezone
            SoilRecord.objects.update_or_create(
                farm=farm,
                test_date=timezone.now().date(),
                defaults={
                    'lab_name': 'Soil Health Card / Field Record',
                    'ph': farm.soil_ph,
                    'nitrogen_kg_ha': farm.nitrogen_n,
                    'phosphorus_kg_ha': farm.phosphorus_p,
                    'potassium_kg_ha': farm.potassium_k,
                    'organic_carbon_pct': farm.organic_carbon_pct,
                    'remarks': 'Updated soil parameters saved to farm profile.'
                }
            )
        return farm
