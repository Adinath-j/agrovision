from django.urls import path
from .views import CurrentWeatherView, ForecastView, WeatherAlertsView, SyncUserWeatherView

urlpatterns = [
    path('current/', CurrentWeatherView.as_view(), name='weather-current'),
    path('forecast/', ForecastView.as_view(), name='weather-forecast'),
    path('alerts/', WeatherAlertsView.as_view(), name='weather-alerts'),
    path('sync/', SyncUserWeatherView.as_view(), name='weather-sync'),
]
