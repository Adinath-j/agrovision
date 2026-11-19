"""
URL configuration for AGROVISION project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """System health check and diagnostic endpoint."""
    return Response({
        "status": "online",
        "system": "AGROVISION – AI-Powered Crop Yield Prediction and Optimization System",
        "project_reference": "Smart India Hackathon 2025 – SIH25044",
        "version": "1.0.0",
        "database": getattr(settings, 'DB_STATUS_LABEL', 'Configured'),
        "debug_mode": settings.DEBUG,
        "supported_states": ["Maharashtra", "Karnataka", "Gujarat", "Madhya Pradesh", "Punjab", "Uttar Pradesh"],
        "modules": {
            "authentication": "Active (Phase 1)",
            "farm_management": "Active (Phase 1)",
            "crop_management": "Active (Phase 1)",
            "pre_sowing_prediction": "Phase 3 Foundation Ready",
            "in_season_prediction": "Phase 6 Foundation Ready",
            "crop_disease_detection": "Phase 7 Foundation Ready",
            "market_price_intelligence": "Phase 4 Foundation Ready",
            "weather_monitoring_alerts": "Phase 4 Foundation Ready",
            "satellite_crop_monitoring": "Phase 5 Foundation Ready",
            "ai_farming_assistant": "Phase 8 Foundation Ready",
            "crop_optimization_engine": "Phase 9 Foundation Ready",
            "reports_and_analytics": "Phase 10 Foundation Ready",
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='system-health'),

    # OpenAPI 3 Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Application API Endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/farms/', include('apps.farms.urls')),
    path('api/v1/farms/', include('apps.farms.urls')),
    path('api/crops/', include('apps.crops.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/disease/', include('apps.disease.urls')),
    path('api/v1/disease/', include('apps.disease.urls')),
    path('api/weather/', include('apps.weather.urls')),
    path('api/v1/weather/', include('apps.weather.urls')),
    path('api/satellite/', include('apps.satellite.urls')),
    path('api/market/', include('apps.market.urls')),
    path('api/assistant/', include('apps.assistant.urls')),
    path('api/optimization/', include('apps.optimization.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
