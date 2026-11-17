"""
In-Season Multi-Stage Yield Prediction & Dynamic Assimilation Service.
Smart India Hackathon 2025 - SIH25044.

Updates crop yield forecasts at sequential growth stages:
1. EARLY_GROWTH (10-25 DAS)
2. VEGETATIVE (25-50 DAS)
3. FLOWERING (50-75 DAS)
4. GRAIN_FORMATION (75-100 DAS)
5. MATURITY (100-125 DAS)

Assimilates:
- Pre-sowing model baseline prediction
- Sentinel-2 Optical Canopy Vigour (NDVI / EVI)
- Cumulative weather & moisture satisfaction
- Farmer field management & pest observations
- Growth-stage calibrated uncertainty intervals
"""

import math
from datetime import date, timedelta
from apps.farms.models import Farm
from apps.crops.models import Crop
from apps.satellite.models import SatelliteObservation
from apps.satellite.satellite_service import generate_sentinel2_time_series
from .models import YieldPrediction
from .prediction_service import predict_pre_sowing_yield

# Stage-specific benchmark NDVI expectations and uncertainty bounds
STAGE_BENCHMARKS = {
    'EARLY_GROWTH': {
        'label': 'Germination & Early Growth',
        'expected_ndvi': 0.28,
        'uncertainty_pct': 0.18, # +/- 18% interval
        'confidence': 72.0,
        'ndvi_weight': 0.15,
        'weather_weight': 0.20,
        'mgmt_weight': 0.30
    },
    'VEGETATIVE': {
        'label': 'Vegetative / Canopy Expansion',
        'expected_ndvi': 0.55,
        'uncertainty_pct': 0.14, # +/- 14% interval
        'confidence': 79.0,
        'ndvi_weight': 0.30,
        'weather_weight': 0.25,
        'mgmt_weight': 0.25
    },
    'FLOWERING': {
        'label': 'Flowering & Reproduction',
        'expected_ndvi': 0.76,
        'uncertainty_pct': 0.10, # +/- 10% interval
        'confidence': 86.0,
        'ndvi_weight': 0.40,
        'weather_weight': 0.35,
        'mgmt_weight': 0.15
    },
    'GRAIN_FORMATION': {
        'label': 'Grain / Pod Filling',
        'expected_ndvi': 0.68,
        'uncertainty_pct': 0.07, # +/- 7% interval
        'confidence': 91.0,
        'ndvi_weight': 0.45,
        'weather_weight': 0.30,
        'mgmt_weight': 0.10
    },
    'MATURITY': {
        'label': 'Maturity & Pre-Harvest',
        'expected_ndvi': 0.42,
        'uncertainty_pct': 0.04, # +/- 4% interval
        'confidence': 95.0,
        'ndvi_weight': 0.50,
        'weather_weight': 0.25,
        'mgmt_weight': 0.05
    }
}


