from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, FarmerProfileSerializer
from .models import FarmerProfile
from apps.notifications.email_service import send_welcome_email

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user (Farmer, Admin, Expert) with an optional FarmerProfile."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        refresh = RefreshToken.for_user(user)

        email_sent = False
        try:
            email_sent = send_welcome_email(user)
        except Exception as e:
            print(f"Welcome email trigger notice: {e}")

        return Response({
            "message": "User registered successfully",
            "welcome_email_sent": email_sent,
            "registered_email": user.email,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate user with username and password, returns JWT tokens and user payload."""
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class CurrentUserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile and farmer details."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        try:
            from apps.weather.weather_service import sync_user_location_weather
            sync_user_location_weather(user)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Error syncing weather on profile update: {e}")


class UpdateFarmerProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update farmer-specific profile details (land area, crops, PM-KISAN, soil card)."""
    serializer_class = FarmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = FarmerProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        profile = serializer.save()
        try:
            from apps.weather.weather_service import sync_user_location_weather
            sync_user_location_weather(profile.user)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Error syncing weather on farmer profile update: {e}")
