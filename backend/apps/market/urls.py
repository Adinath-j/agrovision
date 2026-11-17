from django.urls import path
from .views import MarketPriceListView, MarketPriceCompareView, MarketPriceTrendsView, GrossRevenueEstimateView

urlpatterns = [
    path('prices/', MarketPriceListView.as_view(), name='market-prices'),
    path('compare/', MarketPriceCompareView.as_view(), name='market-compare'),
    path('trends/', MarketPriceTrendsView.as_view(), name='market-trends'),
    path('revenue-estimate/', GrossRevenueEstimateView.as_view(), name='market-revenue-estimate'),
]
