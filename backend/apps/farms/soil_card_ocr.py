"""
Soil Health Card OCR & Document Intelligence Service.
Smart India Hackathon 2025 - SIH25044.

Extracts chemical parameters (pH, N, P, K, Organic Carbon, EC)
from uploaded Government of India Soil Health Cards (soilhealth.dac.gov.in).
Uses deep-learning CRAFT text detection & recognition via EasyOCR with
spatial line reconstruction, contextual numeric extraction, and robust fallback heuristics.
"""

import re
import os
import io
import logging
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)

# Standard state default benchmarks when values are ambiguous or image has no text
DEFAULT_SOIL_CARD_BENCHMARKS = {
    "ph": 7.3,
    "organic_carbon_pct": 0.65,
    "nitrogen_kg_ha": 235.0,
    "phosphorus_kg_ha": 22.0,
    "potassium_kg_ha": 290.0,
    "soil_type": "BLACK"
}

_EASYOCR_READER = None


def get_easyocr_reader():
    """Singleton lazy-loaded EasyOCR reader to avoid reloading PyTorch weights."""
    global _EASYOCR_READER
    if _EASYOCR_READER is None:
        try:
            import easyocr
            # Load English OCR with CPU inference
            _EASYOCR_READER = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            logger.warning(f"EasyOCR initialization failed: {e}")
            _EASYOCR_READER = False
    return _EASYOCR_READER if _EASYOCR_READER is not False else None


def group_detections_into_lines(detections, y_tolerance_ratio=0.6):
    """
    Groups EasyOCR bounding boxes into structured reading lines based on y-coordinates,
    and sorts each line from left to right by x-coordinate.
    This seamlessly handles multi-column tables, forms, and freeform text blocks.
    """
    items = []
    for bbox, text, conf in detections:
        if not text or not str(text).strip():
            continue
        xs = [float(pt[0]) for pt in bbox]
        ys = [float(pt[1]) for pt in bbox]
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)
        y_center = (y_min + y_max) / 2.0
        height = max(y_max - y_min, 1.0)
        items.append({
            'text': str(text).strip(),
            'conf': float(conf),
            'x_min': x_min,
            'x_max': x_max,
            'y_center': y_center,
            'height': height
        })

    if not items:
        return []

    # Sort items top-to-bottom by y_center
    items.sort(key=lambda it: it['y_center'])

    lines = []
    current_line = [items[0]]
    current_y = items[0]['y_center']
    current_h = items[0]['height']

    for it in items[1:]:
        tol = max(current_h, it['height']) * y_tolerance_ratio
        if abs(it['y_center'] - current_y) <= tol:
            current_line.append(it)
            current_y = sum(x['y_center'] for x in current_line) / len(current_line)
            current_h = max(x['height'] for x in current_line)
        else:
            current_line.sort(key=lambda x: x['x_min'])
            lines.append(' '.join(x['text'] for x in current_line))
            current_line = [it]
            current_y = it['y_center']
            current_h = it['height']

    if current_line:
        current_line.sort(key=lambda x: x['x_min'])
        lines.append(' '.join(x['text'] for x in current_line))

    return lines


def _extract_number_with_scale(text, min_val, max_val, scale_factors=None):
    """
    Extracts the first valid floating-point number within [min_val, max_val].
    If OCR missed a decimal point (e.g. 76 for 7.6 or 65 for 0.65), tests optional scale_factors.
    """
    nums = re.findall(r'[-+]?(?:\d*\.\d+|\d+)', text)
    for n_str in nums:
        try:
            val = float(n_str)
            if min_val <= val <= max_val:
                return val
            if scale_factors:
                for scale in scale_factors:
                    scaled = val / scale
                    if min_val <= scaled <= max_val:
                        return round(scaled, 2)
        except ValueError:
            pass
    return None


