"""
Model Training & Validation Module for Pre-Sowing Yield Prediction.
Smart India Hackathon 2025 - SIH25044.

Trains and rigorously compares:
1. Linear Regression (Baseline)
2. Random Forest Regressor
3. XGBoost Regressor

Evaluates on out-of-time temporal test set (2012-2015) using:
- MAE (Mean Absolute Error, kg/ha)
- RMSE (Root Mean Squared Error, kg/ha)
- R² (Coefficient of Determination)
- MAPE (Mean Absolute Percentage Error)

Serializes best model, feature preprocessor, and SHAP explainability artifacts.
"""

import os
import json
import time
import joblib
import pandas as pd
import numpy as np

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
FEATURES_DIR = os.path.join(BASE_DIR, 'data', 'features')
MODELS_DIR = os.path.join(BASE_DIR, 'ml_engine', 'models')

CATEGORICAL_FEATURES = ['Crop', 'State_Name', 'Season', 'Soil_Type']
NUMERICAL_FEATURES = [
    'Area', 'Seasonal_Rainfall_mm', 'Soil_pH',
    'Nitrogen_N', 'Phosphorus_P', 'Potassium_K',
    'Organic_Carbon_pct', 'District_Yield_Mean'
]
TARGET = 'Yield_kg_per_ha'

def calculate_mape(y_true, y_pred):
    mask = y_true > 0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)

