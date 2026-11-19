from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Farm

User = get_user_model()

class FarmManagementAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = User.objects.create_user(
            username='suresh_patil',
            email='suresh@agrovision.in',
            password='TestPassword123!',
            role='FARMER',
            state='Maharashtra',
            district='Nashik'
        )
        self.other_farmer = User.objects.create_user(
            username='other_farmer',
            email='other@agrovision.in',
            password='TestPassword123!',
            role='FARMER'
        )
        self.client.force_authenticate(user=self.farmer)

        self.farm_payload = {
            'farm_name': 'Green Acres South Plot',
            'state': 'Maharashtra',
            'district': 'Nashik',
            'sub_district': 'Dindori',
            'village': 'Vani',
            'survey_khasra_number': '74/2A',
            'area_hectares': 2.75,
            'latitude': 20.1983,
            'longitude': 73.8821,
            'soil_type': 'BLACK',
            'irrigation_source': 'BOREWELL',
            'irrigation_method': 'DRIP'
        }

    def test_create_farm(self):
        url = '/api/farms/records/'
        response = self.client.post(url, self.farm_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['farm_name'], 'Green Acres South Plot')
        self.assertEqual(float(response.data['area_hectares']), 2.75)
        self.assertEqual(Farm.objects.filter(owner=self.farmer).count(), 1)

    def test_farmer_cannot_access_other_farmer_farm(self):
        # Create farm owned by other_farmer
        other_farm = Farm.objects.create(
            owner=self.other_farmer,
            farm_name='Secret Farm',
            state='Punjab',
            district='Ludhiana',
            area_hectares=5.0,
            soil_type='ALLUVIAL'
        )
        
        # Logged in as self.farmer, should get 404
        url = f'/api/farms/records/{other_farm.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_farm_summary(self):
        Farm.objects.create(
            owner=self.farmer,
            farm_name='Plot A',
            state='Maharashtra',
            district='Nashik',
            area_hectares=3.0,
            soil_type='BLACK'
        )
        Farm.objects.create(
            owner=self.farmer,
            farm_name='Plot B',
            state='Maharashtra',
            district='Nashik',
            area_hectares=2.5,
            soil_type='LOAMY'
        )
        
        response = self.client.get('/api/farms/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_farms'], 2)
        self.assertEqual(response.data['total_area_hectares'], 5.5)

    def test_farm_creation_with_boundary_geojson(self):
        url = '/api/farms/records/'
        payload = self.farm_payload.copy()
        payload['farm_name'] = 'Mapped Parcel with GPS'
        payload['boundary_geojson'] = {
            "type": "Polygon",
            "coordinates": [[[73.88, 20.19], [73.89, 20.19], [73.89, 20.20], [73.88, 20.20], [73.88, 20.19]]]
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('boundary', res.data)
        self.assertIsNotNone(res.data['boundary'])
        self.assertEqual(res.data['boundary']['boundary_geojson']['type'], 'Polygon')

    def test_soil_card_ocr_endpoint(self):
        import io
        import numpy as np
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        arr = np.full((120, 200, 3), 240, dtype=np.uint8)
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        uploaded = SimpleUploadedFile("soil_card.jpg", buf.read(), content_type="image/jpeg")

        url = '/api/farms/soil-card/ocr/'
        res = self.client.post(url, {'card_image': uploaded}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('ph', res.data)
        self.assertIn('nitrogen_n', res.data)
        self.assertIn('phosphorus_p', res.data)
        self.assertIn('potassium_k', res.data)

    def test_soil_card_ocr_accurate_text_extraction(self):
        import io
        from PIL import Image, ImageDraw, ImageFont
        from django.core.files.uploadedfile import SimpleUploadedFile

        img = Image.new('RGB', (1000, 500), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype('arial.ttf', 24)
        except Exception:
            font = ImageFont.load_default()

        d.text((50, 40), 'GOVERNMENT OF INDIA - SOIL HEALTH CARD', fill=(0, 0, 0), font=font)
        d.text((50, 80), 'Card No: MH-NSK-2024-8841   Khasra No: 74/2A', fill=(0, 0, 0), font=font)
        d.text((50, 140), '1. Soil Reaction (pH): 7.6 Neutral', fill=(0, 0, 0), font=font)
        d.text((50, 190), '2. Electrical Conductivity (EC): 0.42 dS/m', fill=(0, 0, 0), font=font)
        d.text((50, 240), '3. Organic Carbon (OC): 0.68 % Medium', fill=(0, 0, 0), font=font)
        d.text((50, 290), '4. Available Nitrogen (N): 245.0 kg/ha', fill=(0, 0, 0), font=font)
        d.text((50, 340), '5. Available Phosphorus (P): 22.5 kg/ha', fill=(0, 0, 0), font=font)
        d.text((50, 390), '6. Available Potassium (K): 295.0 kg/ha', fill=(0, 0, 0), font=font)

        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        uploaded = SimpleUploadedFile("real_soil_card.jpg", buf.read(), content_type="image/jpeg")

        url = '/api/farms/soil-card/ocr/'
        res = self.client.post(url, {'card_image': uploaded}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertEqual(res.data['ph'], 7.6)
        self.assertEqual(res.data['organic_carbon_pct'], 0.68)
        self.assertEqual(res.data['nitrogen_n'], 245.0)
        self.assertEqual(res.data['phosphorus_p'], 22.5)
        self.assertEqual(res.data['potassium_k'], 295.0)
        self.assertEqual(res.data['card_number'], 'MH-NSK-2024-8841')
        self.assertEqual(res.data['survey_khasra_number'], '74/2A')
