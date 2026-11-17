from django.db import models
from apps.farms.models import Farm
from apps.crops.models import Crop

class Recommendation(models.Model):
    class Category(models.TextChoices):
        IRRIGATION = 'IRRIGATION', 'Irrigation Optimization'
        FERTILIZER = 'FERTILIZER', 'Fertilizer & Nutrient Optimization'
        MANAGEMENT = 'MANAGEMENT', 'Crop Management & Protection'
        RISK = 'RISK', 'Risk Mitigation & Disaster Prevention'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent Action Required'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='recommendations')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    
    title = models.CharField(max_length=200)
    recommendation_text = models.TextField()
    reasoning = models.TextField(blank=True, default='')
    action_items = models.JSONField(default=list, blank=True)
    
    is_implemented = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title} for {self.farm.farm_name}"
