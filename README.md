# AGROVISION – AI-Powered Crop Yield Prediction and Optimization System

**Project Reference:** Smart India Hackathon 2025 – SIH25044  
**Category:** Final-Year B.Tech Computer Science & Engineering (Data Science) Mega Project  
**Status:** **100% COMPLETE & PRODUCTION-READY (All 10 Phases Implemented & Verified)**

---

## 1. Executive Summary & Project Identity

**AGROVISION** is a full-stack, AI-powered agricultural decision-support platform designed specifically for Indian farmers. It resolves agricultural volatility by fusing machine learning yield forecasting, multi-spectral Sentinel-2 satellite remote sensing, high-resolution meteorological telemetry, AGMARKNET APMC mandi pricing, CNN leaf disease diagnosis, and multilingual LLM conversational agronomy.

### Core Strategic Features
1. **Dual-Stage Crop Yield Prediction Engine**:
   - **Pre-Sowing Yield Prediction**: Benchmarked across Linear Regression, XGBoost, and Random Forest on 64,194 historical records (1997–2015) with strict out-of-time temporal validation. Champion algorithm: **Random Forest Regressor** ($R^2 = 0.9073$, lowest $\text{MAE} = 1,814.14\text{ kg/ha}$, lowest $\text{MAPE} = 31.18\%$). Features SHAP TreeExplainer feature attribution.
   - **In-Season Multi-Stage Dynamic Updates**: Sequential phenological updates across Early Growth, Vegetative, Flowering, Grain Filling, and Maturity stages. Assimilates observed weather deviations and Sentinel-2 canopy vigour ($NDVI$), dynamically narrowing prediction uncertainty bands from $\pm 18\%$ to $\pm 4\%$.
2. **Crop Leaf Disease Detection (Computer Vision)**:
   - Evaluates foliar photographs using standard 224x224 RGB computer vision pipelines calibrated against PlantVillage and PlantDoc datasets.
   - Distinguishes healthy foliage from major fungal and bacterial pathogens (Soybean Rust, Septoria, Rice Blast, Rice Brown Spot, Wheat Stripe Rust, Cotton Bacterial Blight, Maize Leaf Blight).
   - Generates symptoms, causes, preventive measures, immediate organic remedies, and ICAR-approved chemical treatments with mandatory safety guidelines and low-confidence uncertainty detection.
3. **Sentinel-2 Satellite Remote Sensing**:
   - Optical 10-meter Bottom-of-Atmosphere (BOA) telemetry tracking Normalized Difference Vegetation Index (NDVI), Enhanced Vegetation Index (EVI), and Normalized Difference Water Index (NDWI).
   - Generates 5-day revisit canopy vigour curves and intra-parcel zonation (High Vigour, Moderate Vigour, Stressed/Bare).
4. **Market Price Intelligence (AGMARKNET & e-NAM)**:
   - APMC mandi price comparison across strategic markets.
   - Spatial price sorting, historical trends, and gross revenue calculator for expected harvest yields.
5. **Weather Monitoring & Agricultural Alerts (Open-Meteo & IMD)**:
   - Live hourly weather telemetry and 7-day forecast.
   - Automated IMD threshold hazard engine evaluating Heavy Rain, Heat Stress, Strong Wind, and Dry Spells, linked to farmer notifications.
6. **Multilingual AI Farming Assistant**:
   - Multi-turn conversational agronomist in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
   - Injects real-time farmer context: registered parcel, soil NPK, latest yield prediction, and active weather alerts.
   - Powered by Gemini API with an integrated, scientifically grounded local agronomic knowledge engine fallback.
7. **Crop Optimization Engine**:
   - **Precision Irrigation Planner**: Calculates daily crop evapotranspiration ($ET_c = ET_0 \times K_c$), irrigation efficiency (Drip 90%, Sprinkler 75%, Flood 50%), gross water depth, total volume in $m^3$/liters, and pump operating hours.
   - **Soil-Test-Crop-Response (STCR) Fertilizer Optimization**: Adjusts target NPK doses based on measured soil nitrogen, phosphorus, and potassium, calculating required commercial 50kg bags of Urea, DAP, and MOP across growth stage splits (Basal, Vegetative, Flowering).
8. **Analytical Reports & Audit Summaries**:
   - Certified Yield & Performance Dossier with market valuation.
   - Soil Health Card Audit Certificate (0–100 index).
   - Printable and export-ready formatting.

---

## 2. Technology Stack

### Frontend
- **Framework**: React.js 18 + Vite
- **Styling**: Tailwind CSS (Nature theme: `#174C32` dark green, `#2E8B57` forest green, `#EAF5EC` light green, `#F6F8F5` surface)
- **Visualizations**: Recharts (multi-temporal LineCharts, AreaCharts, BarCharts)
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT Bearer token interception

### Backend
- **Framework**: Python 3.14 + Django 6.1 + Django REST Framework 3.18
- **Authentication**: SimpleJWT (Role-based: `FARMER`, `ADMIN`, `EXPERT`)
- **Documentation**: drf-spectacular (OpenAPI 3.0 & Swagger UI at `/api/docs/`)
- **Database**: PostgreSQL (via `psycopg 3`) with dynamic SQLite development fallback

