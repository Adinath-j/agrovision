from django.db import models
from django.utils.translation import gettext_lazy as _

class Crop(models.Model):
    class Category(models.TextChoices):
        CEREAL = 'CEREAL', _('Cereal (अनाज)')
        PULSE = 'PULSE', _('Pulse / Legume (दलहन)')
        OILSEED = 'OILSEED', _('Oilseed (तिलहन)')
        COMMERCIAL = 'COMMERCIAL', _('Commercial / Cash Crop (व्यावसायिक फसल)')
        MILLET = 'MILLET', _('Millet / Nutri-cereal (श्री अन्न / मोटा अनाज)')
        FIBRE = 'FIBRE', _('Fibre Crop (रेशा फसल)')
        SUGAR = 'SUGAR', _('Sugar Crop (शर्करा फसल)')
        HORTICULTURE = 'HORTICULTURE', _('Horticulture / Fruits & Veg (फळे व भाजीपाला)')
        SPICE = 'SPICE', _('Spice Crop (मसाला पिके)')

    name = models.CharField(max_length=100, unique=True)
    hindi_name = models.CharField(max_length=100, blank=True, default='')
    marathi_name = models.CharField(max_length=100, blank=True, default='')
    scientific_name = models.CharField(max_length=150, blank=True, default='')
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.CEREAL)
    
    # Agronomic Thresholds & Characteristics
    growing_duration_days = models.PositiveIntegerField(default=120, help_text=_('Typical maturity duration in days'))
    water_requirement_min_mm = models.DecimalField(max_digits=6, decimal_places=1, default=450.0)
    water_requirement_max_mm = models.DecimalField(max_digits=6, decimal_places=1, default=800.0)
    ideal_temp_min_c = models.DecimalField(max_digits=4, decimal_places=1, default=18.0)
    ideal_temp_max_c = models.DecimalField(max_digits=4, decimal_places=1, default=32.0)
    ideal_soil_ph_min = models.DecimalField(max_digits=3, decimal_places=1, default=6.0)
    ideal_soil_ph_max = models.DecimalField(max_digits=3, decimal_places=1, default=7.5)
    
    # Baseline National / State Yield Benchmarks (kg/ha)
    standard_national_yield_kg_per_ha = models.DecimalField(max_digits=8, decimal_places=2, default=2500.0)
    
    description = models.TextField(blank=True, default='')
    image_url = models.URLField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class CropSeason(models.Model):
    class SeasonCode(models.TextChoices):
        KHARIF = 'KHARIF', _('Kharif (Monsoon / खरीफ)')
        RABI = 'RABI', _('Rabi (Winter / रबी)')
        ZAID = 'ZAID', _('Zaid (Summer / जायद)')
        WHOLE_YEAR = 'WHOLE_YEAR', _('Whole Year (वार्षिक)')

    season_code = models.CharField(max_length=20, choices=SeasonCode.choices, unique=True)
    name = models.CharField(max_length=100)
    sowing_start_month = models.PositiveIntegerField(help_text=_('Month number 1-12'))
    sowing_end_month = models.PositiveIntegerField(help_text=_('Month number 1-12'))
    harvesting_start_month = models.PositiveIntegerField(help_text=_('Month number 1-12'))
    harvesting_end_month = models.PositiveIntegerField(help_text=_('Month number 1-12'))
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return self.name


class StateDistrict(models.Model):
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    agro_climatic_zone = models.CharField(max_length=150, blank=True, default='')
    avg_annual_rainfall_mm = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    major_soil_type = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        unique_together = ('state', 'district')
        ordering = ['state', 'district']

    def __str__(self):
        return f"{self.district}, {self.state}"
