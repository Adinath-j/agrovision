from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
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

        # Automatically dispatch welcome email to user's registered email
        email_sent = False
        try:
            email_sent = send_welcome_email(user)
        except Exception as e:
            print(f"Welcome email trigger notice: {e}")

        return Response({
            "message": "User registered successfully",
            "welcome_email_sent": email_sent,
            "registered_email": user.email,
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


class UpdateFarmerProfileView(generics.UpdateAPIView):
    """Update farmer-specific profile details (land area, crops, PM-KISAN, soil card)."""
    serializer_class = FarmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = FarmerProfile.objects.get_or_create(user=self.request.user)
        return profile
