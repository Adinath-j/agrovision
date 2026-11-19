"""
Pradhan Mantri Fasal Bima Yojana (PMFBY) Crop Insurance & Loss Estimator Service.
Smart India Hackathon 2025 - SIH25044.

Actuarial Loss Estimation Equation:
1. Threshold Yield (TY) = 7-Year Historical Average Yield * Indemnity Level (e.g. 80% / 90%)
2. Yield Shortfall Ratio (SR) = max(0, (TY - Actual_or_Predicted_Yield) / TY)
3. Estimated Claim Payout = Sum Insured * Area (ha) * Shortfall Ratio
4. Net Benefit = Claim Payout - Farmer Premium Paid
"""

from apps.farms.models import Farm
from apps.crops.models import Crop

# Scale of Finance (Sum Insured per Hectare in INR) and Farmer Premium Rates
PMFBY_CROP_PARAMETERS = {
    'Soybean': {'sum_insured_ha': 55000, 'kharif_rate': 0.02, 'rabi_rate': 0.015, 'hist_benchmark_yield': 1650.0},
    'Wheat': {'sum_insured_ha': 48000, 'kharif_rate': 0.02, 'rabi_rate': 0.015, 'hist_benchmark_yield': 3200.0},
    'Rice': {'sum_insured_ha': 62000, 'kharif_rate': 0.02, 'rabi_rate': 0.015, 'hist_benchmark_yield': 2800.0},
    'Cotton': {'sum_insured_ha': 68000, 'kharif_rate': 0.05, 'rabi_rate': 0.05, 'hist_benchmark_yield': 1750.0},
    'Maize': {'sum_insured_ha': 45000, 'kharif_rate': 0.02, 'rabi_rate': 0.015, 'hist_benchmark_yield': 2600.0},
    'Sugarcane': {'sum_insured_ha': 115000, 'kharif_rate': 0.05, 'rabi_rate': 0.05, 'hist_benchmark_yield': 78000.0},
    'Groundnut': {'sum_insured_ha': 52000, 'kharif_rate': 0.02, 'rabi_rate': 0.015, 'hist_benchmark_yield': 1550.0},
    'Ragi': {'sum_insured_ha': 38000, 'kharif_rate': 0.02, 'rabi_rate': 0.015, 'hist_benchmark_yield': 1400.0},
}


