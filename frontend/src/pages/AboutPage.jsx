import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Sprout, Award, Target, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5]">
      <Navbar />

      <main className="flex-1 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Project Specification & Background
            </span>
            <h1 className="text-4xl font-extrabold text-[#174C32]">About AGROVISION</h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Smart India Hackathon 2025 (SIH25044) Final-Year B.Tech Computer Science and Engineering (Data Science) Mega Project.
            </p>
          </div>

          {/* Mission & Problem Statement */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-[#174C32]">
              <Target className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold">The Problem & Motivation</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              Indian agriculture faces mounting volatility from erratic monsoon patterns, soil nutrient imbalances, sudden pest outbreaks, and price collapses at local mandis. Traditional farming advisories are either generic state-level bulletins or static single-point estimations that fail to adapt as crops progress through critical vegetative, flowering, and grain-filling stages.
            </p>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              <strong>AGROVISION</strong> was conceptualized under Smart India Hackathon problem reference <strong>SIH25044</strong> to bridge this gap. We provide an end-to-end intelligent decision-support system that integrates ground soil tests, multi-spectral Sentinel-2 satellite imagery, localized weather forecasts from Open-Meteo, and live AGMARKNET mandi price feeds into actionable, farmer-centric recommendations.
            </p>
          </div>

          {/* Core Objectives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#174C32]">Dual-Stage ML</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Separating pre-sowing planning from dynamic in-season growth updates to prevent data leakage and provide continuous yield forecasting.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#174C32]">Zero Data Fabrication</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Strict adherence to verified data sources: data.gov.in, Open-Meteo, NASA POWER, Sentinel-2, and official AGMARKNET feeds.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#174C32]">Explainable Agronomy</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Transparently explains which key agronomic factors (soil nutrients, rainfall, vegetative canopy) drive your harvest forecast.
              </p>
            </div>
          </div>

          {/* Academic & Architectural Standards */}
          <div className="bg-emerald-900 text-white rounded-2xl p-8 space-y-4">
            <h3 className="text-xl font-bold">Academic & Development Standards</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-emerald-100/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Enterprise Cloud & Secure Database Architecture</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>JWT Authentication & Role-Based Permissions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MobileNetV2 CNN Image Classification for Diseases</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>OpenAPI 3 / Swagger Automated API Documentation</span>
              </li>
            </ul>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
