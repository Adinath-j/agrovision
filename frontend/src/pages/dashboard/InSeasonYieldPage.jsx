import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  TrendingUp, 
  TrendingDown, 
  Satellite, 
  Droplets, 
  Bug, 
  FlaskConical, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Area, 
  AreaChart 
} from 'recharts';
import api, { farmService, cropService } from '../../services/api';
import PMFBYEstimator from '../../components/common/PMFBYEstimator';

const STAGES = [
  { id: 'EARLY_GROWTH', label: 'Early Growth', days: '10–25 DAS', desc: 'Germination & seedling establishment' },
  { id: 'VEGETATIVE', label: 'Vegetative', days: '25–50 DAS', desc: 'Tillering & leaf canopy expansion' },
  { id: 'FLOWERING', label: 'Flowering', days: '50–75 DAS', desc: 'Anthesis & peak water sensitivity' },
  { id: 'GRAIN_FORMATION', label: 'Grain Filling', days: '75–100 DAS', desc: 'Pod filling & seed dry matter accumulation' },
  { id: 'MATURITY', label: 'Maturity', days: '100–125 DAS', desc: 'Physiological ripening & harvest prep' },
];

export default function InSeasonYieldPage() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [growthStage, setGrowthStage] = useState('FLOWERING');
  const [sowingDate, setSowingDate] = useState('2025-06-25');
  const [irrigationStatus, setIrrigationStatus] = useState('OPTIMAL');
  const [fertilizerStatus, setFertilizerStatus] = useState('BALANCED');
  const [pestIntensity, setPestIntensity] = useState('NONE');

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [progressionData, setProgressionData] = useState([]);
  const [error, setError] = useState(null);

  // Load farms and crops
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
        console.error('Failed to load initial data:', err);
        setError('Failed to load farm or crop catalogues.');
      });
  }, []);

  // Load progression history when farm or crop changes
  useEffect(() => {
    if (!selectedFarmId || !selectedCropId) return;
    loadProgressionHistory(selectedFarmId, selectedCropId);
  }, [selectedFarmId, selectedCropId]);

  const loadProgressionHistory = (farmId, cropId) => {
    api.get(`/api/predictions/progression/?farm_id=${farmId}&crop_id=${cropId}`)
      .then((res) => {
        setProgressionData(res.data.chart_trajectory || []);
      })
      .catch((err) => console.error('Failed to load yield trajectory:', err));
  };

  const handleRunInSeasonPrediction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      farm_id: selectedFarmId,
      crop_id: selectedCropId,
      growth_stage: growthStage,
      sowing_date: sowingDate,
      irrigation_status: irrigationStatus,
      fertilizer_status: fertilizerStatus,
      pest_intensity: pestIntensity
    };

    try {
      const res = await api.post('/api/predictions/in-season/', payload);
      setPredictionResult(res.data);
      loadProgressionHistory(selectedFarmId, selectedCropId);
    } catch (err) {
      console.error('In-season prediction failed:', err);
      setError(err.response?.data?.error || 'Prediction calculation failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Dynamic In-Season Intelligence
            </span>
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Multi-Stage Data Assimilation
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#174C32] mt-1.5 flex items-center gap-2.5">
            <Sprout className="w-7 h-7 text-[#2E8B57]" />
            In-Season Dynamic Yield Prediction
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-stage yield revisions fusing pre-sowing baseline, Sentinel-2 canopy NDVI, and on-farm management
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Growth Stage Stepper Banner */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Select Crop Growth Phenological Stage
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {STAGES.map((s) => {
            const isSelected = growthStage === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setGrowthStage(s.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                    : 'bg-gray-50/60 border-gray-200/80 hover:bg-gray-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {s.days}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className={`text-xs font-extrabold mt-1 ${isSelected ? 'text-[#174C32]' : 'text-gray-800'}`}>
                  {s.label}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Input Form (Left 1 Col) & Prediction Results (Right 2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleRunInSeasonPrediction} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">Crop & Management Inputs</h3>
            <p className="text-xs text-gray-500">Provide current field conditions for revision</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Farm Parcel</label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600"
              required
            >
              {farms.length === 0 ? (
                <option value="">No farm parcels found (Please add a farm first)</option>
              ) : (
                farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.district}, {f.state}) - {f.area_hectares} ha
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Crop</label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600"
              required
            >
              {crops.length === 0 ? (
                <option value="">Loading crops...</option>
              ) : (
                crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.marathi_name ? `(${c.marathi_name})` : ''} - {c.category}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" /> Sowing Date
            </label>
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-500" /> Irrigation Status
            </label>
            <select
              value={irrigationStatus}
              onChange={(e) => setIrrigationStatus(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600"
            >
              <option value="OPTIMAL">Optimal (Scheduled Drip / Canal)</option>
              <option value="ADEQUATE">Adequate (Normal Soil Moisture)</option>
              <option value="DEFICIT">Deficit / Stressed (Dry Topsoil)</option>
              <option value="RAINFED">Purely Rainfed (Awaiting Monsoons)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" /> Fertilizer Application
            </label>
            <select
              value={fertilizerStatus}
              onChange={(e) => setFertilizerStatus(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600"
            >
              <option value="BALANCED">Balanced NPK (ICAR Recommended Dose)</option>
              <option value="PARTIAL">Partial / Split Dose Applied</option>
              <option value="ORGANIC">Organic Manure / FYM Enriched</option>
              <option value="SUB_OPTIMAL">Sub-optimal Dose</option>
              <option value="NIL">Nil (No Fertilizer Applied)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-amber-500" /> Pest / Biotic Pressure
            </label>
            <select
              value={pestIntensity}
              onChange={(e) => setPestIntensity(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600"
            >
              <option value="NONE">None (Clean Canopy)</option>
              <option value="MINOR">Minor Infestation (&lt; 5% leaves)</option>
              <option value="MODERATE">Moderate (5–15% damaged)</option>
              <option value="SEVERE">Severe (Major foliar damage)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#174C32] hover:bg-[#123825] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Assimilating Remote Sensing Data...</span>
              </>
            ) : (
              <>
                <span>Run In-Season Revision</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {predictionResult ? (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Revised Yield Card */}
                <div className="bg-emerald-900 text-white rounded-3xl p-5 shadow-2xs relative overflow-hidden">
                  <div className="text-xs font-mono text-emerald-300 uppercase tracking-wider mb-1">
                    Updated Expected Yield
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">
                      {predictionResult.revised_yield_kg_per_ha.toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-200">kg/ha</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      predictionResult.delta_yield_pct >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    }`}>
                      {predictionResult.delta_yield_pct >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
                      )}
                      {predictionResult.delta_yield_pct >= 0 ? `+${predictionResult.delta_yield_pct}%` : `${predictionResult.delta_yield_pct}%`} vs Pre-Sowing
                    </span>
                  </div>
                </div>

                {/* Total Production */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Estimated Production
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900">
                      {predictionResult.predicted_total_production_tonnes}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">Tonnes</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3">
                    Baseline pre-sowing estimate: <strong className="text-gray-800">{predictionResult.baseline_yield_kg_per_ha} kg/ha</strong>
                  </p>
                </div>

                {/* Prediction Interval & Confidence */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Confidence & Bounds
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#174C32]">
                      {predictionResult.confidence_score}%
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ±{predictionResult.prediction_interval.uncertainty_band_pct}% Band
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3 font-mono">
                    [{predictionResult.prediction_interval.min_yield_kg_ha.toLocaleString()} – {predictionResult.prediction_interval.max_yield_kg_ha.toLocaleString()}] kg/ha
                  </p>
                </div>
              </div>

              {/* Satellite Assimilation Snapshot Card */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <Satellite className="w-4 h-4 text-emerald-700" />
                    <span>Sentinel-2 Satellite Telemetry Assimilated</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {predictionResult.satellite_snapshot.mission}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Parcel NDVI</span>
                    <div className="text-lg font-black text-[#174C32] mt-0.5">
                      {predictionResult.satellite_snapshot.ndvi.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Stage Target</span>
                    <div className="text-lg font-black text-gray-700 mt-0.5">
                      {predictionResult.satellite_snapshot.expected_stage_ndvi.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Canopy EVI</span>
                    <div className="text-lg font-black text-blue-900 mt-0.5">
                      {predictionResult.satellite_snapshot.evi.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Vigour Anomaly</span>
                    <div className={`text-lg font-black mt-0.5 ${
                      predictionResult.satellite_snapshot.anomaly_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {predictionResult.satellite_snapshot.anomaly_pct >= 0 ? `+${predictionResult.satellite_snapshot.anomaly_pct}%` : `${predictionResult.satellite_snapshot.anomaly_pct}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory Factors & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Influencing Drivers */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Stage Yield Drivers
                  </h4>
                  <div className="space-y-2.5">
                    {predictionResult.influencing_factors.map((f, i) => (
                      <div key={i} className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-900">{f.factor}</span>
                          <span className={f.impact === 'POSITIVE' ? 'text-emerald-700' : f.impact === 'NEGATIVE' ? 'text-rose-700' : 'text-gray-600'}>
                            {f.contribution}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                          {f.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {predictionResult.growth_stage_label} Actions
                  </h4>
                  <div className="space-y-2.5">
                    {predictionResult.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="leading-snug">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-2xs">
              <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No In-Season Revision Run Yet</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Select your growth stage above and click "Run In-Season Revision" to dynamically update expected yield.
              </p>
            </div>
          )}

          {/* Historical Yield Progression Trajectory Chart */}
          {progressionData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Yield Forecast Progression Curve</h3>
                  <p className="text-xs text-gray-500">Historical forecast evolution from pre-sowing to current stage</p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {progressionData.length} Revisions Recorded
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(val) => [`${val} kg/ha`, 'Expected Yield']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="yield_kg_ha" name="Expected Yield (kg/ha)" stroke="#174C32" strokeWidth={3} dot={{ r: 5, fill: '#174C32' }} />
                    <Line type="monotone" dataKey="interval_max" name="Upper Bound (+Uncertainty)" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="interval_min" name="Lower Bound (-Uncertainty)" stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature D: In-Season PMFBY Actuarial Claim Estimator */}
      <PMFBYEstimator
        farmId={selectedFarmId}
        cropId={selectedCropId}
        predictedYieldKgHa={predictionResult ? predictionResult.updated_yield_kg_per_ha : null}
        cropName={crops.find((c) => String(c.id) === String(selectedCropId))?.name || 'Soybean'}
        farmName={farms.find((f) => String(f.id) === String(selectedFarmId))?.farm_name || 'My Farm'}
        areaHectares={parseFloat(farms.find((f) => String(f.id) === String(selectedFarmId))?.area_hectares) || 2.0}
        season="Kharif"
      />
    </div>
  );
}
