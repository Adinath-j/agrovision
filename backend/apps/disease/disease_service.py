"""
Disease Detection Backend Service.
Smart India Hackathon 2025 - SIH25044.

Provides end-to-end foliar diagnosis orchestration:
1. Computer vision classification with severity staging & lesion overlay
2. Weather-disease correlation analysis
3. Database persistence and audit tracking
4. Historical detail retrieval and printable Rx prescription generation
5. Disease catalog knowledge repository & demo sample leaves
"""

import json
import io
import base64
import numpy as np
from PIL import Image
from django.core.files.uploadedfile import UploadedFile
from apps.farms.models import Farm
from apps.crops.models import Crop
from .models import DiseaseDetection
from ml_engine.disease_detection.disease_classifier import classify_leaf_image
from ml_engine.disease_detection.disease_kb import DISEASE_PROFILES


def process_disease_diagnosis(farmer, image_file, farm_id=None, crop_id=None, crop_name: str = 'Soybean') -> dict:
    """
    Handles leaf image analysis, persists diagnosis record, and returns treatment payload.
    """
    farm = None
    weather_context = None

    if farm_id:
        farm = Farm.objects.filter(id=farm_id, owner=farmer).first()
    elif farmer:
        farm = Farm.objects.filter(owner=farmer).first()

    if farm:
        # Check latest weather observation for microclimate risk evaluation
        latest_obs = farm.weather_observations.order_by('-observation_datetime').first()
        if latest_obs:
            weather_context = {
                'temperature_c': float(latest_obs.temperature_c),
                'humidity_pct': float(latest_obs.relative_humidity_pct),
            }

    crop = None
    if crop_id:
        crop = Crop.objects.filter(id=crop_id).first()
        if crop:
            crop_name = crop.name
    elif crop_name:
        crop = Crop.objects.filter(name__iexact=crop_name).first()

    # Run computer vision classification
    diagnosis = classify_leaf_image(image_file, crop_name=crop_name, weather_context=weather_context)

    if diagnosis.get("status") == "error":
        return diagnosis

    # Package metadata for notes
    metadata = {
        "severity_level": diagnosis.get("severity_level", "Moderate"),
        "lesion_area_pct": diagnosis.get("lesion_area_pct", 0.0),
        "urgency": diagnosis.get("urgency", "Routine Monitoring"),
        "scientific_name": diagnosis.get("scientific_name", ""),
        "pathogen_type": diagnosis.get("pathogen_type", "Fungal"),
        "safety_warning": diagnosis.get("safety_warning", ""),
        "organic_remedies": diagnosis.get("organic_remedies", []),
        "chemical_management": diagnosis.get("chemical_management", []),
        "weather_risk": diagnosis.get("weather_risk", None),
    }

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
        notes=json.dumps(metadata)
    )

    diagnosis["scan_id"] = scan_record.id
    diagnosis["image_url"] = scan_record.leaf_image.url if scan_record.leaf_image else None
    diagnosis["diagnosis_date"] = scan_record.created_at.strftime("%d %b %Y, %H:%M")
    if farm:
        diagnosis["farm_name"] = farm.farm_name

    return diagnosis


def get_disease_detail(scan_id: int, user) -> dict:
    """Returns the complete detailed diagnosis payload for a historical scan."""
    scan = DiseaseDetection.objects.filter(id=scan_id, farmer=user).first()
    if not scan:
        return None

    metadata = {}
    if scan.notes:
        try:
            if scan.notes.startswith('{'):
                metadata = json.loads(scan.notes)
            else:
                metadata = {"safety_warning": scan.notes}
        except Exception:
            metadata = {"safety_warning": scan.notes}

    return {
        "scan_id": scan.id,
        "crop": scan.crop.name if scan.crop else "General",
        "predicted_disease": scan.predicted_disease,
        "scientific_name": metadata.get("scientific_name", ""),
        "pathogen_type": metadata.get("pathogen_type", "Fungal"),
        "confidence_score": float(scan.confidence_score),
        "is_healthy": scan.is_healthy,
        "severity_level": metadata.get("severity_level", "None (0%)" if scan.is_healthy else "Moderate (18%)"),
        "lesion_area_pct": metadata.get("lesion_area_pct", 0.0 if scan.is_healthy else 18.0),
        "urgency": metadata.get("urgency", "Routine Monitoring"),
        "symptoms": scan.symptoms.split("\n") if scan.symptoms else [],
        "causes": scan.causes.split("\n") if scan.causes else [],
        "preventive_measures": scan.preventive_measures or [],
        "suggested_actions": scan.suggested_actions or [],
        "organic_remedies": metadata.get("organic_remedies", []),
        "chemical_management": metadata.get("chemical_management", []),
        "safety_warning": metadata.get("safety_warning", ""),
        "weather_risk": metadata.get("weather_risk", None),
        "image_url": scan.leaf_image.url if scan.leaf_image else None,
        "diagnosis_date": scan.created_at.strftime("%d %b %Y, %H:%M"),
        "farm_name": scan.farm.farm_name if scan.farm else "General Plot",
        "expert_consultation_requested": scan.expert_consultation_requested,
    }


