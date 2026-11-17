from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.crops.models import Crop
from .models import Market, MarketPrice
from datetime import date

class MarketPriceAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.crop = Crop.objects.create(name='Soybean', category='OILSEED')
        self.market = Market.objects.create(
            mandi_name='Nashik APMC',
            state='Maharashtra',
            district='Nashik'
        )
        self.price = MarketPrice.objects.create(
            market=self.market,
            crop=self.crop,
            price_date=date.today(),
            min_price_rs_per_quintal=4400.0,
            max_price_rs_per_quintal=4800.0,
            modal_price_rs_per_quintal=4650.0,
            arrivals_tonnes=350.0
        )

    def test_market_prices_list(self):
        url = '/api/market/prices/?crop=Soybean'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
        self.assertEqual(response.data['results'][0]['mandi'], 'Nashik APMC')

    def test_market_price_compare(self):
        url = '/api/market/compare/?crop=Soybean'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('comparison', response.data)
        self.assertIn('best_market_opportunity', response.data)

    def test_gross_revenue_estimation(self):
        url = '/api/market/revenue-estimate/'
        payload = {
            'crop_name': 'Soybean',
            'mandi_name': 'Nashik APMC',
            'production_tonnes': 3.5,
            'modal_price_rs_per_quintal': 4650.0
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 3.5 T = 35 Q * 4650 = 162,750
        self.assertEqual(response.data['estimated_gross_revenue_rs'], 162750.0)
        self.assertIn('disclaimer', response.data)
