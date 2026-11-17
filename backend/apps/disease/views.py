from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import DiseaseDetection
from .disease_service import process_disease_diagnosis

class DiseaseHistoryView(APIView):
    """List historical disease detection diagnoses for the authenticated farmer."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        scans = DiseaseDetection.objects.filter(farmer=request.user).order_by('-created_at')
        results = []
        for s in scans:
            results.append({
                "id": s.id,
                "disease": s.predicted_disease,
                "confidence": float(s.confidence_score),
                "is_healthy": s.is_healthy,
                "date": s.created_at.strftime('%Y-%m-%d %H:%M'),
                "image_url": s.leaf_image.url if s.leaf_image else None,
                "farm_name": s.farm.farm_name if s.farm else None,
                "crop_name": s.crop.name if s.crop else "General",
                "expert_consultation_requested": s.expert_consultation_requested
            })
        return Response({
            "count": len(results),
            "results": results
        })


class DiseasePredictView(APIView):
    """
    Image-based crop disease diagnosis API endpoint.
    Accepts leaf photograph, returns disease classification, confidence, symptoms, and organic/chemical remedies.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user
        image_file = request.FILES.get('image')

        if not image_file:
            return Response(
                {"error": "No leaf image uploaded. Please upload a clear photo of an affected leaf."},
                status=status.HTTP_400_BAD_REQUEST
            )

        crop_name = request.data.get('crop_name', 'Soybean')
        farm_id = request.data.get('farm_id')
        crop_id = request.data.get('crop_id')

        try:
            result = process_disease_diagnosis(
                farmer=user,
                image_file=image_file,
                farm_id=farm_id,
                crop_id=crop_id,
                crop_name=crop_name
            )

            if result.get("status") == "error":
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Disease classification failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RequestExpertConsultationView(APIView):
    """Flag a scan for human agronomist review."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, scan_id):
        try:
            scan = DiseaseDetection.objects.get(id=scan_id, farmer=request.user)
            scan.expert_consultation_requested = True
            scan.save()
            return Response({
                "status": "success",
                "message": "Your scan has been referred to our Krishi Vigyan Kendra agronomist panel. A specialist will review your symptoms."
            })
        except DiseaseDetection.DoesNotExist:
            return Response({"error": "Scan record not found."}, status=status.HTTP_404_NOT_FOUND)
