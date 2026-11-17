"""
Exploratory Data Analysis (EDA) Module for AGROVISION.
Smart India Hackathon 2025 - SIH25044.

Analyzes cleaned agricultural dataset:
- Summary statistics by crop, season, and state
- Feature correlation analysis
- Temporal trend breakdown
"""

import os
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')

def perform_eda():
    input_file = os.path.join(PROCESSED_DIR, 'cleaned_crop_yield.csv')
    df = pd.read_csv(input_file)

    print("=" * 65)
    print("AGROVISION - EXPLORATORY DATA ANALYSIS (EDA)")
    print("=" * 65)
    print(f"Total Clean Records: {len(df)}")
    print(f"Year Span: {df['Crop_Year'].min()} - {df['Crop_Year'].max()}")
    print(f"States Count: {df['State_Name'].nunique()} | Districts Count: {df['District_Name'].nunique()}")

    # 1. Per-Crop Yield Statistics (kg/ha)
    crop_stats = {}
    for crop, group in df.groupby('Crop'):
        y = group['Yield_kg_per_ha']
        crop_stats[crop] = {
            "sample_count": int(len(y)),
            "mean_yield_kg_ha": round(float(y.mean()), 2),
            "median_yield_kg_ha": round(float(y.median()), 2),
            "std_dev": round(float(y.std()), 2),
            "min_yield": round(float(y.min()), 2),
            "max_yield": round(float(y.max()), 2),
            "mean_area_ha": round(float(group['Area'].mean()), 2),
            "mean_rainfall_mm": round(float(group['Seasonal_Rainfall_mm'].mean()), 2)
        }

    print("\n--- Summary Statistics by Strategic Crop (kg/ha) ---")
    for crop, s in crop_stats.items():
        print(f"[{crop:10s}] Count: {s['sample_count']:5d} | Mean: {s['mean_yield_kg_ha']:8.1f} kg/ha | Median: {s['median_yield_kg_ha']:8.1f} | Rain: {s['mean_rainfall_mm']:6.1f} mm")

    # 2. State-Wise Yield Breakdown for Top States
    state_stats = {}
    for state, group in df.groupby('State_Name'):
        if len(group) >= 500:
            state_stats[state] = {
                "records": int(len(group)),
                "crops_grown": group['Crop'].unique().tolist(),
                "mean_yield_kg_ha": round(float(group['Yield_kg_per_ha'].mean()), 2),
                "dominant_soil": group['Soil_Type'].mode()[0]
            }

    # 3. Numeric Feature Correlations with Target (Yield)
    num_cols = [
        'Area', 'Seasonal_Rainfall_mm', 'Soil_pH', 'Nitrogen_N',
        'Phosphorus_P', 'Potassium_K', 'Organic_Carbon_pct',
        'District_Yield_Mean', 'Yield_kg_per_ha'
    ]
    corr_matrix = df[num_cols].corr().round(4).to_dict()

    print("\n--- Feature Correlation with Yield_kg_per_ha ---")
    for col in num_cols:
        if col != 'Yield_kg_per_ha':
            corr_val = corr_matrix['Yield_kg_per_ha'][col]
            print(f" - {col:25s}: r = {corr_val:+.4f}")

    eda_output = {
        "metadata": {
            "total_records": len(df),
            "time_period": f"{df['Crop_Year'].min()}-{df['Crop_Year'].max()}",
            "crops_count": df['Crop'].nunique(),
            "states_count": df['State_Name'].nunique()
        },
        "crop_yield_statistics": crop_stats,
        "state_statistics": state_stats,
        "correlation_with_yield": {k: corr_matrix['Yield_kg_per_ha'][k] for k in num_cols if k != 'Yield_kg_per_ha'}
    }

    out_file = os.path.join(PROCESSED_DIR, 'eda_summary.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(eda_output, f, indent=2)

    print(f"\n[OK] EDA Statistical Summary saved to: {out_file}")
    return eda_output

if __name__ == '__main__':
    perform_eda()