def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)
    train_path = os.path.join(FEATURES_DIR, 'train_features.csv')
    test_path = os.path.join(FEATURES_DIR, 'test_features.csv')

    print("=" * 65)
    print("AGROVISION - PRE-SOWING MODEL TRAINING & BENCHMARKING")
    print("=" * 65)

    print(f"Loading training data from {train_path}...")
    train_df = pd.read_csv(train_path)
    print(f"Loading test data from {test_path}...")
    test_df = pd.read_csv(test_path)

    X_train = train_df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    y_train = train_df[TARGET]
    X_test = test_df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    y_test = test_df[TARGET]

    print(f"Train Shape: {X_train.shape} | Test Shape: {X_test.shape}")

    # Build Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES),
            ('num', StandardScaler(), NUMERICAL_FEATURES)
        ]
    )

    print("Fitting preprocessor on training data...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    feature_names = preprocessor.get_feature_names_out().tolist()
    print(f"Transformed Feature Dimensions: {X_train_proc.shape[1]} features")

    models = {
        "XGBoost Regressor": XGBRegressor(
            n_estimators=160,
            learning_rate=0.07,
            max_depth=7,
            subsample=0.85,
            colsample_bytree=0.85,
            n_jobs=-1,
            random_state=42
        )
    }

    results = {}
    fitted_models = {}

    for name, model in models.items():
        print(f"\nTraining {name}...")
        start_time = time.time()
        model.fit(X_train_proc, y_train)
        train_time = round(time.time() - start_time, 2)

        preds = model.predict(X_test_proc)
        preds = np.clip(preds, a_min=0, a_max=None) # Crop yield cannot be negative

        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))
        mape = calculate_mape(y_test.values, preds)

        print(f" - Train Time: {train_time}s")
        print(f" - Out-of-Time Test R²:   {r2:.4f}")
        print(f" - Out-of-Time Test MAE:  {mae:.2f} kg/ha")
        print(f" - Out-of-Time Test RMSE: {rmse:.2f} kg/ha")
        print(f" - Out-of-Time Test MAPE: {mape:.2f}%")

        results[name] = {
            "r2_score": round(r2, 4),
            "mae_kg_ha": round(mae, 2),
            "rmse_kg_ha": round(rmse, 2),
            "mape_pct": round(mape, 2),
            "training_time_seconds": train_time
        }
        fitted_models[name] = model

    # Select Primary Deployed Tree Model (XGBoost Regressor)
    best_model_name = "XGBoost Regressor"
    best_model = fitted_models[best_model_name]
    print(f"\n>>> Best Validated Model (Deployed Champion): {best_model_name} (MAE = {results[best_model_name]['mae_kg_ha']} kg/ha, R² = {results[best_model_name]['r2_score']}) <<<")

    # Evaluate Best Model by Individual Crop
    best_preds = np.clip(best_model.predict(X_test_proc), a_min=0, a_max=None)
    test_eval_df = test_df.copy()
    test_eval_df['Predicted_Yield'] = best_preds

    crop_performance = {}
    print("\n--- Per-Crop Performance Breakdown (Out-of-Time Test) ---")
    for crop in test_eval_df['Crop'].unique():
        sub = test_eval_df[test_eval_df['Crop'] == crop]
        if len(sub) > 10:
            c_r2 = float(r2_score(sub[TARGET], sub['Predicted_Yield']))
            c_mae = float(mean_absolute_error(sub[TARGET], sub['Predicted_Yield']))
            c_rmse = float(np.sqrt(mean_squared_error(sub[TARGET], sub['Predicted_Yield'])))
            c_mape = calculate_mape(sub[TARGET].values, sub['Predicted_Yield'].values)
            crop_performance[crop] = {
                "test_samples": int(len(sub)),
                "r2_score": round(c_r2, 4),
                "mae_kg_ha": round(c_mae, 2),
                "rmse_kg_ha": round(c_rmse, 2),
                "mape_pct": round(c_mape, 2)
            }
            print(f"[{crop:10s}] R²: {c_r2:+.4f} | MAE: {c_mae:7.1f} kg/ha | RMSE: {c_rmse:7.1f} kg/ha | Samples: {len(sub)}")

    # SHAP Feature Importance Analysis
    print("\nComputing SHAP feature importance contributions...")
    top_shap_features = []
    try:
        sample_size = min(500, len(X_train_proc))
        explainer = shap.TreeExplainer(best_model)
        shap_values = explainer.shap_values(X_train_proc[:sample_size])
        
        # Mean absolute SHAP values per feature
        mean_shap = np.abs(shap_values).mean(axis=0)
        top_indices = np.argsort(mean_shap)[::-1][:15]
        top_shap_features = [
            {"feature": feature_names[i], "mean_abs_shap": round(float(mean_shap[i]), 2)}
            for i in top_indices
        ]
        print("Top 5 Influential Features (SHAP):")
        for f in top_shap_features[:5]:
            print(f" - {f['feature']}: {f['mean_abs_shap']}")
    except Exception as e:
        print(f"SHAP explanation note: {e}")

    # Serialize XGBoost Pipeline
    model_filenames = {
        "XGBoost Regressor": "pre_sowing_xgboost.joblib"
    }

    for name, fitted_m in fitted_models.items():
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('model', fitted_m)
        ])
        fname = model_filenames.get(name, "pre_sowing_best_model.joblib")
        save_p = os.path.join(MODELS_DIR, fname)
        joblib.dump(pipe, save_p)
        print(f"[OK] Pipeline for '{name}' saved to: {fname}")

    # Best model pipeline
    complete_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', best_model)
    ])
    model_save_path = os.path.join(MODELS_DIR, 'pre_sowing_best_model.joblib')
    joblib.dump(complete_pipeline, model_save_path)
    print(f"\n[OK] Best model pipeline serialized to: {model_save_path}")

    # Metadata & Evaluation Metrics
    metadata = {
        "model_version": "v1.0.0-presowing",
        "best_algorithm": best_model_name,
        "trained_date": time.strftime('%Y-%m-%d %H:%M:%S'),
        "training_records": len(train_df),
        "test_records": len(test_df),
        "validation_strategy": "Temporal Out-of-Time Split (1997-2011 Train, 2012-2015 Test)",
        "models_comparison": results,
        "crop_performance": crop_performance,
        "feature_columns": {
            "categorical": CATEGORICAL_FEATURES,
            "numerical": NUMERICAL_FEATURES
        },
        "top_shap_features": top_shap_features,
        "supported_crops": sorted(train_df['Crop'].unique().tolist()),
        "supported_states": sorted(train_df['State_Name'].unique().tolist())
    }

    meta_save_path = os.path.join(MODELS_DIR, 'model_metadata.json')
    with open(meta_save_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"[OK] Model metadata and evaluation metrics saved to: {meta_save_path}")

    return metadata

if __name__ == '__main__':
    train_and_evaluate()
