import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Droplets,
  FlaskConical,
  Calendar,
  RefreshCw,
  MapPin,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import api, { farmService, cropService } from '../../services/api';

export default function CropOptimizationPage() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [growthStage, setGrowthStage] = useState('FLOWERING');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      farmService.getFarms().catch(() => api.get('/api/farms/')),
      cropService.getCrops().catch(() => api.get('/api/crops/'))
    ])
      .then(([farmsRes, cropsRes]) => {
        const farmList = farmsRes.data?.results || farmsRes.data || [];
        const cropList = cropsRes.data?.results || (Array.isArray(cropsRes.data) ? cropsRes.data : []);
        setFarms(farmList);
        setCrops(cropList);
        if (cropList.length > 0) setSelectedCropId(cropList[0].id);
        if (farmList.length > 0) {
          setSelectedFarmId(farmList[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load farms or crops:', err);
        setError('Failed to load farm or crop catalogues.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedFarmId) return;
    loadOptimization(selectedFarmId, selectedCropId, growthStage);
  }, [selectedFarmId, selectedCropId, growthStage]);

  const loadOptimization = (farmId, cropId, stage, forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    let url = `/api/optimization/recommendations/?farm_id=${farmId}&growth_stage=${stage}`;
    if (cropId) url += `&crop_id=${cropId}`;
    if (forceRefresh) url += '&refresh=true';

    api
      .get(url)
      .then((res) => {
        setOptimizationData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch recommendations:', err);
        setError('Failed to load agronomic optimization schedules.');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const handleToggleImplemented = async (recId) => {
    try {
      const res = await api.post(`/api/optimization/recommendations/${recId}/toggle/`);
      setOptimizationData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recommendations: prev.recommendations.map((r) =>
            r.id === recId ? { ...r, is_implemented: res.data.is_implemented } : r
          )
        };
      });
    } catch (err) {
      console.error('Failed to toggle implementation status:', err);
    }
  };

  const irrigation = optimizationData?.irrigation_plan;
  const fertilizer = optimizationData?.fertilizer_plan;
  const recommendations = optimizationData?.recommendations || [];

  return (
    <div className="space-y-4">
      {/* Compact Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Agronomic Decision Support
            </span>
            <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> STCR & ETc Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#174C32] mt-1">
            Crop Optimization Engine
          </h1>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {farms.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {crops.length > 0 && (
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="EARLY_GROWTH">Early Growth</option>
              <option value="VEGETATIVE">Vegetative</option>
              <option value="FLOWERING">Flowering / Anthesis</option>
              <option value="GRAIN_FORMATION">Grain Filling</option>
              <option value="MATURITY">Maturity</option>
            </select>
          </div>

          <button
            onClick={() => loadOptimization(selectedFarmId, selectedCropId, growthStage, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#174C32] hover:bg-[#123825] text-white px-3 py-1.5 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
          <RefreshCw className="w-6 h-6 text-[#2E8B57] animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-700">Calculating Precision Agronomic Schedules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (7 cols): Irrigation & STCR Fertilizer Calculators */}
          <div className="lg:col-span-7 space-y-4">
            {/* STCR Fertilizer Plan Card */}
            {fertilizer && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                        STCR Fertilizer Optimization ({fertilizer.crop_name})
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Soil: {fertilizer.soil_profile.soil_type} (pH {fertilizer.soil_profile.ph})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    NPK: {fertilizer.target_npk_kg_ha.n}-{fertilizer.target_npk_kg_ha.p}-{fertilizer.target_npk_kg_ha.k} kg/ha
                  </span>
                </div>

                {/* Commercial Bags Required */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Urea (46% N)</span>
                    <div className="text-lg font-black text-emerald-950">
                      {fertilizer.commercial_bags_total.urea_50kg_bags} <span className="text-[10px] font-normal">Bags</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">DAP (18:46)</span>
                    <div className="text-lg font-black text-emerald-950">
                      {fertilizer.commercial_bags_total.dap_50kg_bags} <span className="text-[10px] font-normal">Bags</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">MOP (60% K)</span>
                    <div className="text-lg font-black text-emerald-950">
                      {fertilizer.commercial_bags_total.mop_50kg_bags} <span className="text-[10px] font-normal">Bags</span>
                    </div>
                  </div>
                </div>

                {/* Compact Split Schedule Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                        <th className="pb-1.5">Stage</th>
                        <th className="pb-1.5">DAP</th>
                        <th className="pb-1.5">Urea</th>
                        <th className="pb-1.5">MOP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800 text-[11px]">
                      {fertilizer.split_schedule.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="py-2 font-bold">{s.stage}</td>
                          <td className="py-2 font-mono">{s.dap_bags} bags</td>
                          <td className="py-2 font-mono">{s.urea_bags} bags</td>
                          <td className="py-2 font-mono">{s.mop_bags} bags</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {fertilizer.soil_amendment && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                    <strong>pH Amendment:</strong> {fertilizer.soil_amendment}
                  </div>
                )}
              </div>
            )}

            {/* Irrigation Plan Card */}
            {irrigation && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900">Precision Irrigation Schedule</h3>
                      <p className="text-[11px] text-gray-500">
                        {irrigation.irrigation_method} ({irrigation.system_efficiency_pct}% Efficiency)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                    Kc: {irrigation.crop_coefficient_kc}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Daily ETc</span>
                    <div className="text-lg font-black text-blue-950">
                      {irrigation.daily_crop_water_etc_mm} <span className="text-[10px] font-normal">mm/d</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Water Volume</span>
                    <div className="text-lg font-black text-blue-950">
                      {irrigation.water_volume_m3} <span className="text-[10px] font-normal">m³</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Pump Run</span>
                    <div className="text-lg font-black text-blue-950">
                      {irrigation.recommended_run_duration_hours} <span className="text-[10px] font-normal">hrs</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Next Cycle:
                  </span>
                  <strong className="text-blue-900 font-bold">
                    {irrigation.next_irrigation_date} (Every {irrigation.irrigation_interval_days} Days)
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR (5 cols): Actionable Recommendations Checklist */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Farm Action Checklist</h3>
                <p className="text-[11px] text-gray-500">Mark completed field interventions</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {recommendations.filter((r) => r.is_implemented).length}/{recommendations.length} Done
              </span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    rec.is_implemented
                      ? 'bg-gray-50/80 border-gray-200 opacity-75'
                      : 'bg-white border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleToggleImplemented(rec.id)}
                      className="mt-0.5 text-gray-400 hover:text-emerald-700 cursor-pointer transition-colors shrink-0"
                    >
                      {rec.is_implemented ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                            rec.priority === 'HIGH' || rec.priority === 'URGENT'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {rec.category}
                        </span>
                      </div>

                      <h4
                        className={`text-xs font-bold ${
                          rec.is_implemented ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {rec.title}
                      </h4>

                      <p className="text-[11px] text-gray-600 leading-snug">{rec.recommendation}</p>

                      {rec.actions && rec.actions.length > 0 && (
                        <ul className="pt-1.5 space-y-0.5 text-[11px] text-gray-600 border-t border-gray-100 mt-1.5">
                          {rec.actions.map((act, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-600 shrink-0" />
                              <span className="truncate">{act}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}