from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    CropNutritionGuidelineView,
    SendCropAdvisoryEmailView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('plant-nutrition/', CropNutritionGuidelineView.as_view(), name='plant-nutrition'),
    path('send-crop-advisory-email/', SendCropAdvisoryEmailView.as_view(), name='send-crop-advisory-email'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
]