def generate_prescription_dossier(scan_id: int, user) -> dict:
    """Generates an official printable Agronomic Prescription Dossier."""
    detail = get_disease_detail(scan_id, user)
    if not detail:
        return None

    rx_id = f"AGRO-RX-{scan_id:04d}-{user.id}"
    organic_remedy = detail["organic_remedies"][0] if detail["organic_remedies"] else "Apply bio-fungicide (Trichoderma viride @ 5g/L)"
    chemical_cure = detail["chemical_management"][0] if detail["chemical_management"] else "Consult Krishi Vigyan Kendra agronomist"

    return {
        "prescription_id": rx_id,
        "farmer_name": user.get_full_name() or user.username,
        "farmer_email": user.email,
        "farm_parcel": detail["farm_name"],
        "date_issued": detail["diagnosis_date"],
        "crop": detail["crop"],
        "diagnosed_disease": detail["predicted_disease"],
        "scientific_classification": detail["scientific_name"],
        "pathogen_type": detail["pathogen_type"],
        "confidence_level": f"{detail['confidence_score']}%",
        "infection_severity": detail["severity_level"],
        "lesion_coverage": f"{detail['lesion_area_pct']}% of foliar surface",
        "urgency_timeline": detail["urgency"],
        "prescribed_treatment_plan": {
            "immediate_organic_remedy": organic_remedy,
            "targeted_chemical_option": chemical_cure,
            "additional_actions": detail["suggested_actions"]
        },
        "preventive_cultural_practices": detail["preventive_measures"],
        "chemical_safety_advisory": detail["safety_warning"],
        "kvk_panel_status": "Referred to Krishi Vigyan Kendra Panel" if detail["expert_consultation_requested"] else "Available on Farmer Request",
        "issuing_authority": "AGROVISION Automated Agronomic Intelligence Engine (SIH25044)",
        "accreditation": "Calibrated with ICAR & CIBRC Plant Protection Standards"
    }


def get_disease_catalog(crop_filter: str = None) -> list:
    """Returns catalog of recognized crop diseases with diagnostic and treatment guidelines."""
    catalog = []
    crop_filter_lower = crop_filter.lower().strip() if crop_filter else ''

    for key, prof in DISEASE_PROFILES.items():
        if crop_filter_lower and crop_filter_lower not in prof['crop'].lower() and prof['crop'].lower() not in crop_filter_lower:
            continue
        catalog.append({
            "key": key,
            "crop": prof["crop"],
            "disease_name": prof["disease_name"],
            "scientific_name": prof["scientific_name"],
            "pathogen_type": prof["pathogen_type"],
            "is_healthy": prof["is_healthy"],
            "symptoms_summary": prof["symptoms"][:2],
            "primary_organic_cure": prof.get("organic_remedies", ["Bio-pesticide spray"])[0],
            "primary_chemical_cure": prof.get("chemical_management", ["Standard fungicide"])[0],
            "preventive_tip": prof.get("preventive_measures", ["Certified seed treatment"])[0],
            "safety_note": prof.get("safety_warning", "")
        })
    return catalog


