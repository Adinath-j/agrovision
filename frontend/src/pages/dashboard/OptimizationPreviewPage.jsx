import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Droplets, 
  FlaskConical, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  RefreshCw, 
  MapPin, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import api, { farmService, cropService } from '../../services/api';

export default function OptimizationPreviewPage() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [growthStage, setGrowthStage] = useState('FLOWERING');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [error, setError] = useState(null);

  // Load farms & crops
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
        if (farmList.length > 0) setSelectedFarmId(farmList[0].id);
        if (cropList.length > 0) setSelectedCropId(cropList[0].id);
      })
      .catch((err) => {
        console.error('Failed to load farms or crops:', err);
        setError('Failed to load farm or crop catalogues.');
        setLoading(false);
      });
  }, []);

  // Fetch optimization recommendations
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

    api.get(url)
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
      // Update state locally
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Agronomic Decision Support
            </span>
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> STCR & Precision Irrigation Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#174C32] mt-1.5 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-[#2E8B57]" />
            Crop Optimization Engine
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Precision water scheduling, Soil-Test-Crop-Response (STCR) nutrient balancing, and risk mitigation
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {farms.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.farm_name}</option>
                ))}
              </select>
            </div>
          )}

          {crops.length > 0 && (
            <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
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
            className="flex items-center gap-1.5 text-xs font-bold bg-[#174C32] hover:bg-[#123825] text-white px-3.5 py-2 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-200">
          <RefreshCw className="w-8 h-8 text-[#2E8B57] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Calculating Precision Agronomic Schedules...</p>
          <p className="text-xs text-gray-400 mt-1">Balancing crop evapotranspiration and soil test nutrient equations</p>
        </div>
      ) : (
        <>
          {/* Dual Precision Engines: Irrigation (Left) & Fertilizer (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Irrigation Plan Card */}
            {irrigation && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Precision Irrigation Schedule</h3>
                      <p className="text-xs text-gray-500">Method: {irrigation.irrigation_method} ({irrigation.system_efficiency_pct}% Efficiency)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    Kc: {irrigation.crop_coefficient_kc}
                  </span>
                </div>

                {/* 3 Metric Tiles */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Daily ETc</span>
                    <div className="text-xl font-black text-blue-950 mt-0.5">
                      {irrigation.daily_crop_water_etc_mm} <span className="text-xs font-normal">mm/d</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Water Volume</span>
                    <div className="text-xl font-black text-blue-950 mt-0.5">
                      {irrigation.water_volume_m3} <span className="text-xs font-normal">m³</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600">Run Duration</span>
                    <div className="text-xl font-black text-blue-950 mt-0.5">
                      {irrigation.recommended_run_duration_hours} <span className="text-xs font-normal">hrs</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-gray-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Next Irrigation Date:
                    </span>
                    <strong className="text-blue-900 font-bold">{irrigation.next_irrigation_date} (Every {irrigation.irrigation_interval_days} Days)</strong>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                    {irrigation.irrigation_tip}
                  </p>
                </div>
              </div>
            )}

            {/* STCR Fertilizer Plan Card */}
            {fertilizer && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">STCR Fertilizer Optimization</h3>
                      <p className="text-xs text-gray-500">Soil: {fertilizer.soil_profile.soil_type} (pH {fertilizer.soil_profile.ph})</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    N-P-K: {fertilizer.target_npk_kg_ha.n}-{fertilizer.target_npk_kg_ha.p}-{fertilizer.target_npk_kg_ha.k}
                  </span>
                </div>

                {/* Commercial Bags Required */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Urea (46% N)</span>
                    <div className="text-xl font-black text-emerald-950 mt-0.5">
                      {fertilizer.commercial_bags_total.urea_50kg_bags} <span className="text-xs font-normal">Bags</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">DAP (18:46)</span>
                    <div className="text-xl font-black text-emerald-950 mt-0.5">
                      {fertilizer.commercial_bags_total.dap_50kg_bags} <span className="text-xs font-normal">Bags</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">MOP (60% K)</span>
                    <div className="text-xl font-black text-emerald-950 mt-0.5">
                      {fertilizer.commercial_bags_total.mop_50kg_bags} <span className="text-xs font-normal">Bags</span>
                    </div>
                  </div>
                </div>

                {/* Split Schedule Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                        <th className="pb-2">Growth Stage</th>
                        <th className="pb-2">DAP</th>
                        <th className="pb-2">Urea</th>
                        <th className="pb-2">MOP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {fertilizer.split_schedule.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="py-2.5 font-bold">{s.stage}</td>
                          <td className="py-2.5 font-mono">{s.dap_bags} bags</td>
                          <td className="py-2.5 font-mono">{s.urea_bags} bags</td>
                          <td className="py-2.5 font-mono">{s.mop_bags} bags</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {fertilizer.soil_amendment && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-snug">
                    <strong>pH Amendment:</strong> {fertilizer.soil_amendment}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actionable Recommendations Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Farm Action Plan & Optimization Directives</h3>
                <p className="text-xs text-gray-500">Track and mark completed cultivation interventions</p>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {recommendations.filter((r) => r.is_implemented).length} of {recommendations.length} completed
              </span>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    rec.is_implemented 
                      ? 'bg-gray-50/80 border-gray-200 opacity-75' 
                      : 'bg-white border-gray-200 shadow-2xs hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleImplemented(rec.id)}
                        className="mt-0.5 text-gray-400 hover:text-emerald-700 cursor-pointer transition-colors"
                        title={rec.is_implemented ? "Mark as pending" : "Mark as completed"}
                      >
                        {rec.is_implemented ? (
                          <CheckSquare className="w-5 h-5 text-emerald-700" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            rec.priority === 'HIGH' || rec.priority === 'URGENT'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {rec.priority} Priority
                          </span>
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            {rec.category}
                          </span>
                        </div>

                        <h4 className={`text-sm font-bold ${rec.is_implemented ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {rec.title}
                        </h4>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {rec.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {rec.actions && rec.actions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 pl-8">
                      <div className="text-[11px] font-bold text-gray-700 mb-1.5">Action Items:</div>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {rec.actions.map((act, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-600"></span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
