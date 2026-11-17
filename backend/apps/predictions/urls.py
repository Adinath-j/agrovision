from django.urls import path
from .views import (
    YieldPredictionHistoryView,
    PreSowingPredictionEndpoint,
    PreSowingModelMetadataView,
    InSeasonPredictionEndpoint,
    YieldProgressionView,
    PMFBYClaimEstimatorView
)

urlpatterns = [
    path('history/', YieldPredictionHistoryView.as_view(), name='prediction-history'),
    path('pre-sowing/', PreSowingPredictionEndpoint.as_view(), name='prediction-pre-sowing'),
    path('model-metadata/', PreSowingModelMetadataView.as_view(), name='prediction-model-metadata'),
    path('in-season/', InSeasonPredictionEndpoint.as_view(), name='prediction-in-season'),
    path('progression/', YieldProgressionView.as_view(), name='prediction-progression'),
    path('pmfby-claim/', PMFBYClaimEstimatorView.as_view(), name='prediction-pmfby-claim'),
]
