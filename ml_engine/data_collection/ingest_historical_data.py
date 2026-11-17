"""
Data Ingestion & Provenance Module for AGROVISION.
Smart India Hackathon 2025 - SIH25044.

Documents and standardizes raw datasets from:
1. Ministry of Agriculture and Farmers Welfare / Directorate of Economics & Statistics (DES):
   - Crop Production Statistics in India (District-level Area, Production, Yield from 1997-2015)
2. India Meteorological Department (IMD):
   - Historical Subdivision Rainfall Statistics (1901-2015)
3. Soil Health Card Portal (Ministry of Agriculture):
   - Benchmark state/district macro-nutrient profiles (N, P, K, pH, Organic Carbon)
"""

import os
import json
from datetime import datetime

METADATA = {
    "system": "AGROVISION – AI-Powered Crop Yield Prediction & Optimization",
    "project_reference": "Smart India Hackathon 2025 – SIH25044",
    "ingestion_date": datetime.now().isoformat(),
    "sources": [
        {
            "name": "Directorate of Economics and Statistics (DES), Ministry of Agriculture",
            "dataset": "Crop Production Statistics in India (District Level)",
            "file": "data/raw/crop_production.csv",
            "records": 246091,
            "period": "1997 - 2015",
            "metrics": ["State_Name", "District_Name", "Crop_Year", "Season", "Crop", "Area (Hectares)", "Production (Tonnes)"],
            "url": "https://data.gov.in / open-agri-repo"
        },
        {
            "name": "India Meteorological Department (IMD) / Hydromet Division",
            "dataset": "Subdivision-wise Monthly & Seasonal Rainfall in India",
            "file": "data/raw/rainfall_in_india_1901_2015.csv",
            "records": 4116,
            "period": "1901 - 2015",
            "metrics": ["SUBDIVISION", "YEAR", "JAN-DEC", "ANNUAL", "Jan-Feb", "Mar-May", "Jun-Sep", "Oct-Dec"],
            "url": "https://data.gov.in"
        },
        {
            "name": "Soil Health Card Portal, Govt. of India",
            "dataset": "District-level Macronutrient Benchmark Matrix",
            "metrics": ["Soil_Type", "Soil_pH", "Available_N_kg_ha", "Available_P_kg_ha", "Available_K_kg_ha", "Organic_Carbon_pct"]
        }
    ],
    "target_states": [
        "Maharashtra", "Madhya Pradesh", "Karnataka", "Gujarat", "Punjab", "Uttar Pradesh"
    ],
    "target_crops": [
        "Soybean", "Wheat", "Rice", "Cotton", "Maize", "Sugarcane", "Groundnut", "Ragi"
    ]
}

def record_provenance():
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'raw')
    os.makedirs(out_dir, exist_ok=True)
    meta_path = os.path.join(out_dir, 'dataset_metadata.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(METADATA, f, indent=2)
    print(f"[OK] Ingestion metadata recorded at: {meta_path}")

if __name__ == '__main__':
    record_provenance()
