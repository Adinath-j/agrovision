from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.farms.models import Farm
from apps.satellite.models import SatelliteObservation
from apps.satellite.satellite_service import evaluate_vegetation_health, generate_sentinel2_time_series

class SatelliteMonitoringTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test_sat_farmer',
            email='sat_farmer@example.com',
            password='Password123!',
            role='FARMER'
        )
        self.client.force_authenticate(user=self.user)

        self.farm = Farm.objects.create(
            owner=self.user,
            farm_name='Green Acres Nashik',
            state='Maharashtra',
            district='Nashik',
            area_hectares=2.5,
            latitude=20.0,
            longitude=73.8
        )

    def test_health_evaluation_logic(self):
        self.assertEqual(evaluate_vegetation_health(0.78), "Very Dense / Excellent Vigour")
        self.assertEqual(evaluate_vegetation_health(0.58), "Healthy Vegetative Canopy")
        self.assertEqual(evaluate_vegetation_health(0.40), "Moderate Greenness / Developing")
        self.assertEqual(evaluate_vegetation_health(0.22), "Sparse Foliage / Early Emergence")
        self.assertEqual(evaluate_vegetation_health(0.12), "Stressed / Bare Soil / Post-Harvest")

    def test_generate_sentinel2_time_series(self):
        obs_list = generate_sentinel2_time_series(self.farm)
        self.assertGreater(len(obs_list), 0)
        first = obs_list[0]
        self.assertIsInstance(first, SatelliteObservation)
        self.assertGreaterEqual(float(first.ndvi_mean), 0.15)
        self.assertLessEqual(float(first.ndvi_mean), 0.90)

    def test_satellite_observations_api(self):
        url = reverse('satellite-observations')
        response = self.client.get(f"{url}?farm_id={self.farm.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('summary', response.data)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

    def test_ndvi_time_series_api(self):
        url = reverse('satellite-ndvi')
        response = self.client.get(f"{url}?farm_id={self.farm.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('time_series', response.data)
        self.assertIn('reference_thresholds', response.data)
