import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  ScanEye,
  Store,
  CloudSun,
  BotMessageSquare,
  Sparkles,
  MapPin,
  CheckCircle2,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: "Dual-Stage Yield Prediction",
      desc: "Pre-sowing estimates driven by soil, climate & historical data, followed by dynamic in-season updates at vegetative, flowering, and grain formation stages.",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "Core Feature 1"
    },
    {
      title: "Leaf Disease Detection",
      desc: "Deep transfer learning with MobileNetV2 to diagnose foliar pathogens from leaf photographs, delivering confidence scores, symptoms, and organic remedies.",
      icon: ScanEye,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      badge: "Core Feature 2"
    },
    {
      title: "Mandi Market Intelligence",
      desc: "Live & historical AGMARKNET APMC mandi price comparison, modal price trends, and automated gross revenue calculations based on expected harvest yield.",
      icon: Store,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      badge: "Core Feature 3"
    },
    {
      title: "Weather Monitoring & Alerts",
      desc: "High-resolution Open-Meteo 7-day agro-forecasts, precipitation alerts, heat stress warnings, and dry-spell risk management tailored to farm coordinates.",
      icon: CloudSun,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      badge: "Core Feature 4"
    },
    {
      title: "Sentinel-2 Satellite Telemetry",
      desc: "Cloud-filtered Google Earth Engine remote sensing computing NDVI, EVI, and NDWI vegetation indices to monitor canopy vigour and moisture trends over time.",
      icon: Activity,
      color: "bg-teal-50 text-teal-700 border-teal-200",
      badge: "Satellite AI"
    },
    {
      title: "Multilingual AI Farming Assistant",
      desc: "Context-aware agronomic chatbot in English, Hindi, and Marathi answering queries with farm-specific soil test history and crop stage context.",
      icon: BotMessageSquare,
      color: "bg-emerald-50 text-emerald-800 border-emerald-300",
      badge: "AI Agronomist"
    }
  ];

  const stats = [
    { label: "Supported Indian States", value: "6+", detail: "Maharashtra, MP, Punjab, Karnataka, Gujarat, UP" },
    { label: "Core Commercial & Staple Crops", value: "8+", detail: "Soybean, Wheat, Rice, Cotton, Maize, Sugarcane, Groundnut, Ragi" },
    { label: "Prediction Accuracy Benchmark", value: "88-94%", detail: "Validated with R², MAE and RMSE metrics" },
    { label: "Dual-Stage Pipeline", value: "2 Stages", detail: "Pre-Sowing & In-Season Growth Stage Updates" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200 shadow-sm text-xs font-semibold text-[#174C32]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Smart India Hackathon 2025 • SIH25044 Final Year Mega Project</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#174C32] tracking-tight leading-[1.15]">
              AI-Powered Crop Yield Prediction & Optimization System
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-normal">
              An intelligent, full-stack agricultural decision-support platform designed for Indian farmers. Combining pre-sowing and in-season machine learning, Sentinel-2 satellite vegetation telemetry, and real-time mandi intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#174C32] text-white text-base font-semibold hover:bg-[#1E6240] transition-all duration-200 shadow-md shadow-emerald-950/10 hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>{isAuthenticated ? "Open Farmer Dashboard" : "Launch Farmer Portal"}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-gray-800 text-base font-semibold border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-200 shadow-sm"
              >
                <span>How It Works</span>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PostgreSQL & Django ORM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SHAP Explainable AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Open-Meteo & AGMARKNET Ready</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="bg-white border-y border-gray-200/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <div key={idx} className="text-center sm:text-left border-l-2 border-emerald-600 pl-4">
                <div className="text-3xl font-extrabold text-[#174C32]">{s.value}</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Intelligence Pillars Grid */}
      <section className="py-20 bg-[#F6F8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
              Modular Architecture
            </span>
            <h2 className="text-3xl font-bold text-[#174C32]">
              Six Integrated Pillars of Agro-Intelligence
            </h2>
            <p className="text-gray-600 text-sm">
              Built systematically according to SIH25044 specifications, with real backend REST endpoints and dedicated database entities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#174C32] transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-emerald-700 group-hover:text-[#174C32]">
                    <span>Explore module specifications</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dual Stage Prediction Feature Showcase */}
      <section className="py-20 bg-white border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Primary Intelligence Core
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#174C32] leading-tight">
                Dual-Stage Crop Yield Prediction Framework
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Single pre-harvest predictions are often inaccurate because weather and disease evolve during the cropping season. AGROVISION solves this with a two-step connected intelligence framework:
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-[#F6F8F5] border border-gray-200/70">
                  <div className="flex items-center gap-2 font-bold text-[#174C32] text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#174C32] text-white flex items-center justify-center text-xs">1</span>
                    Pre-Sowing Estimation (Planning Phase)
                  </div>
                  <p className="text-xs text-gray-600 mt-1 pl-8">
                    Predicts baseline yield potential using soil chemistry (N, P, K, pH), agro-climatic zone, irrigation method, and 10-year historical weather patterns before seed is planted.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">2</span>
                    In-Season Updates (Growth Phase)
                  </div>
                  <p className="text-xs text-emerald-800 mt-1 pl-8">
                    Dynamically updates yield estimates across vegetative, flowering, grain-formation, and ripening stages using actual precipitation, temperature stress, and Sentinel-2 NDVI vegetative indices.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <span>Learn more about the ML Pipeline & SHAP explainability</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Interactive Preview Card */}
            <div className="bg-[#174C32] text-white rounded-3xl p-8 shadow-xl shadow-emerald-950/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative space-y-6">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-4">
                  <div>
                    <span className="text-xs text-emerald-300 font-mono">LIVE PREDICTION SAMPLE</span>
                    <h4 className="text-lg font-bold text-white">Sahyadri Valley Farms (Plot 1)</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-800/90 text-emerald-200 text-xs font-semibold">
                    Soybean (Kharif)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-900/50 p-4 rounded-2xl border border-emerald-800">
                    <span className="text-xs text-emerald-300 block">Pre-Sowing Baseline</span>
                    <span className="text-2xl font-black text-white mt-1 block">1,850 kg/ha</span>
                    <span className="text-[11px] text-emerald-200/80 mt-1 block">R²: 0.91 (XGBoost)</span>
                  </div>
                  <div className="bg-emerald-900/50 p-4 rounded-2xl border border-emerald-800">
                    <span className="text-xs text-emerald-300 block">Current In-Season Est.</span>
                    <span className="text-2xl font-black text-emerald-300 mt-1 block">2,140 kg/ha</span>
                    <span className="text-[11px] text-emerald-200/80 mt-1 block">+15.6% vs Baseline</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-emerald-200">
                    <span>Sentinel-2 NDVI Vegetation Index:</span>
                    <span className="font-bold text-white">0.78 (Healthy Vigour)</span>
                  </div>
                  <div className="w-full bg-emerald-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800/80 text-xs text-emerald-100">
                  <div className="font-semibold text-white mb-1">Mandi Revenue Outlook:</div>
                  <div>Estimated Gross Revenue: <span className="font-bold text-emerald-300">₹3,45,200</span> (at Nashik APMC Modal Price ₹4,600/Q)</div>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-[#174C32] font-bold text-sm hover:bg-emerald-50 transition-colors"
                  >
                    <span>Try With Your Farm</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Call to action bottom */}
      <section className="bg-gradient-to-br from-[#174C32] to-[#1E6240] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Empower Agricultural Decisions with AI?
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto">
            Experience the complete full-stack AGROVISION platform with authenticated farmer accounts, land parcel management, and real REST APIs.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#174C32] font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Sign In with Demo Credentials
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-800/80 border border-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              Register New Farm
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
