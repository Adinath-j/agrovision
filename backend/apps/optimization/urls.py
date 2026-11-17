from django.urls import path
from .views import RecommendationsView, ToggleImplementedView

urlpatterns = [
    path('recommendations/', RecommendationsView.as_view(), name='optimization-recommendations'),
    path('recommendations/<int:rec_id>/toggle/', ToggleImplementedView.as_view(), name='optimization-toggle'),
]
