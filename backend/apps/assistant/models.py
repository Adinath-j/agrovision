from django.db import models
from django.conf import settings
from apps.farms.models import Farm

class ChatConversation(models.Model):
    farmer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_conversations')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200, default='New Agronomic Advisory Session')
    language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class ChatMessage(models.Model):
    class Sender(models.TextChoices):
        FARMER = 'FARMER', 'Farmer'
        ASSISTANT = 'ASSISTANT', 'AI Assistant'
        SYSTEM = 'SYSTEM', 'System Alert'

    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=Sender.choices)
    content = models.TextField()
    context_used = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
