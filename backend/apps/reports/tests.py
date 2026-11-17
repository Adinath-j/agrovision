from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.farms.models import Farm
from apps.crops.models import Crop
from apps.predictions.models import YieldPrediction
from apps.reports.models import GeneratedReport

class ReportsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='report_farmer',
            email='report_farmer@example.com',
            password='TestPassword123!',
            role='FARMER',
            state='Maharashtra',
            district='Nashik'
        )
        self.client.force_authenticate(user=self.user)

        self.farm = Farm.objects.create(
            owner=self.user,
            farm_name='Sai Krupa Plot',
            state='Maharashtra',
            district='Nashik',
            area_hectares=4.0,
            soil_type='BLACK',
            soil_ph=7.3,
            nitrogen_n=240.0,
            phosphorus_p=22.0,
            potassium_k=290.0,
            irrigation_method='DRIP'
        )

        self.crop = Crop.objects.create(
            name='Soybean',
            category='OILSEED',
            growing_duration_days=105
        )

        self.pred = YieldPrediction.objects.create(
            farm=self.farm,
            farmer=self.user,
            crop=self.crop,
            stage=YieldPrediction.Stage.IN_SEASON,
            growth_stage='FLOWERING',
            predicted_yield_kg_per_ha=2600.0,
            predicted_total_production_tonnes=10.4,
            is_latest=True
        )

    def test_yield_report_dossier_endpoint(self):
        url = reverse('report-yield')
        res = self.client.get(f"{url}?farm_id={self.farm.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('dossier', res.data)
        dossier = res.data['dossier']
        self.assertIn('yield_intelligence', dossier)
        self.assertIn('remote_sensing', dossier)
        self.assertIn('market_valuation', dossier)
        self.assertGreater(dossier['market_valuation']['gross_revenue_estimate_inr'], 0)

        # Check report saved in database
        self.assertTrue(GeneratedReport.objects.filter(farmer=self.user).exists())

    def test_farm_audit_report_endpoint(self):
        url = reverse('report-farm')
        res = self.client.get(f"{url}?farm_id={self.farm.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('farm_audit', res.data)
        audit = res.data['farm_audit']
        self.assertGreater(audit['soil_health_index'], 50)

    def test_report_list_endpoint(self):
        GeneratedReport.objects.create(
            farmer=self.user,
            farm=self.farm,
            report_type=GeneratedReport.ReportType.YIELD_SUMMARY,
            title='Sample Harvest Dossier'
        )
        url = reverse('report-list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['count'], 1)