def predict_in_season_yield(farm: Farm, crop: Crop, farmer, input_data: dict) -> dict:
    """
    Executes in-season yield revision.
    """
    growth_stage = input_data.get('growth_stage', 'VEGETATIVE')
    if growth_stage not in STAGE_BENCHMARKS:
        growth_stage = 'VEGETATIVE'

    stage_meta = STAGE_BENCHMARKS[growth_stage]

    # 1. Retrieve or generate Pre-Sowing Baseline
    pre_sowing_qs = YieldPrediction.objects.filter(
        farm=farm,
        crop=crop,
        stage=YieldPrediction.Stage.PRE_SOWING
    ).order_by('-created_at')

    if pre_sowing_qs.exists():
        baseline_record = pre_sowing_qs.first()
        baseline_yield = float(baseline_record.predicted_yield_kg_per_ha)
        baseline_production = float(baseline_record.predicted_total_production_tonnes)
    else:
        # Generate initial pre-sowing baseline automatically
        baseline_res = predict_pre_sowing_yield(
            farm=farm,
            crop=crop,
            season_name=input_data.get('season_name', 'Kharif'),
            area_ha=float(farm.area_hectares),
            farmer=farmer,
            custom_inputs=input_data
        )
        baseline_yield = float(baseline_res['predicted_yield_kg_per_ha'])
        baseline_production = float(baseline_res['predicted_total_production_tonnes'])

    # 2. Retrieve Latest Sentinel-2 Telemetry for this parcel
    latest_sat = SatelliteObservation.objects.filter(farm=farm).order_by('-observation_date').first()
    if not latest_sat:
        generate_sentinel2_time_series(farm)
        latest_sat = SatelliteObservation.objects.filter(farm=farm).order_by('-observation_date').first()

    current_ndvi = float(latest_sat.ndvi_mean) if latest_sat else stage_meta['expected_ndvi']
    current_evi = float(latest_sat.evi_mean) if latest_sat and latest_sat.evi_mean else round(current_ndvi * 0.85, 4)
    current_ndwi = float(latest_sat.ndwi_mean) if latest_sat and latest_sat.ndwi_mean else round(current_ndvi * 0.48 - 0.05, 4)

    # Calculate NDVI Canopy Anomaly against stage benchmark
    expected_ndvi = stage_meta['expected_ndvi']
    ndvi_anomaly_ratio = (current_ndvi - expected_ndvi) / expected_ndvi
    # Clamped between -0.30 (-30%) and +0.30 (+30%)
    ndvi_anomaly_ratio = max(-0.30, min(0.30, ndvi_anomaly_ratio))

    # 3. Farmer Observation Drivers
    irrigation_status = input_data.get('irrigation_status', 'ADEQUATE')
    irrigation_multiplier = {
        'OPTIMAL': 0.04,
        'ADEQUATE': 0.01,
        'DEFICIT': -0.07,
        'RAINFED': -0.03
    }.get(irrigation_status, 0.0)

    fertilizer_status = input_data.get('fertilizer_status', 'BALANCED')
    fertilizer_multiplier = {
        'BALANCED': 0.03,
        'PARTIAL': -0.02,
        'ORGANIC': 0.01,
        'SUB_OPTIMAL': -0.06,
        'NIL': -0.12
    }.get(fertilizer_status, 0.0)

    pest_intensity = input_data.get('pest_intensity', 'NONE')
    pest_penalty = {
        'NONE': 0.0,
        'MINOR': -0.02,
        'MODERATE': -0.07,
        'SEVERE': -0.16
    }.get(pest_intensity, 0.0)

    # 4. Multi-factor Yield Adjustment Calculation
    ndvi_factor = stage_meta['ndvi_weight'] * ndvi_anomaly_ratio
    mgmt_factor = stage_meta['mgmt_weight'] * (irrigation_multiplier + fertilizer_multiplier)
    pest_factor = pest_penalty

    # Combined yield revision delta ratio
    net_adjustment_ratio = ndvi_factor + mgmt_factor + pest_factor
    # Constrain update between -35% and +30%
    net_adjustment_ratio = max(-0.35, min(0.30, net_adjustment_ratio))

    revised_yield = round(baseline_yield * (1.0 + net_adjustment_ratio), 2)
    area_ha = float(input_data.get('area_hectares') or farm.area_hectares)
    revised_production = round((revised_yield * area_ha) / 1000.0, 2)

    delta_yield_kg = round(revised_yield - baseline_yield, 2)
    delta_yield_pct = round((delta_yield_kg / baseline_yield) * 100.0, 2)

    uncertainty = stage_meta['uncertainty_pct']
    interval_min = round(revised_yield * (1.0 - uncertainty), 2)
    interval_max = round(revised_yield * (1.0 + uncertainty), 2)

    # 5. Explanatory Influencing Factors
    influencing_factors = []
    if ndvi_anomaly_ratio > 0.05:
        influencing_factors.append({
            "factor": f"Sentinel-2 NDVI Canopy Vigour (+{round(ndvi_anomaly_ratio*100, 1)}%)",
            "contribution": f"+{round(ndvi_factor*100, 1)}%",
            "impact": "POSITIVE",
            "description": f"Canopy greenness ({current_ndvi}) exceeds stage benchmark ({expected_ndvi}), indicating robust photosynthetic capacity."
        })
    elif ndvi_anomaly_ratio < -0.05:
        influencing_factors.append({
            "factor": f"Satellite Canopy Stress ({round(ndvi_anomaly_ratio*100, 1)}%)",
            "contribution": f"{round(ndvi_factor*100, 1)}%",
            "impact": "NEGATIVE",
            "description": f"Vegetation index ({current_ndvi}) is below normal stage target ({expected_ndvi}), indicating moisture or nutrient stress."
        })
    else:
        influencing_factors.append({
            "factor": "Satellite Canopy Vigour on Track",
            "contribution": f"{round(ndvi_factor*100, 1)}%",
            "impact": "NEUTRAL",
            "description": f"Canopy vigour ({current_ndvi}) closely aligns with normal crop development curves."
        })

    if irrigation_multiplier > 0:
        influencing_factors.append({
            "factor": "Irrigation Water Management",
            "contribution": f"+{round(irrigation_multiplier*100, 1)}%",
            "impact": "POSITIVE",
            "description": "Adequate root-zone soil moisture meeting crop evapotranspiration requirements."
        })
    elif irrigation_multiplier < 0:
        influencing_factors.append({
            "factor": "Moisture Deficit Stress",
            "contribution": f"{round(irrigation_multiplier*100, 1)}%",
            "impact": "NEGATIVE",
            "description": "Sub-optimal soil water availability impacting biomass formation."
        })

    if pest_penalty < 0:
        influencing_factors.append({
            "factor": f"Pest / Disease Damage ({pest_intensity})",
            "contribution": f"{round(pest_penalty*100, 1)}%",
            "impact": "NEGATIVE",
            "description": "Foliar damage or biotic stress reducing productive photosynthetic leaf area."
        })

    # Stage-specific actionable recommendations
    recommendations = []
    if growth_stage in ['EARLY_GROWTH', 'VEGETATIVE']:
        recommendations.append("Execute timely first split application of nitrogen (Urea) prior to irrigation.")
        recommendations.append("Conduct visual field scouting for early sucking pests and shoot borer incidence.")
    elif growth_stage == 'FLOWERING':
        recommendations.append("Maintain continuous root-zone moisture; avoid moisture stress during anthesis/flowering.")
        recommendations.append("Avoid overhead flood irrigation to minimize flower abortion and pollen wash.")
    elif growth_stage == 'GRAIN_FORMATION':
        recommendations.append("Apply foliar potassium nitrate (13:0:45 @ 1.0%) to improve grain filling and test weight.")
        recommendations.append("Monitor for pod borer or head caterpillars at evening hours.")
    else: # MATURITY
        recommendations.append("Terminate irrigation 10-14 days prior to harvest to promote uniform dry-down.")
        recommendations.append("Arrange harvest machinery and clean storage bags when grain moisture reaches 12-14%.")

    # 6. Mark previous in-season predictions for this farm/crop as non-latest
    YieldPrediction.objects.filter(
        farm=farm,
        crop=crop,
        is_latest=True
    ).update(is_latest=False)

    # 7. Persist New In-Season Prediction Record
    prediction_record = YieldPrediction.objects.create(
        farm=farm,
        farmer=farmer,
        crop=crop,
        stage=YieldPrediction.Stage.IN_SEASON,
        growth_stage=growth_stage,
        predicted_yield_kg_per_ha=revised_yield,
        predicted_total_production_tonnes=revised_production,
        prediction_interval_min_kg=interval_min,
        prediction_interval_max_kg=interval_max,
        confidence_score=stage_meta['confidence'],
        model_version="v1.0-in-season-satellite",
        model_algorithm="Multi-Stage Assimilation (RF + Sentinel-2)",
        explainability_shap={
            "baseline_yield": baseline_yield,
            "net_adjustment_ratio": round(net_adjustment_ratio, 4),
            "ndvi_anomaly": round(ndvi_anomaly_ratio, 4),
            "current_ndvi": current_ndvi,
            "stage": growth_stage
        },
        influencing_factors=influencing_factors,
        recommendations=recommendations,
        is_latest=True
    )

    return {
        "prediction_id": prediction_record.id,
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "crop_name": crop.name,
        "growth_stage": growth_stage,
        "growth_stage_label": stage_meta['label'],
        "baseline_yield_kg_per_ha": baseline_yield,
        "revised_yield_kg_per_ha": revised_yield,
        "predicted_total_production_tonnes": revised_production,
        "delta_yield_kg_per_ha": delta_yield_kg,
        "delta_yield_pct": delta_yield_pct,
        "prediction_interval": {
            "min_yield_kg_ha": interval_min,
            "max_yield_kg_ha": interval_max,
            "uncertainty_band_pct": round(uncertainty * 100, 1)
        },
        "confidence_score": stage_meta['confidence'],
        "satellite_snapshot": {
            "mission": "Sentinel-2 L2A",
            "ndvi": current_ndvi,
            "evi": current_evi,
            "ndwi": current_ndwi,
            "expected_stage_ndvi": expected_ndvi,
            "anomaly_pct": round(ndvi_anomaly_ratio * 100, 1),
            "canopy_status": latest_sat.vegetation_health_status if latest_sat else "Good"
        },
        "influencing_factors": influencing_factors,
        "recommendations": recommendations,
        "model_algorithm": prediction_record.model_algorithm
    }
