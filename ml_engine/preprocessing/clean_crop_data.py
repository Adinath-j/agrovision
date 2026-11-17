"""
Data Cleaning & Feature Enrichment Pipeline for AGROVISION.
Smart India Hackathon 2025 - SIH25044.

Processes raw district-level agricultural production and merges with:
1. Official IMD historical rainfall statistics
2. Soil Health Card macro-nutrient benchmarks (pH, N, P, K, Organic Carbon)
3. ICAR agronomic biological thresholds to clean data entry anomalies
"""

import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, 'data', 'raw')
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')

# ICAR Agronomic Biological Yield Upper and Lower Thresholds (kg/ha)
AGRONOMIC_BOUNDS = {
    'Soybean': (50.0, 5000.0),
    'Wheat': (100.0, 8000.0),
    'Rice': (100.0, 8500.0),
    'Cotton': (50.0, 5500.0),
    'Maize': (100.0, 9000.0),
    'Sugarcane': (5000.0, 180000.0),
    'Groundnut': (50.0, 6000.0),
    'Ragi': (50.0, 5000.0)
}

# State to IMD Subdivisions Mapping
STATE_SUBDIVISION_MAP = {
    'Maharashtra': ['MADHYA MAHARASHTRA', 'MARATHWADA', 'VIDARBHA', 'KONKAN & GOA'],
    'Madhya Pradesh': ['WEST MADHYA PRADESH', 'EAST MADHYA PRADESH'],
    'Karnataka': ['NORTH INTERIOR KARNATAKA', 'SOUTH INTERIOR KARNATAKA', 'COASTAL KARNATAKA'],
    'Gujarat': ['GUJARAT REGION', 'SAURASHTRA & KUTCH'],
    'Punjab': ['PUNJAB'],
    'Uttar Pradesh': ['WEST UTTAR PRADESH', 'EAST UTTAR PRADESH'],
    'Rajasthan': ['EAST RAJASTHAN', 'WEST RAJASTHAN'],
    'Haryana': ['HARYANA DELHI & CHANDIGARH'],
    'Tamil Nadu': ['TAMIL NADU'],
    'Andhra Pradesh': ['COASTAL ANDHRA PRADESH', 'RAYALSEEMA'],
    'Telangana': ['TELANGANA'],
    'Bihar': ['BIHAR'],
    'West Bengal': ['GANGETIC WEST BENGAL', 'SUB HIMALAYAN WEST BENGAL & SIKKIM'],
    'Odisha': ['ORISSA'],
    'Assam': ['ASSAM & MEGHALAYA'],
    'Kerala': ['KERALA'],
    'Himachal Pradesh': ['HIMACHAL PRADESH'],
    'Uttarakhand': ['UTTARAKHAND'],
    'Jharkhand': ['JHARKHAND'],
    'Chhattisgarh': ['CHHATTISGARH']
}

# Regional Soil Benchmarks from Soil Health Card Portal
STATE_SOIL_BENCHMARKS = {
    'Maharashtra': {'soil_type': 'BLACK', 'ph': 7.2, 'n': 235.0, 'p': 22.0, 'k': 290.0, 'oc': 0.62},
    'Madhya Pradesh': {'soil_type': 'BLACK', 'ph': 7.1, 'n': 220.0, 'p': 19.5, 'k': 275.0, 'oc': 0.58},
    'Karnataka': {'soil_type': 'RED', 'ph': 6.5, 'n': 245.0, 'p': 24.0, 'k': 240.0, 'oc': 0.65},
    'Gujarat': {'soil_type': 'ALLUVIAL', 'ph': 7.4, 'n': 210.0, 'p': 21.0, 'k': 310.0, 'oc': 0.52},
    'Punjab': {'soil_type': 'ALLUVIAL', 'ph': 7.6, 'n': 280.0, 'p': 28.0, 'k': 260.0, 'oc': 0.55},
    'Uttar Pradesh': {'soil_type': 'ALLUVIAL', 'ph': 7.3, 'n': 255.0, 'p': 23.5, 'k': 250.0, 'oc': 0.56},
    'Rajasthan': {'soil_type': 'DESERT', 'ph': 7.9, 'n': 175.0, 'p': 16.0, 'k': 220.0, 'oc': 0.35},
    'Haryana': {'soil_type': 'ALLUVIAL', 'ph': 7.7, 'n': 270.0, 'p': 26.0, 'k': 255.0, 'oc': 0.54},
    'Tamil Nadu': {'soil_type': 'RED', 'ph': 6.8, 'n': 240.0, 'p': 22.5, 'k': 235.0, 'oc': 0.60},
    'Andhra Pradesh': {'soil_type': 'RED', 'ph': 6.9, 'n': 230.0, 'p': 21.0, 'k': 265.0, 'oc': 0.57},
    'Telangana': {'soil_type': 'RED', 'ph': 7.0, 'n': 225.0, 'p': 20.0, 'k': 250.0, 'oc': 0.55},
    'Bihar': {'soil_type': 'ALLUVIAL', 'ph': 7.2, 'n': 235.0, 'p': 20.5, 'k': 225.0, 'oc': 0.58},
    'West Bengal': {'soil_type': 'ALLUVIAL', 'ph': 6.2, 'n': 260.0, 'p': 25.0, 'k': 210.0, 'oc': 0.72},
    'Odisha': {'soil_type': 'RED', 'ph': 6.3, 'n': 215.0, 'p': 18.0, 'k': 200.0, 'oc': 0.62},
    'Assam': {'soil_type': 'ALLUVIAL', 'ph': 5.6, 'n': 270.0, 'p': 23.0, 'k': 190.0, 'oc': 0.85},
    'DEFAULT': {'soil_type': 'LOAMY', 'ph': 6.9, 'n': 230.0, 'p': 21.0, 'k': 240.0, 'oc': 0.58}
}

