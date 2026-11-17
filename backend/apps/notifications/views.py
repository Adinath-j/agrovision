from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.farms.models import Farm
from apps.crops.models import Crop
from .models import Notification
from .email_service import send_crop_advisory_email, get_crop_agronomic_guide

class NotificationListView(APIView):
    """List unread and recent notifications for the logged-in user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notes = Notification.objects.filter(recipient=request.user)
        return Response({
            "unread_count": notes.filter(is_read=False).count(),
            "notifications": [
                {
                    "id": n.id,
                    "type": n.notification_type,
                    "title": n.title,
                    "message": n.message,
                    "is_read": n.is_read,
                    "action_url": n.action_url,
                    "date": n.created_at.strftime('%Y-%m-%d %H:%M')
                } for n in notes[:20]
            ]
        })


class MarkNotificationReadView(APIView):
    """Mark a notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Notification.objects.get(pk=pk, recipient=request.user)
            note.is_read = True
            note.save()
            return Response({"status": "marked_as_read"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)


class CropNutritionGuidelineView(APIView):
    """
    Returns agronomic plant nutrition, chemicals, and watering measures
    for a selected crop name.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        crop_name = request.query_params.get('crop', 'Soybean')
        guide = get_crop_agronomic_guide(crop_name)
        return Response({
            "crop": crop_name,
            "guidelines": guide
        }, status=status.HTTP_200_OK)


class SendCropAdvisoryEmailView(APIView):
    """
    Dispatches plant watering measure and nutrition schedule
    to the farmer's registered email address.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        crop_name = request.data.get('crop_name', 'Soybean')
        farm_id = request.data.get('farm_id')

        farm = None
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id)
            except Farm.DoesNotExist:
                pass
        if not farm:
            farm = Farm.objects.filter(owner=user).first() or Farm.objects.first()

        result = send_crop_advisory_email(user, crop_name=crop_name, farm=farm)
        if result.get('success'):
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

