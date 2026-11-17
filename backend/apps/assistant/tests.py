from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.farms.models import Farm
from apps.assistant.models import ChatConversation, ChatMessage

class AssistantTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='chat_farmer',
            email='chat@example.com',
            password='TestPassword123!',
            role='FARMER',
            state='Maharashtra',
            district='Nashik'
        )
        self.client.force_authenticate(user=self.user)

        self.farm = Farm.objects.create(
            owner=self.user,
            farm_name='Shri Krishna Farm',
            state='Maharashtra',
            district='Nashik',
            area_hectares=3.5,
            soil_type='BLACK',
            soil_ph=7.2,
            nitrogen_n=230.0,
            phosphorus_p=24.0,
            potassium_k=310.0
        )

    def test_chat_english(self):
        url = reverse('assistant-chat')
        res = self.client.post(url, {
            'message': 'What is the optimal sowing date for Soybean in Nashik?',
            'language': 'en',
            'farm_id': self.farm.id
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertIn('response', res.data)
        self.assertIn('Nashik', res.data['response'])
        self.assertIn('suggested_prompts', res.data)
        self.assertTrue(ChatMessage.objects.filter(conversation_id=res.data['conversation_id']).exists())

    def test_chat_hindi(self):
        url = reverse('assistant-chat')
        res = self.client.post(url, {
            'message': 'सोयाबीन की बुवाई कब करनी चाहिए?',
            'language': 'hi',
            'farm_id': self.farm.id
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['language'], 'hi')
        self.assertIn('बुवाई', res.data['response'])

    def test_chat_marathi(self):
        url = reverse('assistant-chat')
        res = self.client.post(url, {
            'message': 'खतांची मात्रा कशी द्यावी?',
            'language': 'mr',
            'farm_id': self.farm.id
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['language'], 'mr')
        self.assertIn('NPK', res.data['response'])

    def test_empty_message_validation(self):
        url = reverse('assistant-chat')
        res = self.client.post(url, {'message': '   '}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_conversation_thread_retrieval(self):
        conv = ChatConversation.objects.create(
            farmer=self.user,
            farm=self.farm,
            title='Test Sowing Advice',
            language='en'
        )
        ChatMessage.objects.create(
            conversation=conv,
            sender=ChatMessage.Sender.FARMER,
            content='Hello assistant'
        )
        ChatMessage.objects.create(
            conversation=conv,
            sender=ChatMessage.Sender.ASSISTANT,
            content='Namaste farmer'
        )

        url = reverse('assistant-conversation-messages', kwargs={'conv_id': conv.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['messages']), 2)
