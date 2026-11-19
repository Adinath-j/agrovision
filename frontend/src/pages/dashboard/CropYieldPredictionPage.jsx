import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Droplets,
  FlaskConical,
  History,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpRight
} from 'lucide-react';
import { farmService, cropService, predictionService } from '../../services/api';

const ACRES_PER_HA = 2.47105;
const GUNTHA_PER_HA = 100.0;

export default function CropYieldPredictionPage() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [history, setHistory] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

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

  const [areaUnit, setAreaUnit] = useState('acres');
  const [inputArea, setInputArea] = useState('6.18');
  const [useFarmSoil, setUseFarmSoil] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const toAcres = (ha) => (Number(ha) / (1 / ACRES_PER_HA)).toFixed(1);
  const toGuntha = (ha) => (Number(ha) / 0.01).toFixed(0);
  const formatConfidence = (score) => {
    if (!score) return '91%';
    const val = Number(score);
    return `${Math.round(val <= 1 ? val / 0.01 : val)}%`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmsRes, cropsRes, historyRes] = await Promise.all([
          farmService.getFarms(),
          cropService.getCrops(),
          predictionService.getHistory().catch(() => ({ data: { results: [] } }))
        ]);

        const farmList = farmsRes.data.results || farmsRes.data || [];
        setFarms(farmList);
        if (farmList.length > 0) {
          const defaultHa = parseFloat(farmList[0].area_hectares) || 2.5;
          setFormData((prev) => ({
            ...prev,
            farm_id: farmList[0].id,
            area_hectares: defaultHa,
            soil_type: farmList[0].soil_type
          }));
          setInputArea((defaultHa / (1 / ACRES_PER_HA)).toFixed(2));
        }

        const cropList = cropsRes.data.results || cropsRes.data || [];
        setCrops(cropList);
        if (cropList.length > 0) {
          setFormData((prev) => ({ ...prev, crop_id: cropList[0].id }));
        }

        setHistory(historyRes.data?.results || historyRes.data || []);
      } catch (err) {
        console.error('Error loading pre-sowing components:', err);
      }
    };

    fetchData();
  }, []);

  const handleFarmChange = (e) => {
    const selectedId = e.target.value;
    const farm = farms.find((f) => String(f.id) === String(selectedId));
    const newHa = farm ? parseFloat(farm.area_hectares) : parseFloat(formData.area_hectares);
    setFormData((prev) => ({
      ...prev,
      farm_id: selectedId,
      area_hectares: newHa,
      soil_type: farm ? farm.soil_type : prev.soil_type
    }));

    if (areaUnit === 'acres') {
      setInputArea((newHa / (1 / ACRES_PER_HA)).toFixed(2));
    } else if (areaUnit === 'guntha') {
      setInputArea((newHa / 0.01).toFixed(1));
    } else {
      setInputArea(Number(newHa).toFixed(2));
    }
  };

  const handleAreaChange = (val, unit = areaUnit) => {
    setInputArea(val);
    const num = parseFloat(val) || 0;
    let ha = num;
    if (unit === 'acres') ha = num / ACRES_PER_HA;
    else if (unit === 'guntha') ha = num / GUNTHA_PER_HA;
    setFormData((prev) => ({
      ...prev,
      area_hectares: Math.max(0.01, parseFloat(ha.toFixed(4)))
    }));
  };

  const handleUnitSwitch = (newUnit) => {
    if (newUnit === areaUnit) return;
    const currentHa = parseFloat(formData.area_hectares) || 0;
    let newVal = currentHa;
    if (newUnit === 'acres') newVal = currentHa / (1 / ACRES_PER_HA);
    else if (newUnit === 'guntha') newVal = currentHa / 0.01;
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
        algorithm: 'XGBoost Regressor'
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

      const histRes = await predictionService.getHistory();
      setHistory(histRes.data?.results || histRes.data || []);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to generate pre-sowing prediction.');
    } finally {
      setPredicting(false);
    }
  };

  // Allow clicking a sidebar history card to preview its saved result
  const handleSelectHistoryItem = (item) => {
    const yieldKg = Number(item.predicted_yield_kg_per_ha) || 0;
    const minKg = Number(item.prediction_interval_min_kg) || Math.round(yieldKg * 0.88);
    const maxKg = Number(item.prediction_interval_max_kg) || Math.round(yieldKg * 1.12);
    const estHa =
      yieldKg > 0 && item.predicted_total_production_tonnes
        ? Number(((Number(item.predicted_total_production_tonnes) * 1000) / yieldKg).toFixed(2))
        : currentHa;

    setPredictionResult((prev) => ({
      ...prev,
      prediction_id: item.id,
      crop_name: item.crop_name,
      farm_name: item.farm_name,
      model_algorithm: item.model_algorithm || 'XGBoost Regressor',
      predicted_yield_kg_per_ha: yieldKg,
      predicted_yield_tonnes_per_ha: (yieldKg / 1000).toFixed(2),
      predicted_total_production_tonnes: item.predicted_total_production_tonnes,
      area_hectares: estHa,
      crop_suitability: 'Archived Forecast',
      prediction_interval: {
        min_kg_per_ha: minKg,
        max_kg_per_ha: maxKg
      },
      historical_comparison: prev?.historical_comparison || {
        benchmark_yield_kg_ha: Math.round(yieldKg * 0.95),
        difference_percentage: 5.0,
        verdict: `Logged on ${item.prediction_date}`
      },
      influencing_factors: item.influencing_factors?.length
        ? item.influencing_factors
        : prev?.influencing_factors || [],
      recommendations: item.recommendations?.length
        ? item.recommendations
        : prev?.recommendations || []
    }));
  };

  const currentHa = parseFloat(formData.area_hectares) || 0;
  const visibleHistory = showAllHistory ? history.slice(0, 8) : history.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Compact Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              XGBoost Core Engine
            </span>
            <span className="text-[11px] font-medium text-gray-500">
              SHAP Explainability + STCR Optimizer
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#174C32] mt-1">
            Crop Yield Prediction & Optimization
          </h1>
        </div>
      </div>

      {/* 3-Column Balanced Grid: Form (3) | Results (6) | History Sidebar (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Compact Input Form (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h2 className="text-sm font-bold text-gray-900">Cultivation Inputs</h2>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              XGBoost
            </span>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Farm Parcel
              </label>
              <select
                required
                value={formData.farm_id}
                onChange={handleFarmChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.area_hectares} Ha)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Intended Crop
              </label>
              <select
                required
                value={formData.crop_id}
                onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.marathi_name ? `(${c.marathi_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Season
                </label>
                <select
                  value={formData.season_name}
                  onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                >
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Summer">Summer</option>
                  <option value="Whole Year">Whole Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Sowing Date
                </label>
                <input
                  type="date"
                  value={formData.sowing_date}
                  onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                  className="w-full px-2 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-gray-700">Area</label>
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[9px]">
                  {['acres', 'hectares', 'guntha'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleUnitSwitch(u)}
                      className={`px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer ${
                        areaUnit === u ? 'bg-[#174C32] text-white' : 'text-gray-600'
                      }`}
                    >
                      {u === 'hectares' ? 'Ha' : u === 'acres' ? 'Ac' : 'Gu'}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={inputArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">
                ≈ {currentHa} Ha ({toAcres(currentHa)} Ac / {toGuntha(currentHa)} Gu)
              </span>
            </div>

            {/* Soil Parameters Toggle */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-800">Soil Nutrients</span>
                <button
                  type="button"
                  onClick={() => setUseFarmSoil(!useFarmSoil)}
                  className="text-[10px] font-semibold text-emerald-700 hover:underline"
                >
                  {useFarmSoil ? 'Override NPK' : 'Use Farm Profile'}
                </button>
              </div>

              {useFarmSoil ? (
                <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Using saved farm soil NPK & pH</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.soil_ph}
                    onChange={(e) => setFormData({ ...formData, soil_ph: e.target.value })}
                    placeholder="pH (7.1)"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  />
                  <input
                    type="number"
                    value={formData.nitrogen_n}
                    onChange={(e) => setFormData({ ...formData, nitrogen_n: e.target.value })}
                    placeholder="N kg/ha"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  />
                  <input
                    type="number"
                    value={formData.phosphorus_p}
                    onChange={(e) => setFormData({ ...formData, phosphorus_p: e.target.value })}
                    placeholder="P kg/ha"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  />
                  <input
                    type="number"
                    value={formData.potassium_k}
                    onChange={(e) => setFormData({ ...formData, potassium_k: e.target.value })}
                    placeholder="K kg/ha"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="w-full py-2.5 rounded-xl bg-[#174C32] text-white hover:bg-[#1E6240] text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{predicting ? 'Running XGBoost...' : 'Predict Yield & Optimize'}</span>
            </button>
          </form>
        </div>

        {/* CENTER COLUMN: Compact Prediction & Optimization Output (6 cols) */}
        <div className="lg:col-span-6">
          {predictionResult ? (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs space-y-4">
              {/* Compact Result Header */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                    {predictionResult.model_algorithm || 'XGBoost Regressor'}
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
                    {predictionResult.crop_name} — {predictionResult.farm_name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 block">
                    {predictionResult.crop_suitability}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {predictionResult.historical_comparison?.verdict}
                  </span>
                </div>
              </div>

              {/* 3 KPI Metrics Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                  <span className="text-[10px] text-emerald-800 font-semibold uppercase block">Expected Yield</span>
                  <div className="text-lg sm:text-xl font-black text-[#174C32]">
                    {Number(predictionResult.predicted_yield_kg_per_ha).toLocaleString()} <span className="text-xs font-bold">kg/ha</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {predictionResult.predicted_yield_tonnes_per_ha ?? (predictionResult.predicted_yield_kg_per_ha / 1000).toFixed(2)} t/ha
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70">
                  <span className="text-[10px] text-blue-800 font-semibold uppercase block">Total Harvest</span>
                  <div className="text-lg sm:text-xl font-black text-blue-950">
                    {predictionResult.predicted_total_production_tonnes} <span className="text-xs font-bold">T</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">
                    On {predictionResult.area_hectares} Ha
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
                  <span className="text-[10px] text-amber-800 font-semibold uppercase block">Range (±12%)</span>
                  <div className="text-xs sm:text-sm font-extrabold text-amber-950 mt-1">
                    {predictionResult.prediction_interval.min_kg_per_ha}–{predictionResult.prediction_interval.max_kg_per_ha}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">kg/ha</span>
                </div>
              </div>

              {/* Unified STCR Fertilizer & Irrigation Cards */}
              {predictionResult.optimization && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-[#174C32] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Agronomic Optimization (STCR & Irrigation)
                    </h4>
                    <Link
                      to="/dashboard/optimization"
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      <span>Full Schedule</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {predictionResult.optimization.fertilizer && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-amber-950 text-[11px]">
                          <span className="flex items-center gap-1">
                            <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
                            50kg Fertilizer Bags
                          </span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            NPK {predictionResult.optimization.fertilizer.target_npk_kg_ha?.n}-{predictionResult.optimization.fertilizer.target_npk_kg_ha?.p}-{predictionResult.optimization.fertilizer.target_npk_kg_ha?.k}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                            <span className="text-[9px] text-gray-500 block">DAP</span>
                            <span className="text-sm font-extrabold text-amber-900">
                              {predictionResult.optimization.fertilizer.commercial_bags_total?.dap_50kg_bags ?? 0}
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                            <span className="text-[9px] text-gray-500 block">Urea</span>
                            <span className="text-sm font-extrabold text-amber-900">
                              {predictionResult.optimization.fertilizer.commercial_bags_total?.urea_50kg_bags ?? 0}
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                            <span className="text-[9px] text-gray-500 block">MOP</span>
                            <span className="text-sm font-extrabold text-amber-900">
                              {predictionResult.optimization.fertilizer.commercial_bags_total?.mop_50kg_bags ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {predictionResult.optimization.irrigation && (
                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-blue-950 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5 text-blue-700" />
                            Irrigation ({predictionResult.optimization.irrigation.irrigation_method})
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            ETc {predictionResult.optimization.irrigation.daily_crop_water_etc_mm}mm
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-center">
                          <div className="bg-white p-1.5 rounded-lg border border-blue-200">
                            <span className="text-[9px] text-gray-500 block">Volume</span>
                            <span className="text-sm font-extrabold text-blue-900">
                              {predictionResult.optimization.irrigation.water_volume_m3} m³
                            </span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-blue-200">
                            <span className="text-[9px] text-gray-500 block">Pump Run</span>
                            <span className="text-sm font-extrabold text-blue-900">
                              {predictionResult.optimization.irrigation.recommended_run_duration_hours} hrs
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compact Explainable AI Factors */}
              {predictionResult.influencing_factors?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    Key Agronomic Drivers (Explainable AI)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {predictionResult.influencing_factors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-gray-900 block text-[11px] truncate">{factor.factor}</span>
                          <span className="text-[10px] text-gray-500">{factor.value}</span>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                          {factor.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact Top 2 Actionable Recommendations */}
              {predictionResult.recommendations?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    Key Advisory Actions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {predictionResult.recommendations.slice(0, 2).map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-emerald-950 line-clamp-2">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 flex flex-col items-center justify-center min-h-[380px] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174C32] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Ready for Yield & Optimization Inference</h3>
              <p className="text-xs text-gray-500 max-w-xs">
                Confirm your parcel and crop on the left, then click "Predict Yield & Optimize" or select a recent run from the right panel.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Scrollbar-Free Interactive History Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#174C32] flex items-center justify-center">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 leading-none">Recent Runs</h3>
                <span className="text-[10px] text-gray-400">Click to inspect</span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              {history.length} Total
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">
              No predictions logged yet.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {visibleHistory.map((h) => {
                  const isSelected = predictionResult?.prediction_id === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleSelectHistoryItem(h)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                          : 'bg-gray-50/60 border-gray-200/70 hover:bg-emerald-50/40 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {h.crop_name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          {formatConfidence(h.confidence_score)}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-1.5 pl-3">
                        <span className="text-sm font-black text-[#174C32]">
                          {Number(h.predicted_yield_kg_per_ha).toLocaleString()}{' '}
                          <span className="text-[10px] font-semibold text-gray-500">kg/ha</span>
                        </span>
                        <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                          {h.predicted_total_production_tonnes} T
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-200/50 pl-3">
                        <span className="truncate max-w-[105px] font-medium text-gray-600">
                          {h.farm_name}
                        </span>
                        <span className="flex items-center gap-0.5 font-mono text-[9px]">
                          <Clock className="w-2.5 h-2.5" />
                          {h.prediction_date}
                          <ArrowUpRight className="w-2.5 h-2.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {history.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-[11px] font-semibold text-gray-600 flex items-center justify-center gap-1 transition-colors cursor-pointer border border-gray-200/60"
                >
                  {showAllHistory ? (
                    <>
                      <span>Show Latest 4</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>View {Math.min(history.length - 4, 4)} More</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}