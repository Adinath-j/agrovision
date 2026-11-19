import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  PlusCircle,
  Trash2,
  Edit3,
  Layers,
  ShieldCheck,
  Droplets,
  Calendar,
  AlertCircle,
  FileText,
  X,
  Globe,
  Compass
} from 'lucide-react';
import { farmService } from '../../services/api';
import FarmMap from '../../components/common/FarmMap';

export default function FarmsListPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [soilRecords, setSoilRecords] = useState([]);
  const [soilModalOpen, setSoilModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [unitPref, setUnitPref] = useState('acres'); // 'acres' | 'hectares' | 'guntha'

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await farmService.getFarms();
      setFarms(res.data.results || res.data || []);
    } catch (err) {
      setError('Failed to load farms from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await farmService.deleteFarm(id);
        setFarms(farms.filter((f) => f.id !== id));
      } catch (err) {
        alert('Failed to delete farm.');
      }
    }
  };

  const handleOpenSoilModal = async (farm) => {
    setSelectedFarm(farm);
    setSoilModalOpen(true);
    try {
      const res = await farmService.getSoilRecords(farm.id);
      setSoilRecords(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMapModal = (farm) => {
    setSelectedFarm(farm);
    setMapModalOpen(true);
  };

  const totalHectares = farms.reduce((sum, f) => sum + parseFloat(f.area_hectares || 0), 0).toFixed(2);
  const totalAcres = (totalHectares * 2.47105).toFixed(2);
  const totalGuntha = (totalHectares * 100).toFixed(0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#174C32]">My Registered Farms</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your land parcels, GPS coordinates, interactive GIS boundaries and soil profiles
          </p>
        </div>

        <Link
          to="/dashboard/farms/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C32] text-white font-semibold text-xs sm:text-sm hover:bg-[#1E6240] transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Farm Parcel</span>
        </Link>
      </div>

      {/* Summary Banner with Land Unit Switcher */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Registered Portfolio</div>
            <div className="text-xl font-bold text-gray-900">
              {farms.length} Farm Parcels <span className="text-gray-400 font-normal">|</span>{' '}
              {unitPref === 'acres'
                ? `${totalAcres} Acres`
                : unitPref === 'guntha'
                ? `${totalGuntha} Guntha`
                : `${totalHectares} Hectares`}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              ≈ {totalAcres} Acres &bull; {totalHectares} Ha &bull; {totalGuntha} Guntha
            </div>
          </div>
        </div>

        {/* Global Unit Selector */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase px-2">Display Unit:</span>
          <button
            type="button"
            onClick={() => setUnitPref('acres')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              unitPref === 'acres' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Acres (एकड़)
          </button>
          <button
            type="button"
            onClick={() => setUnitPref('hectares')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              unitPref === 'hectares' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hectares (हेक्टेयर)
          </button>
          <button
            type="button"
            onClick={() => setUnitPref('guntha')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              unitPref === 'guntha' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Guntha (गुंठा)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Farms Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 text-sm">
          Loading your farm holdings...
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Farm Registered Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Add your first farm plot to enable pre-sowing predictions, weather warnings, and satellite remote sensing.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard/farms/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C32] text-white text-xs font-semibold hover:bg-[#1E6240]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Farm Parcel</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{farm.farm_name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    {farm.soil_type_display || farm.soil_type}
                  </span>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-400 block uppercase">Area</span>
                    <span className="font-bold text-gray-800">
                      {unitPref === 'acres'
                        ? `${(farm.area_hectares * 2.47105).toFixed(2)} Acres`
                        : unitPref === 'guntha'
                        ? `${(farm.area_hectares * 100).toFixed(1)} Guntha`
                        : `${farm.area_hectares} Ha`}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      ≈ {(farm.area_hectares * 2.47105).toFixed(1)} Ac &bull; {(farm.area_hectares * 100).toFixed(0)} Gth
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-400 block uppercase">Irrigation</span>
                    <span className="font-bold text-gray-800">{farm.irrigation_method_display || farm.irrigation_method}</span>
                    <span className="text-[10px] text-gray-400 block">{farm.irrigation_source_display || farm.irrigation_source}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-400 block uppercase">Soil pH</span>
                    <span className="font-bold text-gray-800">{farm.soil_ph ? farm.soil_ph : 'Not Tested'}</span>
                    <span className="text-[10px] text-emerald-700 block font-medium">{farm.soil_ph ? 'Tested' : 'Estimated'}</span>
                  </div>
                </div>

                {/* GPS Coordinates & Survey info */}
                <div className="text-[11px] text-gray-500 bg-[#F6F8F5] p-3 rounded-xl border border-gray-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Survey / Khasra No:</span>
                    <span className="font-mono text-gray-700">{farm.survey_khasra_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Coordinates:</span>
                    <span className="font-mono text-gray-700">
                      {farm.latitude && farm.longitude ? `${farm.latitude}° N, ${farm.longitude}° E` : 'Centroid not mapped'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSoilModal(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Soil Profile</span>
                  </button>

                  <button
                    onClick={() => handleOpenMapModal(farm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 font-semibold hover:bg-sky-100 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>GIS Satellite</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(farm.id, farm.farm_name)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Farm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* GIS Boundary Modal */}
      {mapModalOpen && selectedFarm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#174C32]" />
                  GIS Satellite Parcel Boundary – {selectedFarm.farm_name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedFarm.district}, {selectedFarm.state} &bull; Lat: {selectedFarm.latitude}° N, Lng: {selectedFarm.longitude}° E
                </p>
              </div>
              <button
                onClick={() => setMapModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner">
              <FarmMap
                latitude={selectedFarm.latitude || 20.1983}
                longitude={selectedFarm.longitude || 73.8821}
                boundaryGeojson={selectedFarm.boundary?.boundary_geojson}
                isEditable={false}
                height="380px"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-800">Total Parcel Area:</span> {selectedFarm.area_hectares} Hectares ({selectedFarm.area_hectares ? (selectedFarm.area_hectares * 2.47105).toFixed(2) : 0} Acres)
              </div>
              <div className="text-gray-600">
                <span className="font-semibold text-gray-800">Polygon Status:</span> {selectedFarm.boundary?.boundary_geojson ? 'Georeferenced Polygon Active' : 'Centroid Point Pin Active'}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-gray-100">
              <button
                onClick={() => setMapModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soil Health Modal */}
      {soilModalOpen && selectedFarm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Soil Health Card Profile</h3>
                <p className="text-xs text-gray-500">
                  {selectedFarm.farm_name} &bull; {selectedFarm.village ? `${selectedFarm.village}, ` : ''}{selectedFarm.district}, {selectedFarm.state}
                </p>
              </div>
              <button
                onClick={() => setSoilModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Soil Classification</span>
                  <span className="font-bold text-emerald-900">{selectedFarm.soil_type_display || selectedFarm.soil_type}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Survey / Khasra</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedFarm.survey_khasra_number || 'Not Recorded'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Soil pH</span>
                  <span className="text-lg font-extrabold text-[#174C32]">
                    {selectedFarm.soil_ph ? selectedFarm.soil_ph : 'N/A'}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    {selectedFarm.soil_ph
                      ? Number(selectedFarm.soil_ph) < 6.5
                        ? 'Slightly Acidic'
                        : Number(selectedFarm.soil_ph) <= 7.8
                        ? 'Neutral'
                        : 'Alkaline'
                      : 'Estimated'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Nitrogen (N)</span>
                  <span className="text-lg font-extrabold text-[#174C32]">
                    {selectedFarm.nitrogen_n ? selectedFarm.nitrogen_n : 'N/A'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {selectedFarm.nitrogen_n ? 'kg/ha' : 'Estimated'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Phosphorus (P)</span>
                  <span className="text-lg font-extrabold text-[#174C32]">
                    {selectedFarm.phosphorus_p ? selectedFarm.phosphorus_p : 'N/A'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {selectedFarm.phosphorus_p ? 'kg/ha' : 'Estimated'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Potassium (K)</span>
                  <span className="text-lg font-extrabold text-[#174C32]">
                    {selectedFarm.potassium_k ? selectedFarm.potassium_k : 'N/A'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {selectedFarm.potassium_k ? 'kg/ha' : 'Estimated'}
                  </span>
                </div>
              </div>

              {selectedFarm.organic_carbon_pct && (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Organic Carbon (OC %):</span>
                  <span className="font-bold text-[#174C32]">{selectedFarm.organic_carbon_pct}%</span>
                </div>
              )}

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/70 text-xs text-emerald-900 space-y-1">
                <div className="font-bold">Agronomic Evaluation:</div>
                <p>
                  Soil profile for <strong>{selectedFarm.farm_name}</strong> is classified as {selectedFarm.soil_type_display || selectedFarm.soil_type}
                  {selectedFarm.soil_ph ? ` with a pH of ${selectedFarm.soil_ph}` : ''} in {selectedFarm.district}, {selectedFarm.state}.
                  {selectedFarm.nitrogen_n && selectedFarm.phosphorus_p && selectedFarm.potassium_k
                    ? ` Macronutrient inventory (N: ${selectedFarm.nitrogen_n}, P: ${selectedFarm.phosphorus_p}, K: ${selectedFarm.potassium_k} kg/ha) actively informs fertilizer dosage.`
                    : ' Baseline regional nutrient benchmarks active until official lab card upload.'}
                </p>
              </div>

              {/* Historical Soil Testing Records */}
              {soilRecords.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Soil Lab Testing History ({soilRecords.length})
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {soilRecords.map((rec) => (
                      <div key={rec.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center font-semibold text-gray-800">
                          <span>{rec.lab_name || 'Soil Health Testing Lab'}</span>
                          <span className="text-gray-400 font-mono text-[10px]">{rec.test_date}</span>
                        </div>
                        <div className="text-[11px] text-gray-600 flex gap-3">
                          {rec.ph && <span>pH: <strong>{rec.ph}</strong></span>}
                          {rec.nitrogen_kg_ha && <span>N: <strong>{rec.nitrogen_kg_ha}</strong></span>}
                          {rec.phosphorus_kg_ha && <span>P: <strong>{rec.phosphorus_kg_ha}</strong></span>}
                          {rec.potassium_kg_ha && <span>K: <strong>{rec.potassium_kg_ha}</strong></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-gray-100">
              <button
                onClick={() => setSoilModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}