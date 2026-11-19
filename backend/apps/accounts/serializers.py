from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import FarmerProfile

User = get_user_model()


def _infer_land_category(area_ha: float) -> str:
    ha = float(area_ha or 1.0)
    if ha < 1.0:
        return FarmerProfile.LandCategory.MARGINAL
    if ha <= 2.0:
        return FarmerProfile.LandCategory.SMALL
    if ha <= 4.0:
        return FarmerProfile.LandCategory.SEMI_MEDIUM
    if ha <= 10.0:
        return FarmerProfile.LandCategory.MEDIUM
    return FarmerProfile.LandCategory.LARGE


class FarmerProfileSerializer(serializers.ModelSerializer):
    land_holding_category_display = serializers.CharField(source='get_land_holding_category_display', read_only=True)

    class Meta:
        model = FarmerProfile
        fields = [
            'id',
            'experience_years',
            'primary_crops',
            'land_holding_category',
            'land_holding_category_display',
            'total_land_area_hectares',
            'has_soil_health_card',
            'soil_health_card_number',
            'pm_kisan_registered',
            'preferred_mandi',
            'annual_income_range',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    farmer_profile = FarmerProfileSerializer(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    language_display = serializers.CharField(source='get_preferred_language_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'role_display',
            'preferred_language',
            'language_display',
            'state',
            'district',
            'village',
            'farmer_profile',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'role', 'date_joined', 'last_login']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    # Optional FarmerProfile initial fields during registration
    experience_years = serializers.IntegerField(required=False, default=2)
    total_land_area_hectares = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=2.0)
    primary_crops = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'preferred_language',
            'state',
            'district',
            'village',
            'experience_years',
            'total_land_area_hectares',
            'primary_crops',
        ]

    def validate_role(self, value):
        # Prevent public self-registration as ADMIN
        if value == User.Role.ADMIN:
            return User.Role.FARMER
        return value or User.Role.FARMER

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Password fields do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        experience_years = validated_data.pop('experience_years', 2)
        total_land_area_hectares = validated_data.pop('total_land_area_hectares', 2.0)
        primary_crops = validated_data.pop('primary_crops', [])

        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        if user.role == User.Role.FARMER:
            FarmerProfile.objects.create(
                user=user,
                experience_years=experience_years,
                total_land_area_hectares=total_land_area_hectares,
                land_holding_category=_infer_land_category(total_land_area_hectares),
                primary_crops=primary_crops
            )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid username or password credentials.")

        if not user.is_active:
            raise serializers.ValidationError("User account is inactive.")

        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }