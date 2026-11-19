import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import {
  TrendingUp,
  ScanEye,
  Store,
  CloudSun,
  Activity,
  BotMessageSquare,
  Sparkles,
  CheckCircle,
  Database,
  Cpu
} from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    {
      id: "dual-stage",
      title: "1. Dual-Stage Crop Yield Prediction Engine",
      tagline: "The primary intelligence core of AGROVISION",
      description: "Unlike static predictors that produce a single number, AGROVISION employs a dual-stage modeling pipeline that mirrors actual agricultural timelines.",
      icon: TrendingUp,
      color: "text-emerald-700 bg-emerald-100",
      details: [
        "Pre-Sowing: Estimates baseline yield potential (kg/ha) using soil chemistry (N, P, K, pH), agro-climatic zone, irrigation method, and 10-year historical climate patterns before sowing.",
        "In-Season Growth Updates: Revises yield estimates at vegetative, flowering, and grain filling stages incorporating actual observed weather and Sentinel-2 NDVI vegetative indices.",
        "Scientific Benchmarking: Validated against multi-year agricultural harvest records and regional climate patterns.",
        "Factor Insights: Clear breakdowns distinguishing positive and negative agronomic influences on harvest yield."
      ]
    },
    {
      id: "disease",
      title: "2. Crop Disease Detection & Leaf Diagnosis",
      tagline: "Deep vision intelligence from mobile leaf photographs",
      description: "Instant diagnosis of foliar plant pathologies using lightweight Convolutional Neural Networks.",
      icon: ScanEye,
      color: "text-blue-700 bg-blue-100",
      details: [
        "Architecture: MobileNetV2 transfer learning trained on PlantVillage & PlantDoc datasets.",
        "Output: Diagnosed disease name, percentage confidence score, visible symptoms, and organic/chemical remedies.",
        "Safety Controls: Uncertainty detection for poor lighting or out-of-distribution images, with clear guidance to consult Krishi Vigyan Kendra (KVK) experts."
      ]
    },
    {
      id: "market",
      title: "3. Mandi Market Price Intelligence",
      tagline: "Live AGMARKNET & eNAM market comparisons",
      description: "Empowers farmers to choose the right market and timing for their harvest.",
      icon: Store,
      color: "text-amber-700 bg-amber-100",
      details: [
        "Mandi Mapping: Real-time and historical minimum, maximum, and modal prices per quintal.",
        "Price Comparison: Cross-market spatial comparison across neighboring APMC mandis.",
        "Gross Revenue Estimator: Automatically calculates estimated gross revenue (Predicted Production in Tonnes × Mandi Modal Price)."
      ]
    },
    {
      id: "weather",
      title: "4. Weather Monitoring & Meteorological Alerts",
      tagline: "Hyper-local forecasts with actionable farm advisories",
      description: "Real-time weather tracking powered by Open-Meteo API and IMD warning guidelines.",
      icon: CloudSun,
      color: "text-indigo-700 bg-indigo-100",
      details: [
        "Forecasts: 7-day hourly temperature, precipitation probability, humidity, and wind velocity.",
        "Alert Categories: Heavy rainfall, extreme heat stress, dry spells, and strong wind warnings.",
        "Actionable Advisories: Direct field operational instructions (e.g., delaying pesticide spraying before rain)."
      ]
    },
    {
      id: "satellite",
      title: "5. Sentinel-2 Satellite Crop Monitoring",
      tagline: "Multi-spectral remote sensing for canopy vigour",
      description: "Automated optical satellite observation using Google Earth Engine Sentinel-2 imagery.",
      icon: Activity,
      color: "text-teal-700 bg-teal-100",
      details: [
        "Vegetation Indices: Normalized Difference Vegetation Index (NDVI), Enhanced Vegetation Index (EVI), and Normalized Difference Water Index (NDWI).",
        "Cloud Filtering: Automatic masking of cloud shadows to preserve clean vegetation observations.",
        "Time-Series Tracking: Progression curves showing vegetative canopy development over the crop lifecycle."
      ]
    },
    {
      id: "assistant",
      title: "6. Multilingual AI Farming Assistant",
      tagline: "Natural language agronomic advisory in English, Hindi & Marathi",
      description: "Conversational AI assistant powered by Gemini API, equipped with farm-specific memory.",
      icon: BotMessageSquare,
      color: "text-emerald-800 bg-emerald-200",
      details: [
        "Languages: English, Hindi (हिंदी), and Marathi (मराठी).",
        "Context Awareness: Authorized to consult the farmer's registered soil pH, crop history, and latest yield estimates.",
        "Safety Guidelines: Adheres to strict agronomic safety guardrails and never prescribes hazardous chemical dosages."
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5]">
      <Navbar />

      <main className="flex-1 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              System Capabilities
            </span>
            <h1 className="text-4xl font-extrabold text-[#174C32]">AGROVISION Core Features</h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Every feature is built as an independent, fully integrated module calibrated for real-world farming operations.
            </p>
          </div>

          <div className="space-y-8">
            {featureList.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.id} className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm space-y-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{f.title}</h2>
                      <p className="text-xs font-semibold text-emerald-700 tracking-wide uppercase mt-0.5">{f.tagline}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {f.description}
                  </p>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60 space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Technical Specifications:</h4>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {f.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
