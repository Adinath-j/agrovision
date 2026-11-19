from django.db import models
from django.conf import settings
from apps.farms.models import Farm
from apps.crops.models import Crop, CropSeason


class YieldPrediction(models.Model):
    class Stage(models.TextChoices):
        PRE_SOWING = 'PRE_SOWING', 'Pre-Sowing Estimation'
        IN_SEASON = 'IN_SEASON', 'In-Season Live Update'

    class GrowthStage(models.TextChoices):
        PRE_SOWING = 'PRE_SOWING', 'Pre-Sowing / Planning'
        EARLY_GROWTH = 'EARLY_GROWTH', 'Germination / Early Growth'
        VEGETATIVE = 'VEGETATIVE', 'Vegetative Stage'
        FLOWERING = 'FLOWERING', 'Flowering / Tasseling'
        GRAIN_FORMATION = 'GRAIN_FORMATION', 'Grain / Fruit Formation'
        MATURITY = 'MATURITY', 'Maturity / Ripening'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='yield_predictions')
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictions')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='predictions')
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, null=True, blank=True)

    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.PRE_SOWING)
    growth_stage = models.CharField(max_length=30, choices=GrowthStage.choices, default=GrowthStage.PRE_SOWING)

    sowing_date = models.DateField(null=True, blank=True)
    prediction_date = models.DateField(auto_now_add=True)

    predicted_yield_kg_per_ha = models.DecimalField(max_digits=10, decimal_places=2)
    predicted_total_production_tonnes = models.DecimalField(max_digits=10, decimal_places=2)
    prediction_interval_min_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prediction_interval_max_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    model_version = models.CharField(max_length=50, default='v1.0-baseline')
    model_algorithm = models.CharField(max_length=50, default='XGBoost Regressor')

    # Explainability payload (SHAP values & feature importance)
    explainability_shap = models.JSONField(default=dict, blank=True)
    influencing_factors = models.JSONField(default=list, blank=True)

    # Recommendations associated with this prediction run
    recommendations = models.JSONField(default=list, blank=True)

    is_latest = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_stage_display()} - {self.crop.name} on {self.farm.farm_name}: {self.predicted_yield_kg_per_ha} kg/ha"