def calculate_pmfby_claim(
    farm: Farm,
    crop: Crop,
    predicted_yield_kg_ha: float,
    indemnity_level_pct: float = 85.0,
    season: str = 'Kharif'
) -> dict:
    """
    Computes government PMFBY crop insurance actuarial claim settlement estimates.
    """
    crop_name = crop.name if crop else 'Soybean'
    params = PMFBY_CROP_PARAMETERS.get(crop_name)

    area_ha = float(farm.area_hectares) if farm else 2.5
    indemnity_level = indemnity_level_pct / 100.0

    # 1. Historical 7-year district average yield & Threshold Yield (TY)
    if params:
        hist_yield = params['hist_benchmark_yield']
        sum_insured_per_ha = params['sum_insured_ha']
    else:
        hist_yield = float(crop.standard_national_yield_kg_per_ha) if (crop and crop.standard_national_yield_kg_per_ha) else 1650.0
        sum_insured_per_ha = 55000

    threshold_yield = round(hist_yield * indemnity_level, 2)

    # 2. Predicted actual yield (AY)
    actual_yield = float(predicted_yield_kg_ha)

    # 3. Shortfall Calculation
    if actual_yield < threshold_yield:
        shortfall_kg = round(threshold_yield - actual_yield, 2)
        shortfall_ratio = round(shortfall_kg / threshold_yield, 4)
        has_shortfall = True
        status_label = "Shortfall Detected – Eligible for PMFBY Claim"
    else:
        shortfall_kg = 0.0
        shortfall_ratio = 0.0
        has_shortfall = False
        status_label = "Normal Yield – No Shortfall Detected"

    # 4. Financial Calculations
    sum_insured_per_ha = params['sum_insured_ha']
    total_sum_insured = round(sum_insured_per_ha * area_ha, 2)

    # Farmer premium rate (2% for Kharif foodgrain/oilseed, 1.5% Rabi, 5% Commercial)
    is_commercial = crop_name in ['Cotton', 'Sugarcane']
    if is_commercial:
        farmer_rate = 0.05
    elif season.lower() == 'rabi':
        farmer_rate = 0.015
    else:
        farmer_rate = 0.02

    farmer_premium = round(total_sum_insured * farmer_rate, 2)
    govt_subsidy_premium = round(total_sum_insured * (0.12 - farmer_rate), 2) # Total actuarial ~12%

    # 5. Claim Payout Calculation
    estimated_claim_payout = round(total_sum_insured * shortfall_ratio, 2)
    net_benefit = round(estimated_claim_payout - farmer_premium, 2)

    return {
        "status": "success",
        "scheme": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "farm_name": farm.farm_name if farm else "Primary Plot",
        "crop_name": crop_name,
        "season": season,
        "area_hectares": area_ha,
        "indemnity_level_pct": indemnity_level_pct,
        # Flat convenience keys
        "threshold_yield_kg_ha": threshold_yield,
        "actual_or_predicted_yield_kg_ha": actual_yield,
        "shortfall_kg_ha": shortfall_kg,
        "shortfall_percentage": round(shortfall_ratio * 100, 2),
        "is_claim_eligible": has_shortfall,
        "sum_insured_per_ha": sum_insured_per_ha,
        "total_sum_insured": total_sum_insured,
        "farmer_premium_rate_pct": round(farmer_rate * 100, 1),
        "farmer_premium_payable": farmer_premium,
        "government_subsidy_amount": govt_subsidy_premium,
        "estimated_claim_payout": estimated_claim_payout,
        "actuarial_formula": "Indemnity = Total Sum Insured x [(Threshold Yield - Actual Yield) / Threshold Yield]",
        "claim_instructions": [
            "In case of localized post-harvest or storm damage, intimate the insurance company within 72 hours via the Crop Insurance App or toll-free helpline 14447.",
            "Area-approach yield shortfall claims are reconciled automatically based on Crop Cutting Experiments (CCE) conducted at the Gram Panchayat level.",
            "All claim settlements are disbursed via Direct Benefit Transfer (DBT) directly into your Aadhaar-linked PM-KISAN bank account."
        ],
        # Structured sub-dictionaries
        "yield_metrics": {
            "historical_average_yield_kg_ha": hist_yield,
            "threshold_yield_kg_ha": threshold_yield,
            "predicted_actual_yield_kg_ha": actual_yield,
            "yield_shortfall_kg_ha": shortfall_kg,
            "shortfall_ratio_pct": round(shortfall_ratio * 100, 2)
        },
        "financial_summary": {
            "sum_insured_per_ha_inr": sum_insured_per_ha,
            "total_sum_insured_inr": total_sum_insured,
            "farmer_premium_rate_pct": round(farmer_rate * 100, 1),
            "farmer_premium_payable_inr": farmer_premium,
            "government_subsidy_premium_inr": govt_subsidy_premium,
            "estimated_claim_payout_inr": estimated_claim_payout,
            "net_financial_benefit_inr": net_benefit
        },
        "claim_status": {
            "is_eligible_for_claim": has_shortfall,
            "status_message": status_label,
            "shortfall_severity": "High Loss" if shortfall_ratio > 0.35 else "Moderate Loss" if shortfall_ratio > 0 else "None"
        },
        "pmfby_claim_guidance": [
            "In case of localized post-harvest or storm damage, intimate the insurance company within 72 hours via the Crop Insurance App (Kisan Suvidha) or toll-free helpline (1800-180-1551).",
            "General area-approach yield shortfall claims are reconciled automatically based on Crop Cutting Experiments (CCE) conducted at the Gram Panchayat level.",
            "All claim settlements are disbursed via Direct Benefit Transfer (DBT) directly into your Aadhaar-linked PM-KISAN bank account."
        ]
    }
