from django.urls import path
from .views import DiseasePredictView, DiseaseHistoryView, RequestExpertConsultationView

urlpatterns = [
    path('predict/', DiseasePredictView.as_view(), name='disease-predict'),
    path('history/', DiseaseHistoryView.as_view(), name='disease-history'),
    path('consult/<int:scan_id>/', RequestExpertConsultationView.as_view(), name='disease-consult'),
]
