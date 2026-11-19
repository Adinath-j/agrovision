import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  Sprout,
  ScanLine,
  UploadCloud,
  Sparkles,
  Layers,
  FileText,
  Loader2,
  Info
} from 'lucide-react';
import { farmService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getDistrictCoords } from '../../utils/districtCoords';
import FarmMap from '../../components/common/FarmMap';

export default function AddFarmPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const defaultDist = user?.district || 'Nashik';
  const defaultState = user?.state || 'Maharashtra';
  const initialCoords = getDistrictCoords(defaultDist, defaultState);

  const [formData, setFormData] = useState({
    farm_name: '',
    state: defaultState,
    district: defaultDist,
    sub_district: '',
    village: '',
    survey_khasra_number: '',
    area_hectares: '',
    latitude: initialCoords.lat,
    longitude: initialCoords.lng,
    soil_type: 'BLACK',
    soil_ph: '',
    nitrogen_n: '',
    phosphorus_p: '',
    potassium_k: '',
    organic_carbon_pct: '',
    irrigation_source: 'BOREWELL',
    irrigation_method: 'DRIP',
    has_water_storage: false,
    previous_crop: ''
  });

  // Feature: Land unit selection (Hectares | Acres | Guntha)
  const [areaUnit, setAreaUnit] = useState('acres'); // 'acres' | 'hectares' | 'guntha'
  const [areaValue, setAreaValue] = useState(''); // Starts empty to force genuine farmer input
  const [areaCalculatedFromMap, setAreaCalculatedFromMap] = useState(false);
  const areaUnitRef = useRef(areaUnit);
  useEffect(() => {
    areaUnitRef.current = areaUnit;
  }, [areaUnit]);

  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');
  const [ocrErrorMsg, setOcrErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync initial user district only once on initial mount without overwriting user input
  const hasInitializedDistRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedDistRef.current && user) {
      hasInitializedDistRef.current = true;
      if (user.district && !formData.farm_name) {
        const c = getDistrictCoords(user.district, user.state || 'Maharashtra');
        setFormData((prev) => ({
          ...prev,
          district: prev.district || user.district,
          state: prev.state || user.state || 'Maharashtra',
          latitude: prev.latitude || c.lat,
          longitude: prev.longitude || c.lng
        }));
      }
    }
  }, [user]);

  const handleDistrictChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, district: val };
      if (val && val.trim().length >= 3) {
        const c = getDistrictCoords(val, prev.state);
        // Only update centroid if boundary hasn't been drawn yet
        if (c && !boundaryGeojson) {
          updated.latitude = c.lat;
          updated.longitude = c.lng;
        }
      }
      return updated;
    });
  };

  const handleStateChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, state: val };
      const c = getDistrictCoords(prev.district, val);
      if (c && !boundaryGeojson) {
        updated.latitude = c.lat;
        updated.longitude = c.lng;
      }
      return updated;
    });
  };

  const states = [
    'Maharashtra',
    'Madhya Pradesh',
    'Karnataka',
    'Gujarat',
    'Punjab',
    'Uttar Pradesh'
  ];

  const soilTypes = [
    { value: 'BLACK', label: 'Black Cotton / Regur Soil (काली मिट्टी)' },
    { value: 'ALLUVIAL', label: 'Alluvial Soil (जलोढ़ मिट्टी)' },
    { value: 'RED', label: 'Red & Yellow Soil (लाल मिट्टी)' },
    { value: 'LATERITE', label: 'Laterite Soil (लैटेराइट मिट्टी)' },
    { value: 'LOAMY', label: 'Loamy Soil (दोमट मिट्टी)' },
    { value: 'CLAYEY', label: 'Clayey Soil (चिकनी मिट्टी)' },
    { value: 'SANDY_LOAM', label: 'Sandy Loam (बलुई दोमट)' },
    { value: 'DESERT', label: 'Desert / Arid Soil (बलुई मिट्टी)' },
    { value: 'UNKNOWN', label: 'Unknown / Not Tested (अज्ञात)' },
  ];

  const irrigationSources = [
    { value: 'BOREWELL', label: 'Borewell / Tube Well' },
    { value: 'CANAL', label: 'Government Canal' },
    { value: 'OPEN_WELL', label: 'Open Well' },
    { value: 'RIVER', label: 'River / Stream Lift' },
    { value: 'FARM_POND', label: 'Farm Pond / Tank' },
    { value: 'RAINFED', label: 'Purely Rainfed' },
    { value: 'OTHER', label: 'Other Source' },
  ];

  const irrigationMethods = [
    { value: 'DRIP', label: 'Drip Irrigation (Micro-irrigation)' },
    { value: 'SPRINKLER', label: 'Sprinkler System' },
    { value: 'FLOOD', label: 'Flood / Furrow Irrigation' },
    { value: 'RAINFED', label: 'Rainfed (None)' },
    { value: 'MANUAL', label: 'Manual / Bucket' },
  ];

  const handleAutofillCoords = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(6)),
            longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          }));
        },
        () => {
          // Fallback to district centroid
          const c = getDistrictCoords(formData.district, formData.state);
          setFormData((prev) => ({
            ...prev,
            latitude: c.lat,
            longitude: c.lng,
          }));
        }
      );
    } else {
      const c = getDistrictCoords(formData.district, formData.state);
      setFormData((prev) => ({
        ...prev,
        latitude: c.lat,
        longitude: c.lng,
      }));
    }
  };

  const handleSoilCardUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrScanning(true);
    setOcrSuccessMsg('');
    setOcrErrorMsg('');

    const bodyFormData = new FormData();
    bodyFormData.append('card_image', file);

    try {
      const res = await farmService.scanSoilCard(bodyFormData);
      const data = res.data;

      if (data && data.extracted_data) {
        const ext = data.extracted_data;
        const populatedItems = [];
        setFormData((prev) => {
          const updated = { ...prev };
          if (ext.soil_ph !== null && ext.soil_ph !== undefined) {
            updated.soil_ph = ext.soil_ph;
            populatedItems.push(`pH ${ext.soil_ph}`);
          }
          if (ext.nitrogen_n !== null && ext.nitrogen_n !== undefined) {
            updated.nitrogen_n = ext.nitrogen_n;
            populatedItems.push(`N: ${ext.nitrogen_n}`);
          }
          if (ext.phosphorus_p !== null && ext.phosphorus_p !== undefined) {
            updated.phosphorus_p = ext.phosphorus_p;
            populatedItems.push(`P: ${ext.phosphorus_p}`);
          }
          if (ext.potassium_k !== null && ext.potassium_k !== undefined) {
            updated.potassium_k = ext.potassium_k;
            populatedItems.push(`K: ${ext.potassium_k}`);
          }
          if (ext.organic_carbon_pct !== null && ext.organic_carbon_pct !== undefined) {
            updated.organic_carbon_pct = ext.organic_carbon_pct;
            populatedItems.push(`OC: ${ext.organic_carbon_pct}%`);
          }
          if (ext.soil_type) updated.soil_type = ext.soil_type;
          if (ext.survey_khasra_number) updated.survey_khasra_number = ext.survey_khasra_number;
          return updated;
        });

        if (populatedItems.length > 0) {
          setOcrSuccessMsg(
            `✓ Soil Health Card processed: Auto-populated ${populatedItems.join(', ')} kg/ha`
          );
        } else {
          setOcrErrorMsg('Could not detect clear text on the card. Please verify manual values.');
        }
      } else {
        setOcrErrorMsg('Could not detect clear text on the card. Please verify manual values.');
      }
    } catch (err) {
      setOcrErrorMsg(
        err.response?.data?.error || 'Failed to read Soil Card image. Please check values manually.'
      );
    } finally {
      setOcrScanning(false);
      // Reset input value so re-upload works
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Ensure areaValue is valid
    const rawArea = parseFloat(areaValue);
    if (isNaN(rawArea) || rawArea <= 0) {
      setError(`Please enter a valid parcel area in ${areaUnit} (e.g. 3.5).`);
      return;
    }

    setSubmitting(true);

    try {
      let finalHa = rawArea;
      if (areaUnit === 'acres') finalHa = rawArea / 2.47105;
      else if (areaUnit === 'guntha') finalHa = rawArea / 100.0;
      if (areaCalculatedFromMap && formData.area_hectares) {
        finalHa = parseFloat(formData.area_hectares);
      }
      finalHa = Math.max(0.01, parseFloat(Number(finalHa).toFixed(2)));

      const payload = {
        farm_name: formData.farm_name.trim(),
        state: formData.state.trim(),
        district: formData.district.trim(),
        sub_district: formData.sub_district ? formData.sub_district.trim() : '',
        village: formData.village ? formData.village.trim() : '',
        survey_khasra_number: formData.survey_khasra_number ? formData.survey_khasra_number.trim() : '',
        area_hectares: finalHa,
        latitude: formData.latitude !== '' && formData.latitude !== null && !isNaN(Number(formData.latitude))
          ? parseFloat(Number(formData.latitude).toFixed(6))
          : null,
        longitude: formData.longitude !== '' && formData.longitude !== null && !isNaN(Number(formData.longitude))
          ? parseFloat(Number(formData.longitude).toFixed(6))
          : null,
        soil_type: formData.soil_type || 'BLACK',
        soil_ph: formData.soil_ph !== '' && formData.soil_ph !== null && !isNaN(Number(formData.soil_ph))
          ? parseFloat(Number(formData.soil_ph).toFixed(2))
          : null,
        nitrogen_n: formData.nitrogen_n !== '' && formData.nitrogen_n !== null && !isNaN(Number(formData.nitrogen_n))
          ? parseFloat(Number(formData.nitrogen_n).toFixed(2))
          : null,
        phosphorus_p: formData.phosphorus_p !== '' && formData.phosphorus_p !== null && !isNaN(Number(formData.phosphorus_p))
          ? parseFloat(Number(formData.phosphorus_p).toFixed(2))
          : null,
        potassium_k: formData.potassium_k !== '' && formData.potassium_k !== null && !isNaN(Number(formData.potassium_k))
          ? parseFloat(Number(formData.potassium_k).toFixed(2))
          : null,
        organic_carbon_pct: formData.organic_carbon_pct !== '' && formData.organic_carbon_pct !== null && !isNaN(Number(formData.organic_carbon_pct))
          ? parseFloat(Number(formData.organic_carbon_pct).toFixed(2))
          : null,
        irrigation_source: formData.irrigation_source || 'BOREWELL',
        irrigation_method: formData.irrigation_method || 'DRIP',
        has_water_storage: Boolean(formData.has_water_storage),
        previous_crop: formData.previous_crop ? formData.previous_crop.trim() : '',
        boundary_geojson: boundaryGeojson,
      };

      await farmService.createFarm(payload);
      setSuccess('Farm parcel and satellite boundary registered successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard/farms');
      }, 1000);
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ')
        : 'Failed to create farm.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBoundaryChange = (geojson, calculatedHa) => {
    setBoundaryGeojson(geojson);
    if (calculatedHa && calculatedHa > 0) {
      const activeUnit = areaUnitRef.current || 'acres';
      let val = calculatedHa;
      if (activeUnit === 'acres') {
        val = calculatedHa * 2.47105;
      } else if (activeUnit === 'guntha') {
        val = calculatedHa * 100.0;
      }
      const formatted = activeUnit === 'guntha'
        ? parseFloat(val.toFixed(1)).toString()
        : parseFloat(val.toFixed(2)).toString();
      setAreaValue(formatted);
      setFormData((prev) => ({
        ...prev,
        area_hectares: parseFloat(calculatedHa.toFixed(4))
      }));
      setAreaCalculatedFromMap(true);
    } else if (!geojson) {
      setAreaCalculatedFromMap(false);
    }
  };

  const handleAreaChange = (val, unit = areaUnit) => {
    setAreaValue(val);
    setAreaCalculatedFromMap(false); // Farmer manually entered/adjusted
    const num = parseFloat(val) || 0;
    let ha = num;
    if (unit === 'acres') {
      ha = num / 2.47105;
    } else if (unit === 'guntha') {
      ha = num / 100.0;
    }
    setFormData((prev) => ({
      ...prev,
      area_hectares: ha > 0 ? parseFloat(ha.toFixed(4)) : ''
    }));
  };

  const handleUnitSwitch = (newUnit) => {
    if (newUnit === areaUnit) return;
    const num = parseFloat(areaValue) || 0;
    let currentHa = num;
    if (areaUnit === 'acres') currentHa = num / 2.47105;
    else if (areaUnit === 'guntha') currentHa = num / 100.0;

    let newVal = currentHa;
    if (newUnit === 'acres') newVal = currentHa * 2.47105;
    else if (newUnit === 'guntha') newVal = currentHa * 100.0;

    setAreaUnit(newUnit);
    setAreaValue(
      newVal > 0
        ? (newUnit === 'guntha'
            ? parseFloat(newVal.toFixed(1)).toString()
            : parseFloat(newVal.toFixed(2)).toString())
        : ''
    );
    setFormData((prev) => ({
      ...prev,
      area_hectares: currentHa > 0 ? parseFloat(currentHa.toFixed(4)) : ''
    }));
  };

  const currentHa = parseFloat(formData.area_hectares) || 0;
  const currentAcres = (currentHa * 2.47105).toFixed(2);
  const currentGuntha = (currentHa * 100).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Bar with Back Link */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/farms"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#174C32]">Register New Farm Plot</h1>
          <p className="text-xs text-gray-500">
            Define parcel location, interactive GIS boundary polygon, soil parameters & irrigation
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-8">
        
        {/* Section 1: Basic Identifiers */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#174C32] text-white inline-flex items-center justify-center text-[10px]">1</span>
            Parcel Identification & Location
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Farm / Plot Name *
            </label>
            <input
              type="text"
              required
              value={formData.farm_name}
              onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              placeholder="e.g. North Ridge Plot, Shinde Farm, Kolhapur Cane Parcel"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
              <select
                value={formData.state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              >
                {states.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">District *</label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. Kolhapur, Pune, Nashik, Surat"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Taluka / Block</label>
              <input
                type="text"
                value={formData.sub_district}
                onChange={(e) => setFormData({ ...formData, sub_district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. Dindori"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Village</label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. Janori"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Survey / Gat / Khasra No.</label>
              <input
                type="text"
                value={formData.survey_khasra_number}
                onChange={(e) => setFormData({ ...formData, survey_khasra_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. 114/2A"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Area & Interactive GIS Boundary Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#174C32] text-white inline-flex items-center justify-center text-[10px]">2</span>
              Land Parcel Area & Interactive GIS Satellite Map
            </h3>
            <button
              type="button"
              onClick={handleAutofillCoords}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Detect Centroid GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <span>Parcel Area *</span>
                  {areaCalculatedFromMap && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Map Derived
                    </span>
                  )}
                </label>
                {/* Unit Switcher */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleUnitSwitch('acres')}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      areaUnit === 'acres' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Acres
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSwitch('hectares')}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      areaUnit === 'hectares' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Ha
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSwitch('guntha')}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      areaUnit === 'guntha' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
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
                  value={areaValue}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32] pr-14 ${
                    areaCalculatedFromMap
                      ? 'border-emerald-400 bg-emerald-50/20 font-semibold text-emerald-950'
                      : 'border-gray-300'
                  }`}
                  placeholder={`Enter area (e.g. ${areaUnit === 'acres' ? '3.5' : areaUnit === 'guntha' ? '120' : '1.5'})`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold uppercase pointer-events-none">
                  {areaUnit === 'acres' ? 'Ac' : areaUnit === 'guntha' ? 'Guntha' : 'Ha'}
                </span>
              </div>

              <div className="text-[11px] text-gray-500 mt-1 block">
                ≈ <span className="font-semibold text-gray-700">{currentAcres} Ac</span> &bull; <span className="font-semibold text-gray-700">{currentHa} Ha</span> &bull; <span className="font-semibold text-gray-700">{currentGuntha} Guntha</span>
              </div>
              {areaCalculatedFromMap && (
                <div className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <span>📐 Automatically calculated from GIS satellite map boundary</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Centroid Latitude (°N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="20.1983"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Centroid Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="73.8821"
              />
            </div>
          </div>

          {/* Feature A: Interactive GIS Farm Map */}
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                GIS Satellite Boundary Tracing (ESRI World Imagery & OSM)
              </span>
              <span className="text-[11px] text-gray-500">
                Click map to draw plot perimeter vertices or drag the marker
              </span>
            </div>
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <FarmMap
                latitude={formData.latitude || 20.1983}
                longitude={formData.longitude || 73.8821}
                boundaryGeojson={boundaryGeojson}
                isEditable={true}
                height="380px"
                onLocationChange={(lat, lng) => {
                  setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                }}
                onBoundaryChange={handleBoundaryChange}
              />
            </div>
            {boundaryGeojson && (
              <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Parcel boundary polygon captured ({boundaryGeojson.coordinates?.[0]?.length || 0} vertices). Calculated Area: <strong>{currentAcres} Acres</strong> ({currentHa} Ha / {currentGuntha} Guntha).
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md shrink-0">
                  Auto-Populated in Form
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Soil Characteristics & OCR Auto-Scanner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#174C32] text-white inline-flex items-center justify-center text-[10px]">3</span>
              Soil Profile & Soil Health Card Auto-Scanner
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Allows Unknown Values
            </span>
          </div>

          {/* Feature C: Soil Health Card OCR Auto-Scanner Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border border-emerald-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#174C32] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#174C32] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Government Soil Health Card (SHC) Auto-Scanner
                  </h4>
                  <p className="text-[11px] text-gray-600">
                    Upload your official card photo (<span className="font-mono">soilhealth.dac.gov.in</span>) to auto-extract pH, N, P, K & Organic Carbon
                  </p>
                </div>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-[#174C32] hover:bg-emerald-50 font-semibold text-xs transition-colors shrink-0 shadow-2xs">
                {ocrScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Analyzing Card...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-emerald-700" />
                    <span>Scan Soil Card Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={ocrScanning}
                  onChange={handleSoilCardUpload}
                  className="hidden"
                />
              </label>
            </div>

            {ocrSuccessMsg && (
              <div className="mt-3 text-xs text-emerald-900 bg-white/80 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ocrSuccessMsg}</span>
              </div>
            )}

            {ocrErrorMsg && (
              <div className="mt-3 text-xs text-amber-900 bg-white/80 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{ocrErrorMsg}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Primary Soil Type *
            </label>
            <select
              value={formData.soil_type}
              onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
            >
              {soilTypes.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Soil pH (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="14"
                value={formData.soil_ph}
                onChange={(e) => setFormData({ ...formData, soil_ph: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. 6.8"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nitrogen N (kg/ha)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.nitrogen_n}
                onChange={(e) => setFormData({ ...formData, nitrogen_n: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. 240"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phosphorus P (kg/ha)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.phosphorus_p}
                onChange={(e) => setFormData({ ...formData, phosphorus_p: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. 22"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Potassium K (kg/ha)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.potassium_k}
                onChange={(e) => setFormData({ ...formData, potassium_k: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. 290"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organic Carbon OC (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.organic_carbon_pct}
                onChange={(e) => setFormData({ ...formData, organic_carbon_pct: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. 0.65"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Water & Irrigation */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#174C32] text-white inline-flex items-center justify-center text-[10px]">4</span>
            Water Source, Irrigation & Preceding Crop
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Primary Irrigation Source
              </label>
              <select
                value={formData.irrigation_source}
                onChange={(e) => setFormData({ ...formData, irrigation_source: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              >
                {irrigationSources.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Irrigation Method
              </label>
              <select
                value={formData.irrigation_method}
                onChange={(e) => setFormData({ ...formData, irrigation_method: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              >
                {irrigationMethods.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Previous Crop (If Cultivated)
              </label>
              <input
                type="text"
                value={formData.previous_crop}
                onChange={(e) => setFormData({ ...formData, previous_crop: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. Wheat or Fallow"
              />
            </div>

            <div className="pt-5 flex items-center gap-2">
              <input
                type="checkbox"
                id="has_water_storage"
                checked={formData.has_water_storage}
                onChange={(e) => setFormData({ ...formData, has_water_storage: e.target.checked })}
                className="w-4 h-4 rounded text-[#174C32] focus:ring-[#174C32] border-gray-300"
              />
              <label htmlFor="has_water_storage" className="text-xs font-medium text-gray-700">
                Farm has on-site water storage pond / tank
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            to="/dashboard/farms"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#174C32] text-white hover:bg-[#1E6240] text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Registering Farm...' : 'Save & Register Farm'}
          </button>
        </div>

      </form>

    </div>
  );
}