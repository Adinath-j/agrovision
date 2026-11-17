from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Farm(models.Model):
    class SoilType(models.TextChoices):
        ALLUVIAL = 'ALLUVIAL', _('Alluvial Soil (जलोढ़ मिट्टी)')
        BLACK = 'BLACK', _('Black Cotton / Regur Soil (काली मिट्टी)')
        RED = 'RED', _('Red & Yellow Soil (लाल मिट्टी)')
        LATERITE = 'LATERITE', _('Laterite Soil (लैटेराइट मिट्टी)')
        DESERT = 'DESERT', _('Desert / Arid Soil (बलुई मिट्टी)')
        LOAMY = 'LOAMY', _('Loamy Soil (दोमट मिट्टी)')
        CLAYEY = 'CLAYEY', _('Clayey Soil (चिकनी मिट्टी)')
        SANDY_LOAM = 'SANDY_LOAM', _('Sandy Loam (बलुई दोमट)')
        UNKNOWN = 'UNKNOWN', _('Unknown / Not Tested (अज्ञात)')

    class IrrigationSource(models.TextChoices):
        BOREWELL = 'BOREWELL', _('Borewell / Tube Well')
        CANAL = 'CANAL', _('Government Canal')
        OPEN_WELL = 'OPEN_WELL', _('Open Well')
        RIVER = 'RIVER', _('River / Stream Lift')
        FARM_POND = 'FARM_POND', _('Farm Pond / Tank')
        RAINFED = 'RAINFED', _('Purely Rainfed (No Artificial Irrigation)')
        OTHER = 'OTHER', _('Other Source')

    class IrrigationMethod(models.TextChoices):
        DRIP = 'DRIP', _('Drip Irrigation (Micro-irrigation)')
        SPRINKLER = 'SPRINKLER', _('Sprinkler System')
        FLOOD = 'FLOOD', _('Flood / Furrow Irrigation')
        RAINFED = 'RAINFED', _('Rainfed (None)')
        MANUAL = 'MANUAL', _('Manual / Bucket')

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='farms'
    )
    farm_name = models.CharField(max_length=150, help_text=_('Descriptive name of the farm plot'))
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    sub_district = models.CharField(max_length=100, blank=True, default='', help_text=_('Taluka / Tehsil / Block'))
    village = models.CharField(max_length=100, blank=True, default='')
    survey_khasra_number = models.CharField(max_length=100, blank=True, default='', help_text=_('Survey/Gat/Khasra number'))
    
    area_hectares = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text=_('Total parcel area in hectares (1 Ha = 2.471 Acres)')
    )
    
    # Coordinates (Centroid)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    
    # Soil Profile
    soil_type = models.CharField(
        max_length=30,
        choices=SoilType.choices,
        default=SoilType.UNKNOWN
    )
    soil_ph = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text=_('Soil pH (0.00-14.00)'))
    nitrogen_n = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, help_text=_('Nitrogen N in kg/ha'))
    phosphorus_p = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, help_text=_('Phosphorus P in kg/ha'))
    potassium_k = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, help_text=_('Potassium K in kg/ha'))
    organic_carbon_pct = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text=_('Organic Carbon %'))

    # Water & Irrigation
    irrigation_source = models.CharField(
        max_length=30,
        choices=IrrigationSource.choices,
        default=IrrigationSource.BOREWELL
    )
    irrigation_method = models.CharField(
        max_length=30,
        choices=IrrigationMethod.choices,
        default=IrrigationMethod.DRIP
    )
    has_water_storage = models.BooleanField(default=False)
    
    previous_crop = models.CharField(max_length=100, blank=True, default='', help_text=_('Preceding crop cultivated'))
    current_status = models.CharField(max_length=50, default='Active', help_text=_('Active, Fallow, Harvested'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'state', 'district']),
        ]

    def __str__(self):
        return f"{self.farm_name} ({self.village or self.district}, {self.state}) - {self.area_hectares} Ha"


class FarmBoundary(models.Model):
    farm = models.OneToOneField(Farm, on_delete=models.CASCADE, related_name='boundary')
    boundary_geojson = models.JSONField(
        help_text=_('GeoJSON Feature or Polygon containing exact GPS boundary vertices')
    )
    elevation_meters = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    perimeter_meters = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Boundary for {self.farm.farm_name}"


class SoilRecord(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='soil_records')
    test_date = models.DateField()
    lab_name = models.CharField(max_length=150, blank=True, default='')
    sample_id = models.CharField(max_length=50, blank=True, default='')
    
    ph = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    ec_salinity = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True, help_text=_('Electrical Conductivity dS/m'))
    organic_carbon_pct = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nitrogen_kg_ha = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    phosphorus_kg_ha = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    potassium_kg_ha = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    zinc_ppm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    iron_ppm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    copper_ppm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    manganese_ppm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    boron_ppm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-test_date']

    def __str__(self):
        return f"Soil Test on {self.test_date} for {self.farm.farm_name}"
