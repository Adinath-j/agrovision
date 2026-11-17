"""
Crop Optimization Engine Service.
Smart India Hackathon 2025 - SIH25044.

1. Precision Irrigation Scheduling (ETc, Kc, Irrigation Efficiency, Volume & Duration)
2. Soil-Test-Crop-Response (STCR) Fertilizer Optimization (Split NPK & Commercial Fertilizer Bags)
3. Integrated Pest & Abiotic Risk Management
"""

import math
from datetime import date, timedelta
from apps.farms.models import Farm
from apps.crops.models import Crop
from .models import Recommendation

# Crop stage coefficient Kc
CROP_KC_VALUES = {
    'EARLY_GROWTH': 0.40,
    'VEGETATIVE': 0.75,
    'FLOWERING': 1.15,
    'GRAIN_FORMATION': 0.85,
    'MATURITY': 0.50
}

# Standard NPK targets by crop (kg/ha)
CROP_NPK_TARGETS = {
    'Soybean': {'n': 30, 'p': 60, 'k': 40, 'sulphur': 20},
    'Wheat': {'n': 120, 'p': 60, 'k': 40, 'zinc': 25},
    'Rice': {'n': 100, 'p': 50, 'k': 50, 'zinc': 20},
    'Cotton': {'n': 120, 'p': 60, 'k': 60, 'magnesium': 15},
    'Maize': {'n': 120, 'p': 60, 'k': 50, 'zinc': 20},
    'Sugarcane': {'n': 250, 'p': 100, 'k': 120, 'iron': 20},
    'Groundnut': {'n': 25, 'p': 50, 'k': 75, 'gypsum': 500},
    'Ragi': {'n': 60, 'p': 30, 'k': 30, 'zinc': 10}
}


def calculate_irrigation_optimization(farm: Farm, crop: Crop, growth_stage: str = 'FLOWERING') -> dict:
    """
    Computes precision irrigation schedule.
    """
    kc = CROP_KC_VALUES.get(growth_stage, 0.85)
    et0 = 4.6 # mm/day reference ET for central/western India in cropping season
    etc = round(et0 * kc, 2) # mm/day crop water requirement

    # System efficiency
    method = farm.irrigation_method or 'DRIP'
    efficiency = {
        'DRIP': 0.90,
        'SPRINKLER': 0.75,
        'FLOOD': 0.50,
        'MANUAL': 0.60,
        'RAINFED': 0.40
    }.get(method, 0.75)

    interval_days = 3 if method == 'DRIP' else 7 if method == 'SPRINKLER' else 10
    net_irrigation_mm = round(etc * interval_days, 1)
    gross_irrigation_mm = round(net_irrigation_mm / efficiency, 1)

    # 1 mm = 10,000 liters / ha
    area_ha = float(farm.area_hectares)
    total_water_liters = int(gross_irrigation_mm * 10000 * area_ha)
    water_m3 = round(total_water_liters / 1000.0, 1)

    # Operating duration calculation (assuming 4000 L/hr/ha discharge for drip)
    pump_discharge_lph = 4000.0 if method == 'DRIP' else 12000.0
    run_hours = round(total_water_liters / (pump_discharge_lph * area_ha), 1)

    next_date = date.today() + timedelta(days=interval_days)

    return {
        "crop_coefficient_kc": kc,
        "daily_crop_water_etc_mm": etc,
        "irrigation_method": farm.get_irrigation_method_display(),
        "system_efficiency_pct": int(efficiency * 100),
        "irrigation_interval_days": interval_days,
        "next_irrigation_date": str(next_date),
        "gross_depth_mm": gross_irrigation_mm,
        "water_volume_liters": total_water_liters,
        "water_volume_m3": water_m3,
        "recommended_run_duration_hours": max(1.5, min(8.0, run_hours)),
        "irrigation_tip": f"Maintain active root-zone moisture during {growth_stage.replace('_', ' ').title()}. Schedule watering in early morning or late afternoon to minimize evaporation losses."
    }


