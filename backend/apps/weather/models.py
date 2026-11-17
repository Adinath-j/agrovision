from django.db import models
from apps.farms.models import Farm

class WeatherObservation(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='weather_observations')
    observation_datetime = models.DateTimeField()
    temperature_c = models.DecimalField(max_digits=5, decimal_places=2)
    min_temperature_c = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_temperature_c = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    relative_humidity_pct = models.DecimalField(max_digits=5, decimal_places=2)
    rainfall_mm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    wind_speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    solar_radiation_mj_m2 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    weather_condition = models.CharField(max_length=100, blank=True, default='')
    data_source = models.CharField(max_length=50, default='Open-Meteo')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-observation_datetime']


class WeatherAlert(models.Model):
    class AlertType(models.TextChoices):
        HEAVY_RAIN = 'HEAVY_RAIN', 'Heavy Rainfall Warning'
        HEAT_STRESS = 'HEAT_STRESS', 'Heat Stress / Extreme Temperature'
        STRONG_WIND = 'STRONG_WIND', 'Strong Wind Advisory'
        DRY_SPELL = 'DRY_SPELL', 'Dry Spell / Drought Risk'
        FROST = 'FROST', 'Frost / Cold Wave Warning'

    class Severity(models.TextChoices):
        INFO = 'INFO', 'Advisory / Information'
        WARNING = 'WARNING', 'Warning / Take Precaution'
        CRITICAL = 'CRITICAL', 'Critical Alert / Immediate Action'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='weather_alerts')
    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO)
    title = models.CharField(max_length=200)
    message = models.TextField()
    recommended_farming_action = models.TextField(blank=True, default='')
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
