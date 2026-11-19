from django.urls import path
from .views import (
    DiseasePredictView,
    DiseaseHistoryView,
    DiseaseDetailView,
    RequestExpertConsultationView,
    DiseasePrescriptionView,
    DiseaseCatalogView,
    DiseaseSamplesView,
)

urlpatterns = [
    path('predict/', DiseasePredictView.as_view(), name='disease-predict'),
    path('history/', DiseaseHistoryView.as_view(), name='disease-history'),
    path('detail/<int:scan_id>/', DiseaseDetailView.as_view(), name='disease-detail'),
    path('consult/<int:scan_id>/', RequestExpertConsultationView.as_view(), name='disease-consult'),
    path('prescription/<int:scan_id>/', DiseasePrescriptionView.as_view(), name='disease-prescription'),
    path('catalog/', DiseaseCatalogView.as_view(), name='disease-catalog'),
    path('samples/', DiseaseSamplesView.as_view(), name='disease-samples'),
]
