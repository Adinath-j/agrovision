"""
Feature Engineering & Temporal Split Module for AGROVISION Pre-Sowing Prediction.
Smart India Hackathon 2025 - SIH25044.

Prepares pre-sowing feature representations with strict temporal validation:
- Train Split: 1997 - 2011 (Historical years)
- Test/Validation Split: 2012 - 2015 (Out-of-time evaluation)
- Zero target leakage: only pre-sowing ground conditions, climate baselines & historical trends.
"""

import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')
FEATURES_DIR = os.path.join(BASE_DIR, 'data', 'features')

FEATURE_COLUMNS = [
    'Crop',
    'State_Name',
    'District_Name',
    'Season',
    'Area',
    'Seasonal_Rainfall_mm',
    'Soil_Type',
    'Soil_pH',
    'Nitrogen_N',
    'Phosphorus_P',
    'Potassium_K',
    'Organic_Carbon_pct',
    'District_Yield_Mean'
]

TARGET_COLUMN = 'Yield_kg_per_ha'

def engineer_features():
    os.makedirs(FEATURES_DIR, exist_ok=True)
    input_file = os.path.join(PROCESSED_DIR, 'cleaned_crop_yield.csv')
    df = pd.read_csv(input_file)

    print("=" * 65)
    print("AGROVISION - PRE-SOWING FEATURE ENGINEERING")
    print("=" * 65)
    print(f"Loaded {len(df)} cleaned records from {input_file}")

    # Temporal split: Train on <= 2011, Test on 2012-2015
    train_df = df[df['Crop_Year'] <= 2011].copy()
    test_df = df[df['Crop_Year'] >= 2012].copy()

    print(f"Temporal Split:")
    print(f" - Training Set (1997-2011):   {len(train_df):5d} records ({len(train_df)/len(df)*100:.1f}%)")
    print(f" - Out-of-Time Test (2012-2015): {len(test_df):5d} records ({len(test_df)/len(df)*100:.1f}%)")

    train_out = os.path.join(FEATURES_DIR, 'train_features.csv')
    test_out = os.path.join(FEATURES_DIR, 'test_features.csv')

    cols_to_save = FEATURE_COLUMNS + [TARGET_COLUMN, 'Crop_Year']
    train_df[cols_to_save].to_csv(train_out, index=False)
    test_df[cols_to_save].to_csv(test_out, index=False)

    print(f"[OK] Saved training features to: {train_out}")
    print(f"[OK] Saved test features to:     {test_out}")
    return train_df, test_df

if __name__ == '__main__':
    engineer_features()
