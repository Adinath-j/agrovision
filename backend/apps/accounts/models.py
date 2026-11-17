from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        FARMER = 'FARMER', _('Farmer')
        ADMIN = 'ADMIN', _('Administrator')
        EXPERT = 'EXPERT', _('Agricultural Expert')

    class Language(models.TextChoices):
        ENGLISH = 'en', _('English')
        HINDI = 'hi', _('Hindi (हिंदी)')
        MARATHI = 'mr', _('Marathi (मराठी)')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.FARMER,
        help_text=_('User role within the AGROVISION system')
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True, unique=False)
    preferred_language = models.CharField(
        max_length=10,
        choices=Language.choices,
        default=Language.ENGLISH
    )
    state = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    village = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_farmer(self):
        return self.role == self.Role.FARMER

    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class FarmerProfile(models.Model):
    class LandCategory(models.TextChoices):
        MARGINAL = 'MARGINAL', _('Marginal (< 1 Hectare)')
        SMALL = 'SMALL', _('Small (1 - 2 Hectares)')
        SEMI_MEDIUM = 'SEMI_MEDIUM', _('Semi-Medium (2 - 4 Hectares)')
        MEDIUM = 'MEDIUM', _('Medium (4 - 10 Hectares)')
        LARGE = 'LARGE', _('Large (> 10 Hectares)')

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='farmer_profile'
    )
    experience_years = models.PositiveIntegerField(default=1, help_text=_('Farming experience in years'))
    primary_crops = models.JSONField(default=list, blank=True, help_text=_('List of primary crops cultivated'))
    land_holding_category = models.CharField(
        max_length=20,
        choices=LandCategory.choices,
        default=LandCategory.SMALL
    )
    total_land_area_hectares = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=1.00,
        help_text=_('Total farmland area owned or managed in hectares')
    )
    has_soil_health_card = models.BooleanField(
        default=False,
        help_text=_('Whether farmer has a Government Soil Health Card')
    )
    soil_health_card_number = models.CharField(max_length=50, blank=True, default='')
    pm_kisan_registered = models.BooleanField(
        default=False,
        help_text=_('Registered under PM-KISAN Samman Nidhi')
    )
    preferred_mandi = models.CharField(max_length=120, blank=True, default='')
    annual_income_range = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username} - {self.total_land_area_hectares} ha"
