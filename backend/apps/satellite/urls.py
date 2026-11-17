from django.urls import path
from .views import SatelliteObservationListView, NDVITimeSeriesView

urlpatterns = [
    path('observations/', SatelliteObservationListView.as_view(), name='satellite-observations'),
    path('ndvi/', NDVITimeSeriesView.as_view(), name='satellite-ndvi'),
]
