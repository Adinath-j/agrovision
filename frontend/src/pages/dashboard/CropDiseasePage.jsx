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
  Info,
  Volume2,
  VolumeX,
  Printer,
  BookOpen,
  Sparkles,
  Layers,
  Search,
  FileText,
  Eye,
  SlidersHorizontal,
  CloudRain
} from 'lucide-react';
import api, { farmService, cropService, diseaseService } from '../../services/api';

export default function CropDiseasePage() {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'catalog'
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedCropName, setSelectedCropName] = useState('Soybean');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewMode, setViewMode] = useState('original'); // 'original' | 'overlay'
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [consulting, setConsulting] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Sample leaf images for instant 1-click testing
  const [samples, setSamples] = useState([]);

  // Camera Live Capture Modal
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Audio Voice Advisory
  const [speaking, setSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState('en'); // 'en' | 'hi' | 'mr'

  // Prescription Dossier Modal
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // Disease Catalog / Library
  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCropFilter, setCatalogCropFilter] = useState('All');

  const fileInputRef = useRef(null);

  // Load crops, farms, history, samples, and catalog
  useEffect(() => {
    Promise.all([
      cropService.getCrops().catch(() => api.get('/api/crops/')),
      farmService.getFarms().catch(() => api.get('/api/farms/')),
      diseaseService.getHistory().catch(() => ({ data: { results: [] } })),
      diseaseService.getSamples().catch(() => ({ data: { samples: [] } })),
      diseaseService.getCatalog().catch(() => ({ data: { catalog: [] } }))
    ])
      .then(([cropsRes, farmsRes, histRes, sampRes, catRes]) => {
        const cropList = cropsRes.data?.results || (Array.isArray(cropsRes.data) ? cropsRes.data : []);
        const farmList = farmsRes.data?.results || farmsRes.data || [];
        setCrops(cropList);
        setFarms(farmList);
        setHistory(histRes.data?.results || []);
        setSamples(sampRes.data?.samples || []);
        setCatalog(catRes.data?.catalog || []);
        if (farmList.length > 0) setSelectedFarmId(farmList[0].id);
      })
      .catch((err) => console.error('Failed to load initial disease data:', err));
  }, []);

  // Handle standard file selection
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
    setViewMode('original');
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDiagnosis(null);
    setError(null);
    setViewMode('original');
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopSpeech();
  };

  // Convert Base64 data URL to File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Load and diagnose a sample leaf in one click
  const handleSelectSample = async (sample) => {
    setSelectedCropName(sample.crop);
    setError(null);
    setConsultSuccess(false);
    setDiagnosis(null);
    stopSpeech();

    try {
      const file = dataURLtoFile(sample.image_data_uri, `${sample.id}.jpg`);
      setSelectedFile(file);
      setPreviewUrl(sample.image_data_uri);
      setViewMode('original');

      // Auto-diagnose the selected sample
      setAnalyzing(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('crop_name', sample.crop);
      if (selectedFarmId) formData.append('farm_id', selectedFarmId);

      const res = await diseaseService.predict(formData);
      setDiagnosis(res.data);
      if (res.data?.lesion_mask_overlay) {
        setViewMode('overlay');
      }
      diseaseService.getHistory().then((h) => setHistory(h.data.results || []));
    } catch (err) {
      console.error("Sample diagnosis error:", err);
      setError("Failed to run sample leaf diagnosis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Run full diagnosis on selected file
  const handleDiagnose = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError('Please select or capture a leaf photo first.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setConsultSuccess(false);
    stopSpeech();

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('crop_name', selectedCropName);
    if (selectedFarmId) formData.append('farm_id', selectedFarmId);

    try {
      const res = await diseaseService.predict(formData);
      setDiagnosis(res.data);
      if (res.data?.lesion_mask_overlay) {
        setViewMode('overlay');
      }
      // Refresh scan history
      diseaseService.getHistory().then((h) => setHistory(h.data.results || []));
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setError(err.response?.data?.error || 'Leaf diagnosis failed. Please ensure the image is clear and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Load a historical scan in the viewer
  const handleSelectHistoryScan = async (scanId) => {
    try {
      setAnalyzing(true);
      setError(null);
      stopSpeech();
      const res = await diseaseService.getDetail(scanId);
      setDiagnosis(res.data);
      setSelectedCropName(res.data.crop || 'Soybean');
      if (res.data.image_url) {
        setPreviewUrl(res.data.image_url);
      }
      setViewMode('original');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to load history scan details:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Request Krishi Vigyan Kendra agronomist consultation
  const handleRequestConsultation = async () => {
    if (!diagnosis?.scan_id) return;
    setConsulting(true);
    try {
      await diseaseService.requestConsultation(diagnosis.scan_id);
      setConsultSuccess(true);
      diseaseService.getHistory().then((h) => setHistory(h.data.results || []));
    } catch (err) {
      console.error('Failed to request consultation:', err);
    } finally {
      setConsulting(false);
    }
  };

  // Open official Prescription Dossier Modal
  const handleOpenPrescription = async () => {
    if (!diagnosis?.scan_id) return;
    setPrescriptionLoading(true);
    setShowPrescription(true);
    try {
      const res = await diseaseService.getPrescription(diagnosis.scan_id);
      setPrescriptionData(res.data);
    } catch (err) {
      console.error('Failed to load prescription dossier:', err);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // Camera Capture Helpers
  const startCamera = async () => {
    setShowCamera(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access was denied or not available. Please allow camera permissions or browse an image file.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `live_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // Audio Text-to-Speech Voice Advisory
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window) || !diagnosis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    let textToSpeak = '';
    let voiceLang = 'en-US';

    if (speechLang === 'hi') {
      voiceLang = 'hi-IN';
      textToSpeak = `फसल रोग निदान रिपोर्ट। पहचानी गई बीमारी: ${diagnosis.predicted_disease}। विश्वास स्कोर: ${diagnosis.confidence_score} प्रतिशत। गंभीरता स्तर: ${diagnosis.severity_level || 'मध्यम'}। मुख्य जैविक उपाय: ${diagnosis.suggested_actions?.[0] || 'जैव कवकनाशी का प्रयोग करें'}। रासायनिक उपाय: ${diagnosis.suggested_actions?.[1] || 'कृषि विज्ञान केंद्र के विशेषज्ञ से परामर्श लें'}। सुरक्षा चेतावनी: ${diagnosis.safety_warning || 'छिड़काव के समय सुरक्षा गियर पहनें'}।`;
    } else if (speechLang === 'mr') {
      voiceLang = 'mr-IN';
      textToSpeak = `पिक रोग निदान अहवाल। रोगाचे नाव: ${diagnosis.predicted_disease}। अचूकता: ${diagnosis.confidence_score} टक्के। प्रादुर्भाव तीव्रता: ${diagnosis.severity_level || 'मध्यम'}। सेंद्रिय उपाय: ${diagnosis.suggested_actions?.[0] || 'ट्रायकोडर्मा फवारणी करा'}। रासायनिक उपाय: ${diagnosis.suggested_actions?.[1] || 'तज्ज्ञांचा सल्ला घ्या'}।`;
    } else {
      voiceLang = 'en-IN';
      textToSpeak = `Crop Disease Diagnostic Advisory. Diagnosed Pathogen: ${diagnosis.predicted_disease}. Confidence Score: ${diagnosis.confidence_score} percent. Infection Severity: ${diagnosis.severity_level || 'Moderate'}. Immediate Organic Action: ${diagnosis.suggested_actions?.[0] || 'Apply biological fungicide'}. Targeted Chemical Option: ${diagnosis.suggested_actions?.[1] || 'Consult local Krishi Vigyan Kendra'}. Safety Warning: ${diagnosis.safety_warning || 'Wear protective gear'}.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  // Filter Catalog
  const filteredCatalog = catalog.filter((item) => {
    const matchesCrop = catalogCropFilter === 'All' || item.crop.toLowerCase() === catalogCropFilter.toLowerCase();
    const matchesSearch = !catalogSearch || 
      item.disease_name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.scientific_name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.crop.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (item.symptoms_summary && item.symptoms_summary.some(s => s.toLowerCase().includes(catalogSearch.toLowerCase())));
    return matchesCrop && matchesSearch;
  });

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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PlantVillage & ICAR Calibrated
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#174C32] mt-1.5 flex items-center gap-2.5">
            <ScanEye className="w-7 h-7 text-[#2E8B57]" />
            Crop Disease Detection & Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-powered foliar pathogen diagnosis, lesion severity quantification, multi-spectral segmentation, and validated biological/chemical treatment advisories
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('scanner'); stopSpeech(); }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'scanner' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ScanEye className="w-4 h-4" />
            <span>Foliar Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('catalog'); stopSpeech(); }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'catalog' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Disease Library ({catalog.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: SCANNER VIEW */}
      {/* ============================================================== */}
      {activeTab === 'scanner' && (
        <>
          {/* Quick Demo Sample Leaves Strip */}
          {samples.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-green-50/70 rounded-3xl p-4 border border-emerald-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>One-Click Test Samples (Click any sample to evaluate the AI diagnostic engine instantly):</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                  Ground Truth Calibrated
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-gray-800 border border-emerald-100 hover:border-emerald-300 text-xs font-semibold shrink-0 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    title={s.description}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>{s.title}</span>
                    <span className="text-[10px] text-gray-400 font-normal">({s.crop})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Upload & Controls Card (Left 1 Col) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Upload Leaf Photograph</h3>
                  <p className="text-xs text-gray-500">Capture close-up in natural daylight</p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                  title="Capture live with device camera"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Live Camera</span>
                </button>
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
                        <option value="Soybean">Soybean (सोयाबीन)</option>
                        <option value="Rice">Rice (धान / चावल)</option>
                        <option value="Wheat">Wheat (गेहूं)</option>
                        <option value="Cotton">Cotton (कपास)</option>
                        <option value="Maize">Maize (मक्का)</option>
                        <option value="Sugarcane">Sugarcane (गन्ना)</option>
                        <option value="Groundnut">Groundnut (मूंगफली)</option>
                        <option value="Tomato">Tomato (टमाटर)</option>
                        <option value="Potato">Potato (आलू)</option>
                        <option value="Onion">Onion (प्याज)</option>
                        <option value="Gram">Gram / Chickpea (चना)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Associate with Farm Parcel (Optional)</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="">General Field Plot Scan</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.farm_name} ({f.district}, {f.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag & Drop Upload Area */}
              <div className="relative border-2 border-dashed border-gray-300 rounded-3xl p-5 text-center hover:border-emerald-500 transition-colors bg-gray-50/40">
                {previewUrl ? (
                  <div className="relative space-y-2">
                    {/* View mode toggle: Original vs Lesion Heatmap */}
                    {diagnosis?.lesion_mask_overlay && (
                      <div className="flex items-center justify-center gap-1 mb-2 bg-white/90 backdrop-blur p-1 rounded-xl border border-gray-200 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setViewMode('original')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            viewMode === 'original' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Original Leaf
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('overlay')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            viewMode === 'overlay' ? 'bg-amber-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>AI Lesion Heatmap</span>
                        </button>
                      </div>
                    )}

                    <div className="relative overflow-hidden rounded-2xl shadow-inner border border-gray-200">
                      <img
                        src={viewMode === 'overlay' && diagnosis?.lesion_mask_overlay ? diagnosis.lesion_mask_overlay : previewUrl}
                        alt="Leaf Preview"
                        className="w-full h-52 object-cover transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white p-1.5 rounded-full shadow-md transition-all cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500 font-medium truncate">
                      {selectedFile?.name || 'Leaf Image'} {selectedFile?.size ? `(${(selectedFile.size / 1024).toFixed(1)} KB)` : ''}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174C32] flex items-center justify-center mx-auto border border-emerald-100">
                      <Camera className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Click to upload or capture a leaf photo</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Supports JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <label
                        htmlFor="leaf-upload-input"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Browse File</span>
                      </label>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Take Photo</span>
                      </button>
                    </div>
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
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                            diagnosis.is_healthy
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {diagnosis.is_healthy ? 'Healthy Leaf' : `${diagnosis.pathogen_type} Pathogen`}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">Crop: {diagnosis.crop}</span>
                          {diagnosis.farm_name && (
                            <span className="text-xs text-emerald-800 font-semibold">• {diagnosis.farm_name}</span>
                          )}
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                          {diagnosis.predicted_disease}
                        </h2>
                        <p className="text-xs font-mono text-gray-500 italic">
                          {diagnosis.scientific_name}
                        </p>
                      </div>

                      {/* Diagnostic Confidence & Severity Meters */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Diagnostic Confidence
                          </span>
                          <span className="text-2xl font-black text-[#174C32]">
                            {diagnosis.confidence_score}%
                          </span>
                          <div className="w-28 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                diagnosis.confidence_score >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${diagnosis.confidence_score}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Severity Stage */}
                        {diagnosis.severity_level && (
                          <div className="text-right border-t sm:border-t-0 sm:pt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Infection Severity
                            </span>
                            <span className={`text-xs font-extrabold ${
                              diagnosis.is_healthy ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {diagnosis.severity_level}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Urgency & Weather Risk Strip */}
                    <div className="mt-4 pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      {diagnosis.urgency && (
                        <div className="flex items-center gap-1.5 font-bold text-gray-800">
                          <SlidersHorizontal className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Action Urgency: <span className="text-amber-900 font-extrabold">{diagnosis.urgency}</span></span>
                        </div>
                      )}

                      {/* Voice Audio Listen & Prescription Buttons */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-gray-200 shadow-2xs">
                          <select
                            value={speechLang}
                            onChange={(e) => { setSpeechLang(e.target.value); stopSpeech(); }}
                            className="text-[11px] font-bold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                          >
                            <option value="en">English</option>
                            <option value="hi">हिंदी (Hindi)</option>
                            <option value="mr">मराठी (Marathi)</option>
                          </select>
                          <button
                            type="button"
                            onClick={toggleSpeech}
                            className="p-1 rounded-lg hover:bg-gray-100 text-emerald-800 transition-colors cursor-pointer"
                            title="Listen to treatment advisory"
                          >
                            {speaking ? <VolumeX className="w-4 h-4 text-rose-600 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenPrescription}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-bold text-xs shadow-2xs cursor-pointer transition-all"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Prescription</span>
                        </button>
                      </div>
                    </div>

                    {/* Weather Correlation Risk Banner */}
                    {diagnosis.weather_risk && (
                      <div className="mt-3 p-3 bg-white/90 rounded-2xl border border-amber-200/90 flex items-start gap-2.5 text-xs">
                        <CloudRain className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-blue-900 block">{diagnosis.weather_risk.level}</strong>
                          <span className="text-gray-700 leading-relaxed">{diagnosis.weather_risk.factor}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Symptoms & Causes Dual Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Visible Foliar Symptoms */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
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
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
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

                    {/* Krishi Vigyan Kendra Consultation Request */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Uncertain about chemical spray mixing or experiencing rapid spread across your plot?
                      </div>
                      {consultSuccess || diagnosis.expert_consultation_requested ? (
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
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-2xs space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                    <ScanEye className="w-8 h-8 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Awaiting Leaf Photograph</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Upload or capture a leaf photo on the left, or click any of the one-click test samples above to receive immediate AI diagnosis and ICAR-approved treatment measures.
                    </p>
                  </div>
                </div>
              )}

              {/* Historical Scan Log */}
              {history.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Recent Leaf Diagnoses</h3>
                      <p className="text-xs text-gray-500">Click any historical scan to inspect its diagnosis breakdown</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                      <History className="w-4 h-4" />
                      <span>{history.length} Scans</span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {history.slice(0, 5).map((scan) => (
                      <div
                        key={scan.id}
                        onClick={() => handleSelectHistoryScan(scan.id)}
                        className="py-3 flex items-center justify-between gap-4 hover:bg-gray-50/80 p-2 rounded-xl transition-colors cursor-pointer"
                        title="Click to view full diagnosis details"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            scan.is_healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            <Leaf className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 hover:text-emerald-800">
                              {scan.disease}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {scan.crop_name} • {scan.date} {scan.farm_name ? `• ${scan.farm_name}` : ''}
                            </div>
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
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DISEASE LIBRARY & REFERENCE CATALOG */}
      {/* ============================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Crop Disease Reference Library</h3>
                <p className="text-xs text-gray-500">ICAR compliant pathology dictionary, foliar symptom guides, and organic/chemical remedies</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search disease, pathogen, or symptoms..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Crop Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {['All', 'Soybean', 'Rice', 'Wheat', 'Cotton', 'Maize', 'Sugarcane', 'Groundnut', 'Tomato', 'Potato', 'Onion', 'Gram'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatalogCropFilter(c)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    catalogCropFilter === c
                      ? 'bg-[#174C32] text-white shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCatalog.map((item) => (
              <div
                key={item.key}
                className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.crop}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.is_healthy ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {item.pathogen_type}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                      {item.disease_name}
                    </h4>
                    <p className="text-[11px] font-mono italic text-gray-400 mt-0.5">
                      {item.scientific_name}
                    </p>
                  </div>

                  {/* Symptoms Summary */}
                  {item.symptoms_summary && item.symptoms_summary.length > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-1">
                      <strong className="text-[10px] uppercase font-bold text-gray-500 block">Diagnostic Signs:</strong>
                      <p className="line-clamp-2 leading-relaxed">{item.symptoms_summary[0]}</p>
                    </div>
                  )}

                  {/* Organic & Chemical Treatments */}
                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="text-emerald-950 font-medium flex items-start gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2"><strong>Organic:</strong> {item.primary_organic_cure}</span>
                    </div>
                    {!item.is_healthy && (
                      <div className="text-gray-800 font-medium flex items-start gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2"><strong>Chemical:</strong> {item.primary_chemical_cure}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-600">Preventive Rule:</span> {item.preventive_tip}
                </div>
              </div>
            ))}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-2xs">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-800">No matching diseases found</h4>
              <p className="text-xs text-gray-500 mt-1">Try clearing your search query or selecting "All" crops.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* CAMERA MODAL */}
      {/* ============================================================== */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900">Live Foliar Camera Scanner</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Close Camera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Targeting reticle */}
                  <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] font-bold text-emerald-300 bg-black/50 px-2 py-0.5 rounded-md">
                      Align Affected Leaf Inside Frame
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-3 rounded-2xl bg-[#174C32] hover:bg-[#123825] text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture & Diagnose Leaf</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OFFICIAL PRESCRIPTION DOSSIER MODAL */}
      {/* ============================================================== */}
      {showPrescription && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Agronomic Prescription Dossier</h3>
                  <p className="text-[11px] text-gray-500">Reference: {prescriptionData?.prescription_id || 'AGRO-RX-2026'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Print Rx</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrescription(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {prescriptionLoading ? (
              <div className="py-12 text-center text-xs text-gray-500">
                Generating certified agronomic prescription...
              </div>
            ) : prescriptionData ? (
              <div className="space-y-5 text-xs text-gray-800">
                {/* Farmer & Plot Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Farmer Name</span>
                    <span className="font-bold text-gray-900">{prescriptionData.farmer_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Farm Parcel</span>
                    <span className="font-bold text-gray-900">{prescriptionData.farm_parcel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Target Crop</span>
                    <span className="font-bold text-gray-900">{prescriptionData.crop}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Date of Scan</span>
                    <span className="font-bold text-gray-900">{prescriptionData.date_issued}</span>
                  </div>
                </div>

                {/* Pathogen & Severity Summary */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
                      Diagnosed Condition: {prescriptionData.pathogen_type}
                    </span>
                    <span className="font-bold text-emerald-800">{prescriptionData.confidence_level} Confidence</span>
                  </div>
                  <h4 className="text-base font-black text-gray-900">{prescriptionData.diagnosed_disease}</h4>
                  <p className="text-[11px] font-mono italic text-gray-500">{prescriptionData.scientific_classification}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-gray-700 border-t border-amber-200/60">
                    <span>Severity: {prescriptionData.infection_severity}</span>
                    <span>Lesion Cover: {prescriptionData.lesion_coverage}</span>
                  </div>
                </div>

                {/* Prescribed Remedies */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                    Prescribed Treatment Protocol
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <strong className="block text-emerald-950 font-bold mb-0.5">1. Biological / Organic Measure:</strong>
                      <span className="text-emerald-900">{prescriptionData.prescribed_treatment_plan.immediate_organic_remedy}</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <strong className="block text-blue-950 font-bold mb-0.5">2. Targeted Chemical Management:</strong>
                      <span className="text-blue-900">{prescriptionData.prescribed_treatment_plan.targeted_chemical_option}</span>
                    </div>
                  </div>
                </div>

                {/* Safety & Spray Rules */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <strong className="text-[10px] font-bold uppercase text-gray-600 block">CIBRC Chemical Safety Warning:</strong>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{prescriptionData.chemical_safety_advisory}</p>
                </div>

                {/* Footer validation */}
                <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-gray-400">
                  <span>{prescriptionData.issuing_authority}</span>
                  <span>{prescriptionData.accreditation}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
