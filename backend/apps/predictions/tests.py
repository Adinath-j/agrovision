from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.farms.models import Farm
from apps.crops.models import Crop
from .models import YieldPrediction

User = get_user_model()

class PreSowingYieldPredictionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = User.objects.create_user(
            username='test_farmer',
            email='test@agrovision.in',
            password='TestPassword123!',
            role='FARMER',
            state='Maharashtra',
            district='Nashik'
        )
        self.client.force_authenticate(user=self.farmer)

        self.farm = Farm.objects.create(
            owner=self.farmer,
            farm_name='Test Plot A',
            state='Maharashtra',
            district='Nashik',
            area_hectares=3.0,
            soil_type='BLACK',
            soil_ph=7.1,
            nitrogen_n=240.0,
            phosphorus_p=22.0,
            potassium_k=290.0,
            irrigation_source='BOREWELL',
            irrigation_method='DRIP'
        )

        self.crop = Crop.objects.create(
            name='Soybean',
            category='OILSEED',
            growing_duration_days=105,
            standard_national_yield_kg_per_ha=1250.0
        )

    def test_model_metadata_endpoint(self):
        url = '/api/predictions/model-metadata/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('models_comparison', response.data)
        self.assertIn('XGBoost Regressor', response.data['models_comparison'])
        self.assertIn('top_shap_features', response.data)

    def test_pre_sowing_prediction_execution(self):
        url = '/api/predictions/pre-sowing/'
        payload = {
            'farm_id': self.farm.id,
            'crop_id': self.crop.id,
            'season_name': 'Kharif',
            'area_hectares': 3.0
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('predicted_yield_kg_per_ha', data)
        self.assertGreater(data['predicted_yield_kg_per_ha'], 0)
        self.assertIn('predicted_total_production_tonnes', data)
        self.assertIn('prediction_interval', data)
        self.assertIn('crop_suitability', data)
        self.assertIn('influencing_factors', data)
        self.assertIn('recommendations', data)

        # Check database record persistence
        self.assertTrue(YieldPrediction.objects.filter(farmer=self.farmer, farm=self.farm).exists())
        record = YieldPrediction.objects.get(farmer=self.farmer, farm=self.farm)
        self.assertEqual(float(record.predicted_yield_kg_per_ha), data['predicted_yield_kg_per_ha'])

    def test_in_season_prediction_execution(self):
        # 1. Run pre-sowing first to create baseline
        self.client.post('/api/predictions/pre-sowing/', {
            'farm_id': self.farm.id,
            'crop_id': self.crop.id,
            'season_name': 'Kharif',
            'area_hectares': 3.0
        }, format='json')

        # 2. Run in-season update at VEGETATIVE stage
        url = '/api/predictions/in-season/'
        payload = {
            'farm_id': self.farm.id,
            'crop_id': self.crop.id,
            'growth_stage': 'VEGETATIVE',
            'irrigation_status': 'OPTIMAL',
            'fertilizer_status': 'BALANCED',
            'pest_intensity': 'NONE'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('revised_yield_kg_per_ha', data)
        self.assertIn('delta_yield_pct', data)
        self.assertIn('satellite_snapshot', data)
        self.assertIn('prediction_interval', data)
        self.assertEqual(data['growth_stage'], 'VEGETATIVE')

        # Verify progression endpoint
        prog_res = self.client.get(f'/api/predictions/progression/?farm_id={self.farm.id}&crop_id={self.crop.id}')
        self.assertEqual(prog_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(prog_res.data['total_records'], 2)
        self.assertGreaterEqual(len(prog_res.data['chart_trajectory']), 2)

    def test_pmfby_claim_estimator(self):
        url = '/api/predictions/pmfby-claim/'
        payload = {
            'farm_id': self.farm.id,
            'crop_id': self.crop.id,
            'predicted_yield_kg_ha': 1050.0, # Lower than threshold (1650 * 0.85 = 1402.5)
            'indemnity_level_pct': 85.0,
            'season': 'Kharif'
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('yield_metrics', res.data)
        self.assertIn('financial_summary', res.data)
        self.assertTrue(res.data['claim_status']['is_eligible_for_claim'])
        self.assertGreater(res.data['financial_summary']['estimated_claim_payout_inr'], 0)
