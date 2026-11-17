import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Info,
  Layers,
  ArrowRight,
  HelpCircle,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';

export default function PMFBYEstimator({
  farmId = '',
  cropId = '',
  predictedYieldKgHa = null,
  cropName = 'Soybean',
  farmName = 'My Farm',
  areaHectares = 2.0,
  season = 'Kharif'
}) {
  const [indemnityLevel, setIndemnityLevel] = useState(85);
  const [currentSeason, setCurrentSeason] = useState(season || 'Kharif');
  const [inputYield, setInputYield] = useState(predictedYieldKgHa || 1250);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimData, setClaimData] = useState(null);

  // Sync when prop updates
  useEffect(() => {
    if (predictedYieldKgHa) {
      setInputYield(Math.round(predictedYieldKgHa));
    }
  }, [predictedYieldKgHa]);

  useEffect(() => {
    if (season) {
      setCurrentSeason(season);
    }
  }, [season]);

  const handleCalculateClaim = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/predictions/pmfby-claim/', {
        farm_id: farmId,
        crop_id: cropId,
        predicted_yield_kg_ha: parseFloat(inputYield),
        indemnity_level_pct: parseFloat(indemnityLevel),
        season: currentSeason
      });
      setClaimData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to estimate PMFBY crop insurance claim.');
    } finally {
      setLoading(false);
    }
  };

  // Run calculation on initial load if we have basic inputs
  useEffect(() => {
    handleCalculateClaim();
  }, [farmId, cropId, indemnityLevel, currentSeason]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-6">
      
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174C32] flex items-center justify-center border border-emerald-100 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                PMFBY 2.0 Integration
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Pradhan Mantri Fasal Bima Yojana
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">
              Crop Insurance & Yield Loss Shortfall Estimator
            </h3>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500">
          Actuarial Model Aligned with DAC&FW Guidelines
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls: Indemnity & Yield Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70 text-xs">
        <div>
          <label className="block text-gray-700 font-bold mb-1">
            Indemnity Guarantee Level (%)
          </label>
          <select
            value={indemnityLevel}
            onChange={(e) => setIndemnityLevel(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#174C32]"
          >
            <option value={70}>70% (High Risk / Arid Zone)</option>
            <option value={80}>80% (Moderate Risk / Semi-Arid)</option>
            <option value={85}>85% (National Default Standard)</option>
            <option value={90}>90% (Low Risk / Irrigated Plains)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">
            Cropping Season
          </label>
          <select
            value={currentSeason}
            onChange={(e) => setCurrentSeason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#174C32]"
          >
            <option value="Kharif">Kharif (2.0% Farmer Premium)</option>
            <option value="Rabi">Rabi (1.5% Farmer Premium)</option>
            <option value="Summer">Summer / Commercial (5.0% Premium)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">
            Simulate Actual / Predicted Yield (kg/ha)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="50"
              value={inputYield}
              onChange={(e) => setInputYield(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#174C32]"
            />
            <button
              type="button"
              onClick={handleCalculateClaim}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-[#174C32] text-white hover:bg-[#1E6240] font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
            >
              {loading ? '...' : 'Recalculate'}
            </button>
          </div>
        </div>
      </div>

      {/* Claim Results Display */}
      {claimData && (
        <div className="space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              claimData.is_claim_eligible
                ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {claimData.is_claim_eligible ? (
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-sm">
                  {claimData.is_claim_eligible
                    ? `Yield Shortfall Detected: Loss of ${claimData.shortfall_kg_ha} kg/ha (${claimData.shortfall_percentage}%)`
                    : 'No Yield Shortfall Detected (Harvest Exceeds Threshold)'}
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  Threshold Yield (TY): <span className="font-bold">{claimData.threshold_yield_kg_ha} kg/ha</span> &bull; 
                  Actual Harvest/Predicted (AY): <span className="font-bold">{claimData.actual_or_predicted_yield_kg_ha} kg/ha</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                  claimData.is_claim_eligible
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                {claimData.is_claim_eligible ? 'Claim Eligible' : 'No Shortfall'}
              </span>
            </div>
          </div>

          {/* Key Metric Financial Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">
                Sum Insured / Ha
              </span>
              <div className="text-base sm:text-lg font-black text-gray-900 mt-1">
                ₹{claimData.sum_insured_per_ha.toLocaleString()}
              </div>
              <span className="text-[10px] text-gray-400 block">Scale of Finance</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">
                Total Plot Coverage
              </span>
              <div className="text-base sm:text-lg font-black text-gray-900 mt-1">
                ₹{claimData.total_sum_insured.toLocaleString()}
              </div>
              <span className="text-[10px] text-gray-400 block">{claimData.area_hectares} Hectares</span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <span className="text-[10px] text-sky-800 uppercase font-bold block">
                Farmer Premium ({claimData.farmer_premium_rate_pct}%)
              </span>
              <div className="text-base sm:text-lg font-black text-sky-950 mt-1">
                ₹{claimData.farmer_premium_payable.toLocaleString()}
              </div>
              <span className="text-[10px] text-sky-700 block">
                Govt Subsidy: ₹{claimData.government_subsidy_amount.toLocaleString()}
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                claimData.estimated_claim_payout > 0
                  ? 'bg-emerald-50 border-emerald-300 text-[#174C32]'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block opacity-80">
                Estimated Claim Payout
              </span>
              <div className="text-lg sm:text-xl font-black mt-1">
                ₹{claimData.estimated_claim_payout.toLocaleString()}
              </div>
              <span className="text-[10px] block font-semibold opacity-90">
                {claimData.estimated_claim_payout > 0 ? 'Direct Benefit Transfer' : 'Nil (Yield > TY)'}
              </span>
            </div>
          </div>

          {/* Actuarial Formula & Intimation Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-700" />
                <span>Statutory PMFBY Actuarial Formula</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2.5 rounded-xl border border-gray-200 text-gray-700">
                {claimData.actuarial_formula}
              </p>
              <p className="text-[11px] text-gray-500">
                Threshold Yield is computed from historical 7-year district average yield (excluding up to 2 calamity years) multiplied by selected indemnity level ({claimData.indemnity_level_pct}%).
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>Standard Intimation & Settlement Protocol</span>
              </div>
              <ul className="text-[11px] text-emerald-900 space-y-1">
                {claimData.claim_instructions?.map((inst, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">&bull;</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}