def generate_sample_leaf_images() -> list:
    """
    Generates high-fidelity simulated leaf image samples with diagnostic ground truth
    for instant one-click testing in the UI.
    """
    samples = [
        {
            "id": "sample-soybean-rust",
            "title": "Soybean Rust (Pustules)",
            "crop": "Soybean",
            "ground_truth": "Soybean Rust",
            "r": 175, "g": 110, "b": 35,
            "lesion_type": "rust_pustules",
            "description": "Characteristic orange-brown pustules on soybean leaflet"
        },
        {
            "id": "sample-soybean-healthy",
            "title": "Healthy Soybean Leaf",
            "crop": "Soybean",
            "ground_truth": "Healthy Leaf",
            "r": 35, "g": 165, "b": 45,
            "lesion_type": "none",
            "description": "Clean, dark green trifoliate leaf with full chlorophyll vigor"
        },
        {
            "id": "sample-rice-blast",
            "title": "Rice Blast (Spindle Lesions)",
            "crop": "Rice",
            "ground_truth": "Rice Blast",
            "r": 160, "g": 125, "b": 40,
            "lesion_type": "blast_spindles",
            "description": "Spindle-shaped brown lesions with grayish centers on paddy leaf"
        },
        {
            "id": "sample-wheat-rust",
            "title": "Wheat Stripe Rust",
            "crop": "Wheat",
            "ground_truth": "Stripe Rust",
            "r": 180, "g": 130, "b": 30,
            "lesion_type": "stripe_veins",
            "description": "Bright yellow-orange pustules in parallel leaf vein stripes"
        },
        {
            "id": "sample-cotton-blight",
            "title": "Cotton Bacterial Blight",
            "crop": "Cotton",
            "ground_truth": "Bacterial Blight",
            "r": 150, "g": 105, "b": 45,
            "lesion_type": "angular_spots",
            "description": "Angular water-soaked dark brown spots on cotton leaf"
        },
        {
            "id": "sample-maize-blight",
            "title": "Maize Northern Leaf Blight",
            "crop": "Maize",
            "ground_truth": "Northern Leaf Blight",
            "r": 155, "g": 120, "b": 50,
            "lesion_type": "cigar_blight",
            "description": "Long elliptical cigar-shaped tan lesions across maize blade"
        },
        {
            "id": "sample-tomato-blight",
            "title": "Tomato Early Blight",
            "crop": "Tomato",
            "ground_truth": "Early Blight",
            "r": 165, "g": 115, "b": 40,
            "lesion_type": "target_rings",
            "description": "Concentric dark brown target rings with chlorotic margin"
        }
    ]

    result = []
    for s in samples:
        arr = np.zeros((224, 224, 3), dtype=np.uint8)
        # Base foliage color
        arr[:, :] = [s["r"] // 3, min(255, int(s["g"] * 1.1)), s["b"] // 3]

        # Draw lesion patterns based on type
        if s["lesion_type"] == "rust_pustules":
            # Scattered reddish-brown rust spots
            for cy, cx in [(60, 70), (120, 140), (160, 80), (80, 160), (140, 110)]:
                rr = 18
                arr[max(0, cy - rr):min(224, cy + rr), max(0, cx - rr):min(224, cx + rr)] = [s["r"], s["g"], s["b"]]
        elif s["lesion_type"] == "blast_spindles":
            # Elliptical spindle lesions
            for cy, cx in [(70, 110), (150, 120)]:
                arr[cy - 8:cy + 8, cx - 25:cx + 25] = [s["r"], s["g"], s["b"]]
        elif s["lesion_type"] == "stripe_veins":
            # Parallel vertical stripes
            for x_col in [70, 95, 120, 145]:
                arr[30:190, x_col:x_col + 8] = [s["r"], s["g"], s["b"]]
        elif s["lesion_type"] != "none":
            # General necrotic patches
            for cy, cx in [(50, 60), (110, 150), (160, 100)]:
                arr[cy - 16:cy + 16, cx - 16:cx + 16] = [s["r"], s["g"], s["b"]]

        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=90)
        encoded = base64.b64encode(buf.getvalue()).decode('utf-8')

        result.append({
            "id": s["id"],
            "title": s["title"],
            "crop": s["crop"],
            "ground_truth": s["ground_truth"],
            "description": s["description"],
            "image_data_uri": f"data:image/jpeg;base64,{encoded}"
        })

    return result
