"""
Disease Detection Backend Service.
Smart India Hackathon 2025 - SIH25044.
"""

from django.core.files.uploadedfile import UploadedFile
from apps.farms.models import Farm
from apps.crops.models import Crop
from .models import DiseaseDetection
from ml_engine.disease_detection.disease_classifier import classify_leaf_image

def process_disease_diagnosis(farmer, image_file, farm_id=None, crop_id=None, crop_name: str = 'Soybean') -> dict:
    """
    Handles leaf image analysis, persists diagnosis record, and returns treatment payload.
    """
    farm = None
    if farm_id:
        farm = Farm.objects.filter(id=farm_id, owner=farmer).first()

    crop = None
    if crop_id:
        crop = Crop.objects.filter(id=crop_id).first()
        if crop:
            crop_name = crop.name
    elif crop_name:
        crop = Crop.objects.filter(name__iexact=crop_name).first()

    # Run computer vision classification
    diagnosis = classify_leaf_image(image_file, crop_name=crop_name)

    if diagnosis.get("status") == "error":
        return diagnosis

    # Persist in DiseaseDetection model
    scan_record = DiseaseDetection.objects.create(
        farmer=farmer,
        farm=farm,
        crop=crop,
        leaf_image=image_file,
        predicted_disease=diagnosis["predicted_disease"],
        confidence_score=float(diagnosis["confidence_score"]),
        is_healthy=diagnosis.get("is_healthy", False),
        symptoms="\n".join(diagnosis.get("symptoms", [])),
        causes="\n".join(diagnosis.get("causes", [])),
        preventive_measures=diagnosis.get("preventive_measures", []),
        suggested_actions=diagnosis.get("suggested_actions", []),
        expert_consultation_requested=False,
        notes=diagnosis.get("safety_warning", "")
    )

    diagnosis["scan_id"] = scan_record.id
    diagnosis["image_url"] = scan_record.leaf_image.url if scan_record.leaf_image else None
    diagnosis["diagnosis_date"] = scan_record.created_at.strftime("%d %b %Y, %H:%M")
    if farm:
        diagnosis["farm_name"] = farm.farm_name

    return diagnosis
