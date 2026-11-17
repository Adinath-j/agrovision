from django.db import models
from apps.farms.models import Farm

class SatelliteObservation(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='satellite_observations')
    observation_date = models.DateField()
    satellite_mission = models.CharField(max_length=50, default='Sentinel-2 L2A')
    
    # Remote Sensing Indices
    ndvi_mean = models.DecimalField(max_digits=5, decimal_places=4, help_text='Normalized Difference Vegetation Index (-1 to 1)')
    ndvi_min = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    ndvi_max = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    
    evi_mean = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True, help_text='Enhanced Vegetation Index')
    ndwi_mean = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True, help_text='Normalized Difference Water Index')
    
    cloud_coverage_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    vegetation_health_status = models.CharField(max_length=50, default='Moderate Vigour')
    
    gee_asset_id = models.CharField(max_length=200, blank=True, default='')
    retrieval_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-observation_date']

    def __str__(self):
        return f"{self.observation_date}: NDVI {self.ndvi_mean} on {self.farm.farm_name}"
