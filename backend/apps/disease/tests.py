import io
import numpy as np
from PIL import Image
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.farms.models import Farm
from apps.crops.models import Crop
from apps.disease.models import DiseaseDetection

class DiseaseDetectionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='disease_farmer',
            email='disease_farmer@example.com',
            password='TestPassword123!',
            role='FARMER'
        )
        self.client.force_authenticate(user=self.user)

        self.farm = Farm.objects.create(
            owner=self.user,
            farm_name='Plot Beta',
            state='Maharashtra',
            district='Nashik',
            area_hectares=2.0
        )

        self.crop = Crop.objects.create(
            name='Soybean',
            category='OILSEED',
            growing_duration_days=105
        )

    def _generate_test_image(self, r_val=40, g_val=160, b_val=50):
        """Helper to create simulated leaf image buffer."""
        arr = np.zeros((224, 224, 3), dtype=np.uint8)
        arr[:, :, 0] = r_val
        arr[:, :, 1] = g_val
        arr[:, :, 2] = b_val
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        return buf

    def test_disease_predict_healthy_leaf(self):
        buf = self._generate_test_image(40, 160, 50) # Green leaf
        uploaded = SimpleUploadedFile("leaf.jpg", buf.read(), content_type="image/jpeg")

        url = reverse('disease-predict')
        response = self.client.post(url, {
            'image': uploaded,
            'crop_name': 'Soybean',
            'farm_id': self.farm.id
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertTrue(response.data['is_healthy'])
        self.assertGreater(response.data['confidence_score'], 70.0)
        self.assertIn('symptoms', response.data)
        self.assertIn('suggested_actions', response.data)

        # Check DB record
        self.assertTrue(DiseaseDetection.objects.filter(farmer=self.user).exists())

    def test_disease_predict_rust_leaf(self):
        buf = self._generate_test_image(175, 120, 35) # Brown / rust colored
        uploaded = SimpleUploadedFile("rust_leaf.jpg", buf.read(), content_type="image/jpeg")

        url = reverse('disease-predict')
        response = self.client.post(url, {
            'image': uploaded,
            'crop_name': 'Soybean',
            'farm_id': self.farm.id
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertFalse(response.data['is_healthy'])
        self.assertIn('Rust', response.data['predicted_disease'])
        self.assertIn('suggested_actions', response.data)

    def test_disease_predict_missing_image(self):
        url = reverse('disease-predict')
        response = self.client.post(url, {'crop_name': 'Soybean'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_disease_history_and_expert_consult(self):
        scan = DiseaseDetection.objects.create(
            farmer=self.user,
            farm=self.farm,
            crop=self.crop,
            predicted_disease="Soybean Rust",
            confidence_score=92.5,
            is_healthy=False
        )

        # Check history
        hist_url = reverse('disease-history')
        hist_res = self.client.get(hist_url)
        self.assertEqual(hist_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(hist_res.data['count'], 1)

        # Request expert consultation
        consult_url = reverse('disease-consult', kwargs={'scan_id': scan.id})
        consult_res = self.client.post(consult_url)
        self.assertEqual(consult_res.status_code, status.HTTP_200_OK)
        scan.refresh_from_db()
        self.assertTrue(scan.expert_consultation_requested)