def calculate_fertilizer_optimization(farm: Farm, crop: Crop) -> dict:
    """
    Computes Soil-Test-Crop-Response (STCR) fertilizer requirements and commercial fertilizer bags.
    """
    crop_name = crop.name if crop else 'Soybean'
    targets = CROP_NPK_TARGETS.get(crop_name, CROP_NPK_TARGETS['Soybean'])

    # Soil nutrient measurements with safe fallbacks
    soil_n = float(farm.nitrogen_n) if farm.nitrogen_n else 220.0
    soil_p = float(farm.phosphorus_p) if farm.phosphorus_p else 18.0
    soil_k = float(farm.potassium_k) if farm.potassium_k else 260.0
    soil_ph = float(farm.soil_ph) if farm.soil_ph else 7.2

    # STCR Adjustment factor:
    # Low soil fertility requires 15-25% more nutrient; high soil fertility reduces application
    adj_n = 1.20 if soil_n < 200 else (0.85 if soil_n > 350 else 1.0)
    adj_p = 1.25 if soil_p < 15 else (0.80 if soil_p > 30 else 1.0)
    adj_k = 1.20 if soil_k < 150 else (0.85 if soil_k > 300 else 1.0)

    rec_n = round(targets['n'] * adj_n, 1)
    rec_p = round(targets['p'] * adj_p, 1)
    rec_k = round(targets['k'] * adj_k, 1)

    area_ha = float(farm.area_hectares)

    # Commercial fertilizer bag conversion (50 kg bags)
    # DAP supplies 18% N and 46% P
    dap_kg = (rec_p / 0.46) * area_ha
    dap_bags = round(dap_kg / 50.0, 1)

    # N contributed by DAP
    n_from_dap = (dap_kg * 0.18)
    net_n_needed = max(0.0, (rec_n * area_ha) - n_from_dap)
    # Urea supplies 46% N
    urea_kg = net_n_needed / 0.46
    urea_bags = round(urea_kg / 50.0, 1)

    # MOP supplies 60% K
    mop_kg = (rec_k / 0.60) * area_ha
    mop_bags = round(mop_kg / 50.0, 1)

    # Split Schedule
    splits = [
        {
            "stage": "Basal (At Sowing)",
            "timing": "During final land preparation or sowing drill",
            "dap_bags": dap_bags,
            "mop_bags": round(mop_bags * 0.6, 1),
            "urea_bags": round(urea_bags * 0.25, 1),
            "notes": "Band placement 5 cm below and to the side of seed furrow."
        },
        {
            "stage": "Vegetative Top-Dressing",
            "timing": "25–30 Days After Sowing (with light irrigation)",
            "dap_bags": 0.0,
            "mop_bags": 0.0,
            "urea_bags": round(urea_bags * 0.45, 1),
            "notes": "Broadcast urea when topsoil is moist; avoid midday sunshine."
        },
        {
            "stage": "Flowering / Tasseling",
            "timing": "50–55 Days After Sowing",
            "dap_bags": 0.0,
            "mop_bags": round(mop_bags * 0.4, 1),
            "urea_bags": round(urea_bags * 0.30, 1),
            "notes": "Foliar potassium nitrate spray (13:0:45 @ 1.0%) to boost seed filling."
        }
    ]

    soil_amendment = None
    if soil_ph > 8.0:
        soil_amendment = "Soil pH is alkaline (pH > 8.0). Apply agricultural gypsum @ 500 kg/ha or elemental sulphur to release bound phosphorus and micro-nutrients."
    elif soil_ph < 6.2:
        soil_amendment = "Soil pH is acidic (pH < 6.2). Apply agricultural lime or dolomite @ 400 kg/ha before sowing."

    return {
        "crop_name": crop_name,
        "soil_profile": {
            "soil_type": farm.get_soil_type_display(),
            "ph": soil_ph,
            "nitrogen_n": soil_n,
            "phosphorus_p": soil_p,
            "potassium_k": soil_k
        },
        "target_npk_kg_ha": {"n": rec_n, "p": rec_p, "k": rec_k},
        "commercial_bags_total": {
            "urea_50kg_bags": urea_bags,
            "dap_50kg_bags": dap_bags,
            "mop_50kg_bags": mop_bags
        },
        "split_schedule": splits,
        "soil_amendment": soil_amendment
    }


