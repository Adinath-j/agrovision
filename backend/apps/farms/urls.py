from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmViewSet, FarmBoundaryViewSet, SoilRecordViewSet, FarmSummaryView, SoilCardOCRView

router = DefaultRouter()
router.register(r'records', FarmViewSet, basename='farm')
router.register(r'boundaries', FarmBoundaryViewSet, basename='farm-boundary')
router.register(r'soil-records', SoilRecordViewSet, basename='soil-record')

urlpatterns = [
    path('summary/', FarmSummaryView.as_view(), name='farm-summary'),
    path('soil-card/ocr/', SoilCardOCRView.as_view(), name='soil-card-ocr'),
    path('', FarmViewSet.as_view({'get': 'list', 'post': 'create'}), name='farm-list-root'),
    path('<int:pk>/', FarmViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='farm-detail-root'),
    path('', include(router.urls)),
]
