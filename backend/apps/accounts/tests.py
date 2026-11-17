from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'

        self.farmer_data = {
            'username': 'ramesh_farmer',
            'email': 'ramesh@agrovision.in',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Ramesh',
            'last_name': 'Patil',
            'phone_number': '9876543210',
            'role': 'FARMER',
            'preferred_language': 'mr',
            'state': 'Maharashtra',
            'district': 'Nashik',
            'village': 'Dindori',
            'total_land_area_hectares': 3.5,
            'primary_crops': ['Soybean', 'Wheat', 'Sugarcane']
        }

    def test_farmer_registration(self):
        response = self.client.post(self.register_url, self.farmer_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['username'], 'ramesh_farmer')
        self.assertEqual(response.data['user']['role'], 'FARMER')
        self.assertTrue(User.objects.filter(username='ramesh_farmer').exists())
        
        user = User.objects.get(username='ramesh_farmer')
        self.assertTrue(hasattr(user, 'farmer_profile'))
        self.assertEqual(float(user.farmer_profile.total_land_area_hectares), 3.5)

    def test_farmer_login(self):
        # Register first
        self.client.post(self.register_url, self.farmer_data, format='json')
        
        # Login
        login_data = {
            'username': 'ramesh_farmer',
            'password': 'SecurePassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'ramesh_farmer')

    def test_protected_profile_endpoint(self):
        # Unauthenticated request should fail
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate
        self.client.post(self.register_url, self.farmer_data, format='json')
        login_res = self.client.post(self.login_url, {
            'username': 'ramesh_farmer',
            'password': 'SecurePassword123!'
        }, format='json')
        token = login_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'ramesh@agrovision.in')
