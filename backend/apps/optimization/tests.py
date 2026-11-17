from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.farms.models import Farm
from apps.crops.models import Crop
from apps.optimization.models import Recommendation
from apps.optimization.optimization_service import (
    calculate_irrigation_optimization,
    calculate_fertilizer_optimization,
    generate_full_farm_optimization
)

class OptimizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='opt_farmer',
            email='opt_farmer@example.com',
            password='TestPassword123!',
            role='FARMER',
            state='Maharashtra',
            district='Nashik'
        )
        self.client.force_authenticate(user=self.user)

        self.farm = Farm.objects.create(
            owner=self.user,
            farm_name='Surya Farm',
            state='Maharashtra',
            district='Nashik',
            area_hectares=2.5,
            soil_type='BLACK',
            soil_ph=7.4,
            nitrogen_n=210.0,
            phosphorus_p=16.0,
            potassium_k=270.0,
            irrigation_method='DRIP'
        )

        self.crop = Crop.objects.create(
            name='Soybean',
            category='OILSEED',
            growing_duration_days=105
        )

    def test_irrigation_calculation(self):
        plan = calculate_irrigation_optimization(self.farm, self.crop, growth_stage='FLOWERING')
        self.assertGreater(plan['daily_crop_water_etc_mm'], 0)
        self.assertGreater(plan['water_volume_liters'], 0)
        self.assertEqual(plan['system_efficiency_pct'], 90) # Drip
        self.assertIn('next_irrigation_date', plan)

    def test_fertilizer_calculation(self):
        fert = calculate_fertilizer_optimization(self.farm, self.crop)
        self.assertIn('target_npk_kg_ha', fert)
        self.assertIn('commercial_bags_total', fert)
        self.assertGreater(fert['commercial_bags_total']['dap_50kg_bags'], 0)
        self.assertEqual(len(fert['split_schedule']), 3)

    def test_generate_full_farm_optimization(self):
        recs = generate_full_farm_optimization(self.farm, self.crop)
        self.assertGreaterEqual(len(recs), 3)
        self.assertTrue(Recommendation.objects.filter(farm=self.farm).exists())

    def test_recommendations_api(self):
        url = reverse('optimization-recommendations')
        res = self.client.get(f"{url}?farm_id={self.farm.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('irrigation_plan', res.data)
        self.assertIn('fertilizer_plan', res.data)
        self.assertGreaterEqual(len(res.data['recommendations']), 3)

    def test_toggle_implemented_endpoint(self):
        rec = Recommendation.objects.create(
            farm=self.farm,
            crop=self.crop,
            category=Recommendation.Category.IRRIGATION,
            title='Test Drip Schedule',
            recommendation_text='Run drip 2 hrs',
            is_implemented=False
        )

        url = reverse('optimization-toggle', kwargs={'rec_id': rec.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        rec.refresh_from_db()
        self.assertTrue(rec.is_implemented)