def generate_full_farm_optimization(farm: Farm, crop: Crop) -> list:
    """
    Generates and persists full suite of precision recommendations.
    """
    recs = []

    # 1. Irrigation recommendation
    irrig_opt = calculate_irrigation_optimization(farm, crop, growth_stage='FLOWERING')
    rec_irrig, _ = Recommendation.objects.update_or_create(
        farm=farm,
        category=Recommendation.Category.IRRIGATION,
        defaults={
            "crop": crop,
            "priority": Recommendation.Priority.HIGH,
            "title": f"Precision Irrigation: {irrig_opt['water_volume_m3']} m³ via {irrig_opt['irrigation_method']}",
            "recommendation_text": (
                f"Schedule next irrigation on {irrig_opt['next_irrigation_date']} for {irrig_opt['recommended_run_duration_hours']} hours. "
                f"Applies {irrig_opt['gross_depth_mm']} mm depth ({irrig_opt['water_volume_liters']:,} liters) at {irrig_opt['system_efficiency_pct']}% efficiency."
            ),
            "reasoning": f"Crop ETc is {irrig_opt['daily_crop_water_etc_mm']} mm/day during flowering/pod formation. {irrig_opt['irrigation_tip']}",
            "action_items": [
                f"Run pump for {irrig_opt['recommended_run_duration_hours']} hrs on {irrig_opt['next_irrigation_date']}",
                "Inspect drip lateral filters and flush end caps",
                "Water early morning to avoid evaporation losses"
            ]
        }
    )
    recs.append(rec_irrig)

    # 2. Fertilizer recommendation
    fert_opt = calculate_fertilizer_optimization(farm, crop)
    rec_fert, _ = Recommendation.objects.update_or_create(
        farm=farm,
        category=Recommendation.Category.FERTILIZER,
        defaults={
            "crop": crop,
            "priority": Recommendation.Priority.HIGH,
            "title": f"STCR Balanced Nutrient Plan: {fert_opt['commercial_bags_total']['dap_50kg_bags']} DAP, {fert_opt['commercial_bags_total']['urea_50kg_bags']} Urea, {fert_opt['commercial_bags_total']['mop_50kg_bags']} MOP Bags",
            "recommendation_text": (
                f"Balanced NPK schedule calibrated to {farm.get_soil_type_display()} (pH {fert_opt['soil_profile']['ph']}). "
                f"Target application: N: {fert_opt['target_npk_kg_ha']['n']}, P: {fert_opt['target_npk_kg_ha']['p']}, K: {fert_opt['target_npk_kg_ha']['k']} kg/ha."
            ),
            "reasoning": fert_opt.get('soil_amendment') or "Optimal NPK balance promotes robust root proliferation and prevents lodging.",
            "action_items": [
                f"Basal application: {fert_opt['split_schedule'][0]['dap_bags']} bags DAP + {fert_opt['split_schedule'][0]['mop_bags']} bags MOP",
                f"Vegetative split: {fert_opt['split_schedule'][1]['urea_bags']} bags Urea top-dressed before irrigation",
                "Apply 20 kg Sulphur/ha to improve grain oil and protein synthesis"
            ]
        }
    )
    recs.append(rec_fert)

    # 3. Pest & Risk Mitigation recommendation
    rec_risk, _ = Recommendation.objects.update_or_create(
        farm=farm,
        category=Recommendation.Category.RISK,
        defaults={
            "crop": crop,
            "priority": Recommendation.Priority.MEDIUM,
            "title": "Integrated Biotic & Abiotic Risk Safeguards",
            "recommendation_text": "Install yellow sticky traps (10/acre) and pheromone traps for early borer detection. Clear field drainage furrows to avert monsoon waterlogging.",
            "reasoning": "Preventative IPM reduces chemical expenditure by up to 35% while protecting natural beneficial predators.",
            "action_items": [
                "Install sticky traps along boundary rows",
                "Maintain broad-bed and furrow (BBF) drainage channels",
                "Keep 5% neem extract on hand for early foliar prophylaxis"
            ]
        }
    )
    recs.append(rec_risk)

    return recs