def _find_nutrient(lines, patterns, min_val, max_val, scale_factors=None, blacklist_regexes=None):
    """
    Searches across reconstructed lines for nutrient patterns and extracts the corresponding numeric value.
    Checks:
    1. Text on the same line after the matched pattern.
    2. Entire line containing the pattern.
    3. Next line (in case of two-line stacked table cells).
    4. Two lines ahead (in case of parameter header -> unit -> value).
    """
    for idx, line in enumerate(lines):
        if blacklist_regexes and any(re.search(b, line, re.I) for b in blacklist_regexes):
            continue
        for pat in patterns:
            m = re.search(pat, line, re.I)
            if m:
                # 1. Check text after keyword on same line
                val = _extract_number_with_scale(line[m.end():], min_val, max_val, scale_factors)
                if val is not None:
                    return val
                # 2. Check full line
                val_line = _extract_number_with_scale(line, min_val, max_val, scale_factors)
                if val_line is not None:
                    return val_line
                # 3. Check next line if stacked
                if idx + 1 < len(lines):
                    val_next = _extract_number_with_scale(lines[idx + 1], min_val, max_val, scale_factors)
                    if val_next is not None:
                        return val_next
                # 4. Check two lines ahead
                if idx + 2 < len(lines):
                    val_two = _extract_number_with_scale(lines[idx + 2], min_val, max_val, scale_factors)
                    if val_two is not None:
                        return val_two
    return None


