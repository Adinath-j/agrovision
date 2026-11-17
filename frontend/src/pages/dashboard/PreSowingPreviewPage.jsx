import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  Award,
  ChevronDown
} from 'lucide-react';
import { farmService, cropService, predictionService } from '../../services/api';
import api from '../../services/api';
import PMFBYEstimator from '../../components/common/PMFBYEstimator';

export default function PreSowingPredictionPage() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    farm_id: '',
    crop_id: '',
    season_name: 'Kharif',
    area_hectares: 2.5,
    sowing_date: new Date().toISOString().split('T')[0],
    soil_type: '',
    soil_ph: '',
    nitrogen_n: '',
    phosphorus_p: '',
    potassium_k: ''
  });

  // Feature: Land unit selection (Hectares | Acres | Guntha)
  const [areaUnit, setAreaUnit] = useState('acres'); // 'acres' | 'hectares' | 'guntha'
  const [inputArea, setInputArea] = useState('6.18');

  // Feature: Multi-Algorithm Selection (Linear Baseline | Random Forest | XGBoost)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('Random Forest Regressor');

  const [useFarmSoil, setUseFarmSoil] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmsRes, cropsRes, metaRes, historyRes] = await Promise.all([
          farmService.getFarms(),
          cropService.getCrops(),
          api.get('/api/predictions/model-metadata/').catch(() => ({ data: null })),
          predictionService.getHistory().catch(() => ({ data: { results: [] } }))
        ]);

        const farmList = farmsRes.data.results || farmsRes.data || [];
        setFarms(farmList);
        if (farmList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            farm_id: farmList[0].id,
            area_hectares: farmList[0].area_hectares,
            soil_type: farmList[0].soil_type
          }));
        }

        const cropList = cropsRes.data.results || cropsRes.data || [];
        setCrops(cropList);
        if (cropList.length > 0) {
          setFormData((prev) => ({ ...prev, crop_id: cropList[0].id }));
        }

        setMetadata(metaRes.data);
        setHistory(historyRes.data?.results || historyRes.data || []);
      } catch (err) {
        console.error("Error loading pre-sowing components:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFarmChange = (e) => {
    const selectedId = e.target.value;
    const farm = farms.find((f) => String(f.id) === String(selectedId));
    const newHa = farm ? farm.area_hectares : formData.area_hectares;
    setFormData((prev) => ({
      ...prev,
      farm_id: selectedId,
      area_hectares: newHa,
      soil_type: farm ? farm.soil_type : prev.soil_type
    }));

    if (areaUnit === 'acres') {
      setInputArea((newHa * 2.47105).toFixed(2));
    } else if (areaUnit === 'guntha') {
      setInputArea((newHa * 100).toFixed(1));
    } else {
      setInputArea(Number(newHa).toFixed(2));
    }
  };

  const handleAreaChange = (val, unit = areaUnit) => {
    setInputArea(val);
    const num = parseFloat(val) || 0;
    let ha = num;
    if (unit === 'acres') ha = num / 2.47105;
    else if (unit === 'guntha') ha = num / 100.0;
    setFormData((prev) => ({
      ...prev,
      area_hectares: Math.max(0.01, parseFloat(ha.toFixed(4)))
    }));
  };

  const handleUnitSwitch = (newUnit) => {
    if (newUnit === areaUnit) return;
    const currentHa = parseFloat(formData.area_hectares) || 0;
    let newVal = currentHa;
    if (newUnit === 'acres') newVal = currentHa * 2.47105;
    else if (newUnit === 'guntha') newVal = currentHa * 100.0;
    setAreaUnit(newUnit);
    setInputArea(newVal > 0 ? parseFloat(newVal.toFixed(2)).toString() : '');
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPredicting(true);

    try {
      const payload = {
        farm_id: formData.farm_id,
        crop_id: formData.crop_id,
        season_name: formData.season_name,
        area_hectares: parseFloat(formData.area_hectares),
        sowing_date: formData.sowing_date,
        algorithm: selectedAlgorithm,
      };

      if (!useFarmSoil) {
        if (formData.soil_type) payload.soil_type = formData.soil_type;
        if (formData.soil_ph) payload.soil_ph = parseFloat(formData.soil_ph);
        if (formData.nitrogen_n) payload.nitrogen_n = parseFloat(formData.nitrogen_n);
        if (formData.phosphorus_p) payload.phosphorus_p = parseFloat(formData.phosphorus_p);
        if (formData.potassium_k) payload.potassium_k = parseFloat(formData.potassium_k);
      }

      const res = await predictionService.predictPreSowing(payload);
      setPredictionResult(res.data);

      // Refresh history
      const histRes = await predictionService.getHistory();
      setHistory(histRes.data?.results || histRes.data || []);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to generate pre-sowing prediction.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Dual-Stage ML Crop Intelligence
          </span>
          <span className="text-xs font-semibold text-gray-500">
            Validated against 10-Year Historical Climate & Soil Records
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#174C32] mt-2">
          Pre-Sowing Crop Yield Prediction
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
          Estimate expected crop yield per hectare, total production, and revenue potential before committing seeds to the soil.
        </p>
      </div>

      {/* Main Grid: Input Form & Prediction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">Pre-Sowing Inputs</h2>
            <span className="text-[11px] text-gray-500">Live DRF API</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Farm Parcel *
              </label>
              <select
                required
                value={formData.farm_id}
                onChange={handleFarmChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.area_hectares} Ha • {f.village || f.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Intended Crop *
                </label>
                <select
                  required
                  value={formData.crop_id}
                  onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.marathi_name ? `(${c.marathi_name})` : c.hindi_name ? `(${c.hindi_name})` : ''} - {c.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cropping Season *
                </label>
                <select
                  value={formData.season_name}
                  onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                >
                  <option value="Kharif">Kharif (Monsoon)</option>
                  <option value="Rabi">Rabi (Winter)</option>
                  <option value="Summer">Zaid / Summer</option>
                  <option value="Whole Year">Whole Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Cultivation Area *
                  </label>
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[9px]">
                    <button
                      type="button"
                      onClick={() => handleUnitSwitch('acres')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${areaUnit === 'acres' ? 'bg-[#174C32] text-white' : 'text-gray-600'
                        }`}
                    >
                      Acres
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitSwitch('hectares')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${areaUnit === 'hectares' ? 'bg-[#174C32] text-white' : 'text-gray-600'
                        }`}
                    >
                      Ha
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitSwitch('guntha')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${areaUnit === 'guntha' ? 'bg-[#174C32] text-white' : 'text-gray-600'
                        }`}
                    >
                      Guntha
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={inputArea}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32] pr-12"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold uppercase pointer-events-none">
                    {areaUnit === 'acres' ? 'Ac' : areaUnit === 'guntha' ? 'Guntha' : 'Ha'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  ≈ {formData.area_hectares} Ha ({(formData.area_hectares * 2.47105).toFixed(1)} Ac / {(formData.area_hectares * 100).toFixed(0)} Guntha)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Planned Sowing Date
                </label>
                <input
                  type="date"
                  value={formData.sowing_date}
                  onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                />
              </div>
            </div>

            {/* Algorithm Selector Block */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#174C32] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                  Select Machine Learning Algorithm *
                </label>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  SIH25044 ML Engine
                </span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    id: 'Random Forest Regressor',
                    name: 'Random Forest Regressor',
                    badge: 'Recommended Best • R²: 0.91',
                    desc: 'Ensemble of 100 Decision Trees with bootstrap bagging. Validated lowest error.',
                  },
                  {
                    id: 'XGBoost Regressor',
                    name: 'XGBoost Regressor',
                    badge: 'Boosted Trees • R²: 0.90',
                    desc: 'Extreme Gradient Boosted Trees with L1/L2 regularisation and tree pruning.',
                  },
                  {
                    id: 'Linear Regression (Baseline)',
                    name: 'Linear Regression (Baseline)',
                    badge: 'Fast Baseline • R²: 0.91',
                    desc: 'Ordinary Least Squares Linear Baseline model for benchmark comparison.',
                  }
                ].map((algo) => {
                  const isSelected = selectedAlgorithm === algo.id;
                  return (
                    <label
                      key={algo.id}
                      onClick={() => setSelectedAlgorithm(algo.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'bg-white/60 border-gray-200/90 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="algorithm"
                        value={algo.id}
                        checked={isSelected}
                        onChange={() => setSelectedAlgorithm(algo.id)}
                        className="mt-0.5 text-emerald-700 focus:ring-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-gray-900">{algo.name}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {algo.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{algo.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Soil Parameters Toggle */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800">Soil Nutrient Context</span>
                <button
                  type="button"
                  onClick={() => setUseFarmSoil(!useFarmSoil)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  {useFarmSoil ? 'Custom Soil Values' : 'Use Farm Defaults'}
                </button>
              </div>

              {useFarmSoil ? (
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Auto-Loaded From Farm / SHC Portal</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    Pre-fills Soil pH, Nitrogen (N), Phosphorus (P), and Potassium (K) from the registered soil health profile without forcing manual entry.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Soil pH</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.soil_ph}
                      onChange={(e) => setFormData({ ...formData, soil_ph: e.target.value })}
                      placeholder="e.g. 7.1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Nitrogen N (kg/ha)</label>
                    <input
                      type="number"
                      value={formData.nitrogen_n}
                      onChange={(e) => setFormData({ ...formData, nitrogen_n: e.target.value })}
                      placeholder="e.g. 240"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="w-full py-3 rounded-xl bg-[#174C32] text-white hover:bg-[#1E6240] text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{predicting ? 'Executing Trained Model...' : 'Calculate Pre-Sowing Yield'}</span>
            </button>

          </form>
        </div>

        {/* Prediction Results Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {predictionResult ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Prediction Generated
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                    {predictionResult.crop_name} • {predictionResult.farm_name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 block">
                    {predictionResult.crop_suitability}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Model: {predictionResult.model_metadata.algorithm}
                  </span>
                </div>
              </div>

              {/* Primary Output Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
                  <span className="text-xs text-emerald-800 font-medium">Expected Yield</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#174C32]">
                    {predictionResult.predicted_yield_kg_per_ha.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block">kg per hectare</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 space-y-1">
                  <span className="text-xs text-blue-800 font-medium">Total Production</span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-950">
                    {predictionResult.predicted_total_production_tonnes}
                  </div>
                  <span className="text-[11px] text-blue-700 font-semibold block">Tonnes ({predictionResult.area_hectares} Ha)</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                  <span className="text-xs text-amber-800 font-medium">Prediction Interval</span>
                  <div className="text-base font-extrabold text-amber-950 mt-1">
                    {predictionResult.prediction_interval.min_kg_per_ha} – {predictionResult.prediction_interval.max_kg_per_ha}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium block">kg/ha (Calibrated ±12%)</span>
                </div>
              </div>

              {/* Selected Model Performance Badge */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Active Predictor Pipeline
                    </span>
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {predictionResult.model_metadata.algorithm}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block uppercase">Validation R²</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {predictionResult.model_metadata.r2_score || predictionResult.model_metadata.confidence_score}
                    </span>
                  </div>
                  {predictionResult.model_metadata.mae_kg_ha && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block uppercase">Test MAE</span>
                      <span className="font-mono font-bold text-gray-800">
                        {predictionResult.model_metadata.mae_kg_ha} kg/ha
                      </span>
                    </div>
                  )}
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-300">
                    {predictionResult.model_metadata.version}
                  </span>
                </div>
              </div>

              {/* Regional Benchmark Comparison */}
              <div className="p-4 rounded-2xl bg-[#F6F8F5] border border-gray-200/70 space-y-1.5 text-xs text-gray-700">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Historical Regional Benchmark Comparison:</span>
                  <span className={predictionResult.historical_comparison.difference_percentage >= 0 ? "text-emerald-700" : "text-amber-700"}>
                    {predictionResult.historical_comparison.verdict}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  National/District baseline: {predictionResult.historical_comparison.benchmark_yield_kg_ha} kg/ha.
                </p>
              </div>

              {/* SHAP Factor Influences */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  SHAP Explainability – Key Influencing Factors
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {predictionResult.influencing_factors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{factor.factor}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {factor.impact}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-Sowing Cultivation Recommendations */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Actionable Pre-Sowing Agronomic Recommendations
                </h4>
                <div className="space-y-2 text-xs">
                  {predictionResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-emerald-950 font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#174C32] flex items-center justify-center mx-auto">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Prediction Generated Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Select your farm parcel and crop on the left, then click "Calculate Pre-Sowing Yield" to run the validated Random Forest model.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Feature D: PMFBY Crop Insurance & Yield Shortfall Estimator */}
      <PMFBYEstimator
        farmId={formData.farm_id}
        cropId={formData.crop_id}
        predictedYieldKgHa={predictionResult ? predictionResult.predicted_yield_kg_per_ha : null}
        cropName={crops.find((c) => String(c.id) === String(formData.crop_id))?.name || 'Soybean'}
        farmName={farms.find((f) => String(f.id) === String(formData.farm_id))?.farm_name || 'My Farm'}
        areaHectares={parseFloat(formData.area_hectares) || 2.0}
        season={formData.season_name}
      />

      {/* Historical Predictions Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-gray-900">Pre-Sowing Prediction History</h3>

        {history.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">
            No previous predictions logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8F5] text-gray-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Date</th>
                  <th className="p-3">Farm</th>
                  <th className="p-3">Crop</th>
                  <th className="p-3">Predicted Yield</th>
                  <th className="p-3">Est. Production</th>
                  <th className="p-3">Model</th>
                  <th className="p-3 rounded-r-xl">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-3 text-gray-500 font-mono text-[11px]">{h.prediction_date}</td>
                    <td className="p-3 font-semibold text-gray-900">{h.farm_name}</td>
                    <td className="p-3 text-gray-700">{h.crop_name}</td>
                    <td className="p-3 font-bold text-[#174C32]">{Number(h.predicted_yield_kg_per_ha).toLocaleString()} kg/ha</td>
                    <td className="p-3 text-gray-800">{h.predicted_total_production_tonnes} T</td>
                    <td className="p-3 text-gray-500 text-[11px]">{h.model_algorithm}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{h.confidence_score ? `${h.confidence_score * 100}%` : '91%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