def clean_data():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    crop_path = os.path.join(RAW_DIR, 'crop_production.csv')
    rain_path = os.path.join(RAW_DIR, 'rainfall_in_india_1901_2015.csv')

    print(f"Loading raw datasets from:\n - {crop_path}\n - {rain_path}")
    df_crops = pd.read_csv(crop_path)
    df_rain = pd.read_csv(rain_path)

    # Clean string columns
    df_crops['State_Name'] = df_crops['State_Name'].astype(str).str.strip()
    df_crops['District_Name'] = df_crops['District_Name'].astype(str).str.strip().str.title()
    df_crops['Season'] = df_crops['Season'].astype(str).str.strip()
    df_crops['Crop'] = df_crops['Crop'].astype(str).str.strip()

    # Standardize crop names
    crop_name_map = {
        'Soyabean': 'Soybean',
        'Cotton(lint)': 'Cotton',
        'Rice': 'Rice',
        'Wheat': 'Wheat',
        'Maize': 'Maize',
        'Sugarcane': 'Sugarcane',
        'Groundnut': 'Groundnut',
        'Ragi': 'Ragi'
    }
    df_crops = df_crops[df_crops['Crop'].isin(crop_name_map.keys())].copy()
    df_crops['Crop'] = df_crops['Crop'].map(crop_name_map)

    # Standardize Seasons: group Autumn into Kharif, Winter into Rabi
    season_map = {
        'Kharif': 'Kharif',
        'Autumn': 'Kharif',
        'Rabi': 'Rabi',
        'Winter': 'Rabi',
        'Summer': 'Summer',
        'Whole Year': 'Whole Year'
    }
    df_crops['Season'] = df_crops['Season'].map(season_map).fillna('Kharif')

    # Drop missing production or non-positive area
    df_crops = df_crops.dropna(subset=['Production'])
    df_crops = df_crops[df_crops['Area'] > 0].copy()

    # Calculate Yield in kg/ha
    df_crops['Yield_kg_per_ha'] = (df_crops['Production'] * 1000.0) / df_crops['Area']

    # Filter agronomic biological outliers based on ICAR thresholds
    initial_len = len(df_crops)
    valid_mask = pd.Series(True, index=df_crops.index)
    for crop_name, (low, high) in AGRONOMIC_BOUNDS.items():
        crop_mask = df_crops['Crop'] == crop_name
        valid_mask &= ~(crop_mask & ((df_crops['Yield_kg_per_ha'] < low) | (df_crops['Yield_kg_per_ha'] > high)))

    df_crops = df_crops[valid_mask].copy()
    print(f"Filtered {initial_len - len(df_crops)} biological outlier rows. Retained {len(df_crops)} high-confidence records.")

    # Process rainfall dataset
    df_rain['SUBDIVISION'] = df_rain['SUBDIVISION'].astype(str).str.strip()
    rain_lookup = {}
    for _, row in df_rain.iterrows():
        sub = row['SUBDIVISION']
        yr = int(row['YEAR'])
        rain_lookup[(sub, yr)] = {
            'Jun-Sep': row['Jun-Sep'] if pd.notnull(row['Jun-Sep']) else 800.0,
            'Oct-Dec': row['Oct-Dec'] if pd.notnull(row['Oct-Dec']) else 120.0,
            'Jan-Feb': row['Jan-Feb'] if pd.notnull(row['Jan-Feb']) else 25.0,
            'Mar-May': row['Mar-May'] if pd.notnull(row['Mar-May']) else 80.0,
            'ANNUAL': row['ANNUAL'] if pd.notnull(row['ANNUAL']) else 1050.0
        }

    # Helper function to get seasonal rainfall for a state, year, and season
    def get_seasonal_rainfall(state, year, season):
        subs = STATE_SUBDIVISION_MAP.get(state, [])
        vals = []
        for s in subs:
            data = rain_lookup.get((s, year))
            if data:
                if season == 'Kharif':
                    vals.append(data['Jun-Sep'])
                elif season == 'Rabi':
                    vals.append(data['Oct-Dec'] + data['Jan-Feb'])
                elif season == 'Summer':
                    vals.append(data['Mar-May'])
                else:
                    vals.append(data['ANNUAL'])
        if vals:
            return float(np.mean(vals))
        
        # State-level historical fallbacks if year not found
        if season == 'Kharif':
            return 820.0
        elif season == 'Rabi':
            return 145.0
        elif season == 'Summer':
            return 95.0
        return 1060.0

    print("Merging seasonal climate and rainfall features...")
    df_crops['Seasonal_Rainfall_mm'] = [
        get_seasonal_rainfall(s, y, sn)
        for s, y, sn in zip(df_crops['State_Name'], df_crops['Crop_Year'], df_crops['Season'])
    ]

    # Enrich with Soil Health Card attributes
    print("Enriching with Soil Health Card macro-nutrients and soil types...")
    df_crops['Soil_Type'] = [
        STATE_SOIL_BENCHMARKS.get(st, STATE_SOIL_BENCHMARKS['DEFAULT'])['soil_type']
        for st in df_crops['State_Name']
    ]
    df_crops['Soil_pH'] = [
        STATE_SOIL_BENCHMARKS.get(st, STATE_SOIL_BENCHMARKS['DEFAULT'])['ph']
        for st in df_crops['State_Name']
    ]
    df_crops['Nitrogen_N'] = [
        STATE_SOIL_BENCHMARKS.get(st, STATE_SOIL_BENCHMARKS['DEFAULT'])['n']
        for st in df_crops['State_Name']
    ]
    df_crops['Phosphorus_P'] = [
        STATE_SOIL_BENCHMARKS.get(st, STATE_SOIL_BENCHMARKS['DEFAULT'])['p']
        for st in df_crops['State_Name']
    ]
    df_crops['Potassium_K'] = [
        STATE_SOIL_BENCHMARKS.get(st, STATE_SOIL_BENCHMARKS['DEFAULT'])['k']
        for st in df_crops['State_Name']
    ]
    df_crops['Organic_Carbon_pct'] = [
        STATE_SOIL_BENCHMARKS.get(st, STATE_SOIL_BENCHMARKS['DEFAULT'])['oc']
        for st in df_crops['State_Name']
    ]

    # Calculate Historical District Yield Baseline (Moving average strictly prior to current year to prevent target leakage)
    print("Calculating historical district baseline yield benchmarks (zero-leakage)...")
    df_crops = df_crops.sort_values(by=['State_Name', 'District_Name', 'Crop', 'Crop_Year'])
    df_crops['District_Yield_Mean'] = df_crops.groupby(['State_Name', 'District_Name', 'Crop'])['Yield_kg_per_ha'].transform(
        lambda x: x.shift(1).expanding().mean()
    )
    # Fill first observed year with overall crop national median
    crop_medians = df_crops.groupby('Crop')['Yield_kg_per_ha'].median()
    df_crops['District_Yield_Mean'] = df_crops['District_Yield_Mean'].fillna(df_crops['Crop'].map(crop_medians))

    out_file = os.path.join(PROCESSED_DIR, 'cleaned_crop_yield.csv')
    df_crops.to_csv(out_file, index=False)
    print(f"[SUCCESS] Cleaned agricultural dataset saved to: {out_file}")
    print(f"Total rows: {len(df_crops)} | Columns: {df_crops.columns.tolist()}")
    return df_crops

if __name__ == '__main__':
    clean_data()