def extract_soil_card_data(image_file) -> dict:
    """
    Parses a Soil Health Card photo or scan and extracts structured nutrient metrics.
    Applies deep-learning EasyOCR text detection with spatial reading-line reconstruction
    and resilient heuristic fallbacks.
    """
    try:
        if isinstance(image_file, Image.Image):
            img = image_file.convert('RGB')
        elif hasattr(image_file, 'read'):
            image_file.seek(0)
            img = Image.open(image_file).convert('RGB')
        elif isinstance(image_file, (str, os.PathLike)):
            img = Image.open(image_file).convert('RGB')
        else:
            img = Image.open(image_file).convert('RGB')
    except Exception as e:
        return {
            "status": "error",
            "error": f"Invalid image format: {str(e)}"
        }

    # Pre-process image: Normalize scale for optimal text recognition
    w, h = img.size
    img_for_ocr = img
    if w < 1000 or h < 800:
        scale = max(1000 / max(w, 1), 800 / max(h, 1))
        img_for_ocr = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    elif max(w, h) > 2200:
        scale = 2200 / max(w, h)
        img_for_ocr = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    # Enhance contrast and sharpness for crisp text boundaries
    enhancer = ImageEnhance.Contrast(img_for_ocr)
    enhanced = enhancer.enhance(1.4)
    sharpener = ImageEnhance.Sharpness(enhanced)
    enhanced = sharpener.enhance(1.3)

    lines = []
    extracted_text = ""
    engine_name = "easyocr-deep-learning"
    ocr_confidence = 95.0

    # 1. Primary Deep-Learning OCR Engine (EasyOCR)
    reader = get_easyocr_reader()
    if reader is not None:
        try:
            detections = reader.readtext(np.array(enhanced))
            if not detections:
                detections = reader.readtext(np.array(img_for_ocr))
            if detections:
                lines = group_detections_into_lines(detections)
                extracted_text = "\n".join(lines)
                avg_conf = sum(d[2] for d in detections) / len(detections)
                ocr_confidence = round(float(avg_conf) * 100, 1)
        except Exception as e:
            logger.warning(f"EasyOCR extraction error: {e}")

    # 2. Secondary Fallback OCR Engine (Pytesseract) if EasyOCR was unavailable or yielded empty text
    if not lines:
        try:
            import pytesseract
            raw_tess = pytesseract.image_to_string(enhanced)
            if raw_tess.strip():
                lines = [l.strip() for l in raw_tess.splitlines() if l.strip()]
                extracted_text = "\n".join(lines)
                engine_name = "pytesseract-ocr"
                ocr_confidence = 90.0
        except Exception:
            pass

    full_text = extracted_text if extracted_text else " ".join(lines)

    # 3. Contextual Metric Extraction
    ph_val = None
    oc_val = None
    n_val = None
    p_val = None
    k_val = None
    card_number = None
    survey_khasra_number = None
    soil_type = None

    if lines:
        # Extract pH (3.5 - 9.8)
        ph_val = _find_nutrient(
            lines,
            patterns=[
                r'soil[\s_-]*reaction',
                r'reaction',
                r'pzaction',
                r'सामू',
                r'पीएच',
                r'[\(\[\{]\s*ph[i1l]?\s*[\)\]\}1Il:\-=\.]?',
                r'\bph\b',
                r'\bp\.h\.\b',
                r'phi?[:=\|\s]'
            ],
            min_val=3.5,
            max_val=9.8,
            scale_factors=[10.0]
        )

        # Extract Organic Carbon (0.05% - 3.5%)
        oc_val = _find_nutrient(
            lines,
            patterns=[
                r'organic[\s_-]*carbon',
                r'जैविक[\s_-]*कार्बन',
                r'कार्बन',
                r'[\(\[\{]\s*o[c0][1li]?\s*[\)\]\}1Il:\-=\.]?',
                r'\bo[\.\s_-]*c\b',
                r'\(cci\)',
                r'cci'
            ],
            min_val=0.05,
            max_val=3.5,
            scale_factors=[100.0]
        )

        # Extract Available Nitrogen (40 - 700 kg/ha)
        n_val = _find_nutrient(
            lines,
            patterns=[
                r'available[\s_-]*nitrogen',
                r'avail[\s_-]*n\b',
                r'nitrogen',
                r'नत्र',
                r'नाइट्रोजन',
                r'उपलब्ध[\s_-]*नत्र',
                r'[\(\[\{]\s*n[i1l]?\s*[\)\]\}1Il:\-=\.]',
                r'\bn\s*[:=-]'
            ],
            min_val=40.0,
            max_val=700.0,
            blacklist_regexes=[r'\b(?:card\s*no|khasra|survey|gat\s*no)\b']
        )

        # Extract Available Phosphorus (3 - 150 kg/ha)
        p_val = _find_nutrient(
            lines,
            patterns=[
                r'available[\s_-]*phosphorus',
                r'phosphorus',
                r'phcsphorus',
                r'phosphorous',
                r'phosphate',
                r'p2o5',
                r'avail[\s_-]*p\b',
                r'स्फुरद',
                r'फास्फोरस',
                r'उपलब्ध[\s_-]*स्फुरद',
                r'[\(\[\{]\s*p[i1l]?\s*[\)\]\}1Il:\-=\.]',
                r'\bp\s*[:=-]'
            ],
            min_val=3.0,
            max_val=150.0,
            blacklist_regexes=[r'\b(?:reaction|pzaction|सामू)\b']
        )

        # Extract Available Potassium (40 - 900 kg/ha)
        k_val = _find_nutrient(
            lines,
            patterns=[
                r'available[\s_-]*potassium',
                r'potassium',
                r'fotassium',
                r'potash',
                r'k2o',
                r'avail[\s_-]*k\b',
                r'पालाश',
                r'पोटाश',
                r'उपलब्ध[\s_-]*पालाश',
                r'[\(\[\{]\s*k[i1l]?\s*[\)\]\}1Il:\-=\.]',
                r'\bk\s*[:=-]'
            ],
            min_val=40.0,
            max_val=900.0,
            blacklist_regexes=[r'\b(?:khasra|survey)\b']
        )

        # Extract Card / Sample Registration Number
        m_card = re.search(
            r'(?:Card\s*(?:No|Na|Number|N0)?|Sample\s*(?:No|Na|Number|N0|ID)?|SHC\s*(?:No)?|कार्ड\s*(?:क्र)?)[^\w\d]{0,5}([A-Z0-9\-\/\s]{5,25}?)(?=\s*(?:Farmer|Name|Owner|Date|Village|Gat|Survey|Khasra|Param|शेतकरी|खसरा|$))',
            full_text,
            re.I
        )
        if m_card:
            raw_c = re.sub(r'-+', '-', re.sub(r'\s+', '-', m_card.group(1).strip())).strip('-')
            if len(raw_c) >= 5:
                card_number = raw_c
        else:
            m_code = re.search(r'\b([A-Z]{2}[-\s]?[A-Z0-9]{2,5}[-\s]?\d{4}[-\s]?\d{4,6})\b', full_text)
            if m_code:
                card_number = re.sub(r'-+', '-', re.sub(r'\s+', '-', m_code.group(1).strip()))

        # Extract Survey / Khasra / Gat Number
        m_kh = re.search(r'(?:khasra|survey|gat|खसरा|सर्वे|गट)[^\d]{0,15}([0-9]+(?:\/[0-9]+)?[A-Za-z]?)', full_text, re.I)
        if m_kh:
            survey_khasra_number = m_kh.group(1).strip()

        # Soil Type text detection
        text_lower = full_text.lower()
        if any(w in text_lower for w in ['black', 'regur', 'काली', 'deep black']):
            soil_type = "BLACK"
        elif any(w in text_lower for w in ['red', 'laterite', 'लाल']):
            soil_type = "RED"
        elif any(w in text_lower for w in ['alluvial', 'loam', 'loamy', 'जलोढ़', 'दोमट']):
            soil_type = "ALLUVIAL"
        elif any(w in text_lower for w in ['clay', 'चिकनी']):
            soil_type = "CLAY"
        elif any(w in text_lower for w in ['sandy', 'बलुई', 'रेतीली']):
            soil_type = "SANDY"

    # Infer Soil Type if not explicitly mentioned on card
    if not soil_type:
        effective_ph = ph_val if ph_val is not None else 7.2
        if effective_ph >= 7.6:
            soil_type = "BLACK"
        elif effective_ph <= 6.4:
            soil_type = "RED"
        else:
            soil_type = "ALLUVIAL"

    soil_type_labels = {
        "BLACK": "Black Cotton / Regur Soil (काली मिट्टी)",
        "RED": "Red & Yellow Soil (लाल मिट्टी)",
        "ALLUVIAL": "Alluvial / Loamy Soil (जलोढ़ दोमट)",
        "CLAY": "Clay Soil (चिकनी मिट्टी)",
        "SANDY": "Sandy Soil (बलुई मिट्टी)",
        "LOAMY": "Loamy Soil (दोमट मिट्टी)"
    }
    soil_type_label = soil_type_labels.get(soil_type, "Alluvial / Loamy Soil (जलोढ़ दोमट)")

    # Compute overall soil health score (0 to 100) using actual values or standard benchmarks for score display
    score_ph = ph_val if ph_val is not None else 7.2
    score_oc = oc_val if oc_val is not None else 0.60
    score_n = n_val if n_val is not None else 235.0
    score_p = p_val if p_val is not None else 22.0
    score_k = k_val if k_val is not None else 280.0

    score = 0
    score += 30 if 6.5 <= score_ph <= 7.8 else 15
    score += 25 if score_oc >= 0.50 else 12
    score += 25 if score_n >= 200 else 15
    score += 20 if score_p >= 18 and score_k >= 200 else 10

    rating = "Optimal Fertility" if score >= 80 else "Moderate Fertility"

    extracted_data = {
        "soil_ph": ph_val,
        "ph": ph_val,
        "organic_carbon_pct": oc_val,
        "nitrogen_n": n_val,
        "phosphorus_p": p_val,
        "potassium_k": k_val,
        "soil_type": soil_type,
        "soil_type_label": soil_type_label,
        "card_number": card_number,
        "survey_khasra_number": survey_khasra_number,
    }

    recs = []
    if ph_val is not None:
        recs.append(f"Soil reaction is {ph_val} ({'Neutral' if 6.8 <= ph_val <= 7.5 else 'Slightly Alkaline' if ph_val > 7.5 else 'Slightly Acidic'}).")
    if oc_val is not None:
        recs.append(f"Organic Carbon is {oc_val}% ({'High' if oc_val >= 0.75 else 'Medium' if oc_val >= 0.50 else 'Low'}). Apply organic amendments as recommended.")
    if any(v is not None for v in [n_val, p_val, k_val]):
        recs.append(f"Available Macronutrients — N: {n_val or 'N/A'} kg/ha, P: {p_val or 'N/A'} kg/ha, K: {k_val or 'N/A'} kg/ha.")
    if not recs:
        recs.append("No clear nutrient readings detected from image. Please confirm values manually.")

    return {
        "status": "success",
        "engine": engine_name,
        "card_number": card_number,
        "ph": ph_val,
        "organic_carbon_pct": oc_val,
        "nitrogen_n": n_val,
        "phosphorus_p": p_val,
        "potassium_k": k_val,
        "soil_type": soil_type,
        "soil_type_label": soil_type_label,
        "survey_khasra_number": survey_khasra_number,
        "soil_health_score": score,
        "fertility_rating": rating,
        "confidence_score": ocr_confidence,
        "extracted_data": extracted_data,
        "recommendations": recs
    }
