from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.farms.models import Farm

User = get_user_model()

class WeatherMonitoringAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = User.objects.create_user(
            username='weather_tester',
            email='weather@agrovision.in',
            password='TestPassword123!',
            role='FARMER'
        )
        self.client.force_authenticate(user=self.farmer)

        self.farm = Farm.objects.create(
            owner=self.farmer,
            farm_name='Dindori Valley Farm',
            state='Maharashtra',
            district='Nashik',
            area_hectares=3.2,
            latitude=20.1983,
            longitude=73.8821,
            soil_type='BLACK'
        )

    def test_current_weather_endpoint(self):
        url = f'/api/weather/current/?farm_id={self.farm.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current', response.data)
        self.assertIn('temperature_c', response.data['current'])
        self.assertIn('forecast_7_day', response.data)
        self.assertIn('alerts', response.data)

    def test_forecast_endpoint(self):
        url = f'/api/weather/forecast/?farm_id={self.farm.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('forecast_7_day', response.data)
        self.assertEqual(len(response.data['forecast_7_day']), 7)
