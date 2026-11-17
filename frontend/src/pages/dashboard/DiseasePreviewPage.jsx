import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanEye, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  Leaf, 
  FlaskConical, 
  HeartHandshake, 
  RefreshCw, 
  X,
  History,
  Info
} from 'lucide-react';
import api, { farmService, cropService } from '../../services/api';

export default function DiseasePreviewPage() {
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedCropName, setSelectedCropName] = useState('Soybean');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [consulting, setConsulting] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Load crops, farms, and past scans
  useEffect(() => {
    Promise.all([
      cropService.getCrops().catch(() => api.get('/api/crops/')),
      farmService.getFarms().catch(() => api.get('/api/farms/')),
      api.get('/api/disease/history/').catch(() => ({ data: { results: [] } }))
    ])
      .then(([cropsRes, farmsRes, histRes]) => {
        const cropList = cropsRes.data?.results || (Array.isArray(cropsRes.data) ? cropsRes.data : []);
        const farmList = farmsRes.data?.results || farmsRes.data || [];
        setCrops(cropList);
        setFarms(farmList);
        setHistory(histRes.data?.results || []);
        if (farmList.length > 0) setSelectedFarmId(farmList[0].id);
      })
      .catch((err) => console.error('Failed to load initial data:', err));
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }
    setError(null);
    setDiagnosis(null);
    setConsultSuccess(false);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDiagnosis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or capture a leaf photo first.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setConsultSuccess(false);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('crop_name', selectedCropName);
    if (selectedFarmId) formData.append('farm_id', selectedFarmId);

    try {
      const res = await api.post('/api/disease/predict/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDiagnosis(res.data);
      // Refresh scan history
      api.get('/api/disease/history/').then((h) => setHistory(h.data.results || []));
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setError(err.response?.data?.error || 'Leaf diagnosis failed. Please ensure the image is clear and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRequestConsultation = async () => {
    if (!diagnosis?.scan_id) return;
    setConsulting(true);
    try {
      await api.post(`/api/disease/consult/${diagnosis.scan_id}/`);
      setConsultSuccess(true);
      // Refresh scan history
      api.get('/api/disease/history/').then((h) => setHistory(h.data.results || []));
    } catch (err) {
      console.error('Failed to request consultation:', err);
    } finally {
      setConsulting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Computer Vision Diagnostic Engine
            </span>
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PlantVillage & PlantDoc Calibration
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#174C32] mt-1.5 flex items-center gap-2.5">
            <ScanEye className="w-7 h-7 text-[#2E8B57]" />
            Crop Disease Detection & Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-powered leaf pathogen diagnosis, foliar symptom analysis, and validated biological/chemical treatment advisories
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Upload & Controls (Left 1 Col) & Diagnostic Results (Right 2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">Upload Leaf Photograph</h3>
            <p className="text-xs text-gray-500">Capture close-up in natural daylight</p>
          </div>

          {/* Selectors */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Crop</label>
              <select
                value={selectedCropName}
                onChange={(e) => setSelectedCropName(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
              >
                {crops.length > 0 ? (
                  crops.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.category})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Soybean">Soybean</option>
                    <option value="Rice">Rice</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Maize">Maize</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Associate with Farm (Optional)</label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
              >
                <option value="">General Field Scan</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & Drop Upload Area */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-3xl p-6 text-center hover:border-emerald-500 transition-colors bg-gray-50/40">
            {previewUrl ? (
              <div className="relative space-y-2">
                <img
                  src={previewUrl}
                  alt="Selected Leaf Preview"
                  className="w-full h-52 object-cover rounded-2xl shadow-inner border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white p-1.5 rounded-full shadow-md transition-all cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-gray-500 font-medium truncate">
                  {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174C32] flex items-center justify-center mx-auto border border-emerald-100">
                  <Camera className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Click to upload or take a leaf photo</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Supports JPG, PNG, WEBP (Max 10MB)</p>
                </div>
                <label
                  htmlFor="leaf-upload-input"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Browse File</span>
                </label>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              id="leaf-upload-input"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Action button */}
          <button
            onClick={handleDiagnose}
            disabled={!selectedFile || analyzing}
            className="w-full py-3 rounded-xl bg-[#174C32] hover:bg-[#123825] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Foliar Pathogen...</span>
              </>
            ) : (
              <>
                <ScanEye className="w-4 h-4" />
                <span>Diagnose Disease Symptoms</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Results Card (Right 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {diagnosis ? (
            <>
              {/* Diagnostic Banner Card */}
              <div className={`rounded-3xl p-6 border shadow-2xs ${
                diagnosis.is_healthy 
                  ? 'bg-emerald-50/80 border-emerald-300' 
                  : 'bg-amber-50/70 border-amber-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        diagnosis.is_healthy
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {diagnosis.is_healthy ? 'Healthy Leaf' : `${diagnosis.pathogen_type} Pathogen`}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">Crop: {diagnosis.crop}</span>
                    </div>

                    <h2 className="text-xl font-black text-gray-900">
                      {diagnosis.predicted_disease}
                    </h2>
                    <p className="text-xs font-mono text-gray-500 italic mt-0.5">
                      {diagnosis.scientific_name}
                    </p>
                  </div>

                  {/* Confidence score badge */}
                  <div className="sm:text-right bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Diagnostic Confidence
                    </span>
                    <span className="text-2xl font-black text-[#174C32]">
                      {diagnosis.confidence_score}%
                    </span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          diagnosis.confidence_score >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${diagnosis.confidence_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Low confidence uncertainty warning */}
                {diagnosis.confidence_score < 70 && (
                  <div className="mt-4 p-3 bg-amber-100/70 border border-amber-300 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Confidence is below standard threshold (70%). Please consult an agronomist or submit a sharper photo.
                    </span>
                  </div>
                )}
              </div>

              {/* Symptoms & Causes Dual Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visible Symptoms */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>Visible Foliar Symptoms</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {diagnosis.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Underlying Causes */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Epidemiological Causes</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {diagnosis.causes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Treatment & Management Plan */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Validated Agronomic Treatment Measures</h3>
                    <p className="text-xs text-gray-500">ICAR & CIBRC compliant integrated disease management (IDM)</p>
                  </div>
                  <FlaskConical className="w-5 h-5 text-emerald-700" />
                </div>

                <div className="space-y-3">
                  {diagnosis.suggested_actions.map((act, i) => (
                    <div key={i} className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{act}</span>
                    </div>
                  ))}
                </div>

                {/* Safety Advisory Banner */}
                {diagnosis.safety_warning && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Safe Chemical Usage Advisory:</strong>
                      <span className="leading-relaxed">{diagnosis.safety_warning}</span>
                    </div>
                  </div>
                )}

                {/* Expert Consultation Request */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Uncertain about treatment or severe spread in your plot?
                  </div>
                  {consultSuccess ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Referred to KVK Agronomist Panel</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestConsultation}
                      disabled={consulting}
                      className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      {consulting ? 'Submitting...' : 'Request KVK Expert Review'}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-2xs">
              <ScanEye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">Awaiting Leaf Photograph</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Upload or capture an affected leaf photo on the left to receive immediate pathogen identification and treatment steps.
              </p>
            </div>
          )}

          {/* Historical Scan Log */}
          {history.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recent Leaf Diagnoses</h3>
                  <p className="text-xs text-gray-500">History of analyzed leaf photographs and verdicts</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <History className="w-4 h-4" />
                  <span>{history.length} Scans</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {history.slice(0, 5).map((scan) => (
                  <div key={scan.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        scan.is_healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <Leaf className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{scan.disease}</div>
                        <div className="text-[10px] text-gray-500">{scan.crop_name} • {scan.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        scan.is_healthy
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {scan.confidence}% Confidence
                      </span>
                      {scan.expert_consultation_requested && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          KVK Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
