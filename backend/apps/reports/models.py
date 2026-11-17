from django.db import models
from django.conf import settings
from apps.farms.models import Farm

class GeneratedReport(models.Model):
    class ReportType(models.TextChoices):
        YIELD_SUMMARY = 'YIELD_SUMMARY', 'Yield Prediction & Performance Report'
        FARM_AUDIT = 'FARM_AUDIT', 'Farm Health & Soil Audit Report'
        SEASONAL_HARVEST = 'SEASONAL_HARVEST', 'Seasonal Harvest & Revenue Analysis'

    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, null=True, blank=True)
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    title = models.CharField(max_length=200)
    summary_data = models.JSONField(default=dict, blank=True)
    pdf_file = models.FileField(upload_to='reports/%Y/%m/', null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.title} ({self.farmer.username})"
