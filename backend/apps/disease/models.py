from django.db import models
from django.conf import settings
from apps.farms.models import Farm
from apps.crops.models import Crop

class DiseaseDetection(models.Model):
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='disease_scans')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='disease_scans')
    crop = models.ForeignKey(Crop, on_delete=models.SET_NULL, null=True, blank=True)
    
    leaf_image = models.ImageField(upload_to='disease_scans/%Y/%m/%d/')
    predicted_disease = models.CharField(max_length=150)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2) # 0 - 100%
    is_healthy = models.BooleanField(default=False)
    
    symptoms = models.TextField(blank=True, default='')
    causes = models.TextField(blank=True, default='')
    preventive_measures = models.JSONField(default=list, blank=True)
    suggested_actions = models.JSONField(default=list, blank=True)
    
    expert_consultation_requested = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.predicted_disease} ({self.confidence_score}%) - {self.farmer.username}"