### Machine Learning & Data Science
- **Libraries**: Scikit-learn, XGBoost, SHAP, Pillow, NumPy, Pandas
- **Algorithms**: Random Forest Regressor (Champion), XGBoost Regressor, Baseline OLS, MobileNet-calibrated Computer Vision Leaf Classifier

---

## 3. Architecture & Modular Applications

```
MEGA PROJECT/
|-- backend/
|   |-- config/                  # Django root settings, URLs, WSGI, OpenAPI
|   |-- apps/
|       |-- accounts/            # Custom User model, FarmerProfile, JWT auth
|       |-- farms/               # Farm parcels, Soil records, summary statistics
|       |-- crops/               # Crops catalog, Seasons, State/District master data
|       |-- predictions/         # Pre-Sowing & In-Season yield prediction engines
|       |-- disease/             # Computer vision leaf disease detection
|       |-- weather/             # Open-Meteo live telemetry & IMD warning engine
|       |-- satellite/           # Sentinel-2 NDVI, EVI, NDWI remote sensing
|       |-- market/              # AGMARKNET APMC mandi price feeds & revenue estimator
|       |-- assistant/           # Multilingual AI Farming Assistant (EN, HI, MR)
|       |-- optimization/        # Precision irrigation & STCR fertilizer engine
|       |-- notifications/       # Farmer alert feeds and system notifications
|       |-- reports/             # Analytical harvest dossiers & soil audit reports
|
|-- frontend/
|   |-- src/
|       |-- components/          # Navbar, Footer, Sidebar, Topbar, ProtectedRoute
|       |-- pages/               # Landing, About, Features, HowItWorks, Contact, Auth
|       |   |-- dashboard/       # Farmer Dashboard, Farm Management, Feature Previews
|       |-- context/             # AuthContext (JWT session persistence)
|       |-- services/            # Axios API service client
|
|-- data/
|   |-- raw/                     # Raw DES crop statistics and IMD rainfall datasets
|   |-- processed/               # Cleaned crop dataset (64,194 records) & EDA summary
|
|-- ml_engine/
|   |-- preprocessing/           # Data cleaning and EDA scripts
|   |-- feature_engineering/     # Pre-sowing temporal feature extraction
|   |-- yield_prediction/        # ML model training and benchmarking pipeline
|   |-- disease_detection/       # Leaf disease classifier and knowledge base
|   |-- models/                  # Serialized champion model (.joblib) & metadata (.json)
|
|-- scripts/
|   |-- seed_initial_data.py     # Seeds states, districts, crops, and demo accounts
|   |-- seed_market_prices.py    # Seeds 60 APMC mandi price feeds
|   |-- test_e2e_api.py          # Master 12-step end-to-end integration test
```

---

## 4. Model Benchmarking Results (Phase 3)

Trained on 64,194 historical records across 6 major Indian states (Maharashtra, Karnataka, Gujarat, Madhya Pradesh, Punjab, Uttar Pradesh) and 8 strategic crops (Soybean, Wheat, Rice, Cotton, Maize, Sugarcane, Groundnut, Ragi) using strict temporal split (Train: 1997–2011 [83.9%], Test: 2012–2015 [16.1%]):

| Model Architecture | $R^2$ Score | MAE (kg/ha) | RMSE (kg/ha) | MAPE (%) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **0.9073** | **1,814.14** | **3,966.19** | **31.18%** | **🏆 Champion (Deployed)** |
| **XGBoost Regressor** | 0.8980 | 1,837.20 | 4,160.03 | 31.83% | Benchmark Candidate |
| **Linear Regression (Baseline)**| 0.9106 | 1,957.48 | 3,894.67 | 45.28% | OLS Baseline |

*Random Forest was chosen as champion due to lowest Mean Absolute Error ($1,814\text{ kg/ha}$) and lowest Mean Absolute Percentage Error ($31.18\%$) on unseen future crop seasons.*

---

## 5. Getting Started & Execution

### Prerequisites
- Python 3.10+ (Tested on Python 3.14.3)
- Node.js 18+ & npm
- PostgreSQL (Optional; runs on automatic SQLite fallback out of the box)

### 1. Backend Setup & Migrations
```powershell
# Navigate to backend
cd backend

# Run database migrations
python manage.py migrate

# Seed initial master data (States, Districts, Crops, Demo Accounts)
python manage.py shell < ../scripts/seed_initial_data.py

# Seed APMC mandi price feeds
python manage.py shell < ../scripts/seed_market_prices.py

# Run Django development server
python manage.py runserver 8000
```

### 2. Frontend Setup & Launch
```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Or build for production
npm run build
```

### 3. Verification & Testing
```powershell
# Run all 35 Django unit tests across all applications
python backend/manage.py test apps.accounts apps.farms apps.predictions apps.weather apps.satellite apps.market apps.disease apps.assistant apps.optimization apps.reports

# Run master end-to-end integration test
python scripts/test_e2e_api.py
```

---

## 6. Default Credentials

- **Demo Farmer Account**:
  - Username: `farmer_ramesh`
  - Password: `FarmerPassword123!`
  - Role: `FARMER` (Nashik, Maharashtra)
- **Demo Administrator Account**:
  - Username: `admin`
  - Password: `AdminPassword123!`
  - Role: `ADMIN` (Django Admin at `/admin/`)

---

## 7. Interactive API Documentation

Interactive Swagger UI and OpenAPI 3.0 schema are active at:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Raw Schema: `http://localhost:8000/api/schema/`
