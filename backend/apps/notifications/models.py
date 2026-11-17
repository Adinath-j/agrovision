from django.db import models
from django.conf import settings

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        WEATHER = 'WEATHER', 'Weather Alert'
        PREDICTION = 'PREDICTION', 'Yield Prediction Update'
        DISEASE = 'DISEASE', 'Crop Disease Warning'
        MARKET = 'MARKET', 'Market Price Spike / Drop'
        SYSTEM = 'SYSTEM', 'System Announcement'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.recipient.username}"
