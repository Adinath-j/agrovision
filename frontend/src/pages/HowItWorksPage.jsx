import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { ArrowRight, UserCheck, Sprout, Satellite, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Register Farmer Profile & Farm Parcels",
      desc: "Sign up and add your farm location (State, District, Village), parcel area in hectares, soil type, and irrigation facilities. Soil test numbers or nutrient parameters (N, P, K) can be entered or marked as unknown.",
      icon: UserCheck
    },
    {
      step: "02",
      title: "Run Pre-Sowing Yield Estimation",
      desc: "Select the intended crop (e.g. Soybean, Wheat, Cotton) and cropping season. AGROVISION automatically fetches 10-year historical climate patterns, regional soil benchmarks, and outputs baseline yield potential (kg/ha) with SHAP factor contributions.",
      icon: Sprout
    },
    {
      step: "03",
      title: "Dynamic In-Season Monitoring",
      desc: "As the crop develops, our pipeline captures real-time Open-Meteo precipitation, temperature fluctuations, and Sentinel-2 multi-spectral NDVI imagery to update expected yields at vegetative, flowering, and grain filling stages.",
      icon: Satellite
    },
    {
      step: "04",
      title: "Mandi Selling & Crop Optimization",
      desc: "Compare modal prices across nearby APMC mandis, estimate gross harvest revenue, receive actionable irrigation/fertilizer advisories, and ask our multilingual AI Assistant anytime.",
      icon: Store
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5]">
      <Navbar />

      <main className="flex-1 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              End-to-End Workflow
            </span>
            <h1 className="text-4xl font-extrabold text-[#174C32]">How AGROVISION Works</h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              A transparent, step-by-step agricultural decision lifecycle connecting ground reality with satellite remote sensing.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#174C32] border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold font-mono text-emerald-600">{s.step}</span>
                    <Icon className="w-6 h-6 mt-0.5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#174C32] text-white rounded-2xl p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Try the Demo Farmer Profile</h3>
            <p className="text-emerald-100 text-sm max-w-lg mx-auto">
              Log in with our pre-configured demo account to explore registered farms in Nashik, Maharashtra with pre-seeded soil profiles and crop records.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#174C32] font-bold text-sm hover:bg-emerald-50 transition-colors shadow-md"
              >
                <span>Sign In with Demo Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
