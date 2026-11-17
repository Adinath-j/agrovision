from django.urls import path
from .views import CropListView, CropDetailView, CropSeasonListView, StateDistrictListView

urlpatterns = [
    path('', CropListView.as_view(), name='crop-list-root'),
    path('list/', CropListView.as_view(), name='crop-list'),
    path('detail/<int:pk>/', CropDetailView.as_view(), name='crop-detail'),
    path('<int:pk>/', CropDetailView.as_view(), name='crop-detail-root'),
    path('seasons/', CropSeasonListView.as_view(), name='crop-seasons'),
    path('locations/', StateDistrictListView.as_view(), name='state-districts'),
]
