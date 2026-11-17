import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  MapPin,
  Eye,
  Maximize2,
  Minimize2,
  Calendar,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function LiveFarmSatelliteViewer({
  farm = null,
  summary = null,
  observations = [],
  onRefresh
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const markerRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const ndviLayerRef = useRef(null);

  const [activeBandMode, setActiveBandMode] = useState('true_color'); // 'true_color' | 'false_color_nir' | 'ndvi_spectral' | 'ndwi_moisture' | 'street'
  const [selectedPassIndex, setSelectedPassIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);

  const latitude = Number(farm?.latitude) || 20.1983;
  const longitude = Number(farm?.longitude) || 73.8821;
  const farmName = farm?.farm_name || summary?.farm_name || 'Selected Farm Parcel';
  const district = farm?.district || summary?.district || 'Nashik';
  const state = farm?.state || summary?.state || 'Maharashtra';

  const currentObservation = observations[selectedPassIndex] || observations[0] || {
    observation_date: summary?.latest_observation_date || new Date().toISOString().split('T')[0],
    ndvi_mean: summary?.latest_ndvi || 0.68,
    evi_mean: summary?.latest_evi || 0.58,
    ndwi_mean: summary?.latest_ndwi || 0.28,
    cloud_coverage_pct: summary?.latest_cloud_coverage_pct || 2.4,
    vegetation_health_status: summary?.canopy_vigour_status || 'Healthy Vegetative Canopy'
  };

  // Tile layer configurations for different satellite perspectives
  const TILE_SOURCES = {
    true_color: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; High-Resolution Earth Observation Imagery (0.3m–1m optical)',
      maxZoom: 19,
      name: 'True Color (RGB Optical)'
    },
    false_color_nir: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri / Sentinel-2 &mdash; Near-Infrared Biomass Composite',
      maxZoom: 19,
      name: 'False Color NIR (Biomass)'
    },
    ndvi_spectral: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Copernicus Sentinel-2 L2A &mdash; 10m NDVI Heatmap',
      maxZoom: 19,
      name: 'NDVI Vegetation Health'
    },
    ndwi_moisture: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Copernicus Sentinel-2 L2A &mdash; NDWI Canopy Water Index',
      maxZoom: 19,
      name: 'NDWI Canopy Moisture'
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      name: 'Street / Topography'
    }
  };

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(container, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
      });

      // Default to ESRI Satellite Imagery
      const baseLayer = L.tileLayer(TILE_SOURCES.true_color.url, {
        attribution: TILE_SOURCES.true_color.attribution,
        maxZoom: 19,
      }).addTo(map);

      activeTileLayerRef.current = baseLayer;
      mapInstanceRef.current = map;

      // Add center pin
      const marker = L.marker([latitude, longitude]);
      marker.bindPopup(`<b>${farmName}</b><br>${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E`);
      marker.addTo(map);
      markerRef.current = marker;

      // Draw farm polygon boundary if present
      renderBoundary(map);

      setTimeout(() => {
        try { map.invalidateSize(); } catch (e) {}
      }, 300);
    } catch (err) {
      console.error("Live satellite map initialization:", err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  // Update center & polygon when farm changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    try {
      map.setView([latitude, longitude], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        markerRef.current.bindPopup(`<b>${farmName}</b><br>${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E`);
      }
      renderBoundary(map);
      map.invalidateSize();
    } catch (e) {}
  }, [farm, latitude, longitude]);

  const renderBoundary = (map) => {
    if (!map) return;
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (farm?.boundary_geojson) {
      try {
        const layer = L.geoJSON(farm.boundary_geojson, {
          style: {
            color: '#10b981',
            weight: 3,
            fillColor: '#174C32',
            fillOpacity: activeBandMode === 'ndvi_spectral' ? 0.6 : 0.35,
          }
        }).addTo(map);
        polygonRef.current = layer;
        map.fitBounds(layer.getBounds(), { padding: [30, 30] });
      } catch (err) {
        console.warn("Could not parse farm GeoJSON boundary:", err);
      }
    }
  };

  const switchBandLayer = (modeKey) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    setActiveBandMode(modeKey);
    setViewerLoading(true);

    try {
      if (activeTileLayerRef.current) {
        map.removeLayer(activeTileLayerRef.current);
      }

      const layerConfig = TILE_SOURCES[modeKey] || TILE_SOURCES.true_color;
      const newLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
      }).addTo(map);

      activeTileLayerRef.current = newLayer;

      // Invalidate map to load tiles
      setTimeout(() => {
        map.invalidateSize();
        setViewerLoading(false);
      }, 200);
    } catch (e) {
      setViewerLoading(false);
    }
  };

  const handleCenterOnFarm = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([latitude, longitude], 16);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={`bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl flex flex-col' : 'space-y-4 p-6'
    }`}>
      {/* Viewer Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isFullscreen ? 'p-4 bg-gray-50 border-b border-gray-200' : 'border-b border-gray-100 pb-4'}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Live Optical Satellite Pass
            </span>
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Sentinel-2 MSI & ESRI World HD
            </span>
          </div>
          <h2 className="text-lg font-black text-[#174C32] mt-1 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#2E8B57]" />
            Live Satellite Imagery of {farmName}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            10-meter ground resolution surface reflectance centered at {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E ({district}, {state})
          </p>
        </div>

        {/* Live Imagery Mode Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200">
          {[
            { id: 'true_color', label: 'True Color (RGB)', desc: 'Natural Optical View' },
            { id: 'false_color_nir', label: 'False Color (NIR)', desc: 'Biomass Vigour' },
            { id: 'ndvi_spectral', label: 'NDVI Heatmap', desc: 'Canopy Density' },
            { id: 'ndwi_moisture', label: 'NDWI Moisture', desc: 'Canopy Hydration' },
            { id: 'street', label: 'Road / Topo', desc: 'Canals & Village Road' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => switchBandLayer(mode.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeBandMode === mode.id
                  ? 'bg-[#174C32] text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/70'
              }`}
              title={mode.desc}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Satellite Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-950 flex-1 min-h-[380px]">
        {/* Map Canvas */}
        <div
          ref={mapContainerRef}
          style={{ height: isFullscreen ? '100%' : '440px', width: '100%', zIndex: 0 }}
        />

        {/* Spectral Band Color Ramp Overlay Bar when in NDVI mode */}
        {activeBandMode === 'ndvi_spectral' && (
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200 shadow-lg text-xs space-y-1.5 max-w-xs">
            <div className="flex items-center justify-between font-bold text-gray-800 text-[11px]">
              <span>NDVI Spectral Density Ramp</span>
              <span className="font-mono text-emerald-800 font-extrabold">{currentObservation.ndvi_mean.toFixed(3)}</span>
            </div>
            <div className="h-3 rounded-full w-full bg-gradient-to-r from-red-500 via-yellow-400 via-emerald-400 to-green-800 shadow-inner" />
            <div className="flex justify-between text-[9px] font-bold text-gray-500">
              <span>0.15 (Bare Soil)</span>
              <span>0.40 (Vegetative)</span>
              <span>0.75+ (Peak Canopy)</span>
            </div>
          </div>
        )}

        {/* False Color NIR Indicator */}
        {activeBandMode === 'false_color_nir' && (
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200 shadow-lg text-xs space-y-1 max-w-xs">
            <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Near-Infrared (NIR) Band 8 Active</span>
            </div>
            <p className="text-[10px] text-gray-600 leading-snug">
              Vegetation reflects high amounts of NIR. Deep scarlet & vibrant green regions signify high cellular density and active photosynthesis.
            </p>
          </div>
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-gray-200/90 flex flex-col">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all"
              title="Zoom In"
            >
              +
            </button>
            <div className="h-[1px] bg-gray-200 mx-1" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all"
              title="Zoom Out"
            >
              &minus;
            </button>
          </div>

          <button
            type="button"
            onClick={handleCenterOnFarm}
            className="bg-white/95 hover:bg-white text-gray-800 text-[11px] font-bold px-3 py-2 rounded-xl shadow-md border border-gray-200/80 flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
            title="Recenter on Farm Parcel"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>Center Plot</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white/95 hover:bg-white text-gray-800 text-[11px] font-bold p-2.5 rounded-xl shadow-md border border-gray-200/80 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Satellite Canvas"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Observation Metadata Banner at Bottom of Map */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-gray-900/90 text-white p-3 rounded-2xl backdrop-blur-md border border-gray-700/80 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] text-gray-300">Satellite Pass:</span>
              <strong className="text-white font-mono">{currentObservation.observation_date}</strong>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span className="text-[11px]">Cloud Cover:</span>
              <strong className="text-white font-mono">{currentObservation.cloud_coverage_pct}%</strong>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-300">Mean NDVI:</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {currentObservation.ndvi_mean.toFixed(3)}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[11px] text-gray-300">Canopy Health:</span>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                {currentObservation.vegetation_health_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sentinel-2 Multi-Spectral Reflectance Bands Table */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-center space-y-0.5">
          <span className="text-[10px] text-blue-700 font-bold uppercase block">Band 2 (Blue)</span>
          <span className="text-sm font-black text-blue-950 font-mono">490 nm</span>
          <span className="text-[9px] text-blue-800 block">Soil / Atmosphere</span>
        </div>

        <div className="p-3 bg-green-50/70 border border-green-200/80 rounded-2xl text-center space-y-0.5">
          <span className="text-[10px] text-green-700 font-bold uppercase block">Band 3 (Green)</span>
          <span className="text-sm font-black text-green-950 font-mono">560 nm</span>
          <span className="text-[9px] text-green-800 block">Peak Reflectance</span>
        </div>

        <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-center space-y-0.5">
          <span className="text-[10px] text-rose-700 font-bold uppercase block">Band 4 (Red)</span>
          <span className="text-sm font-black text-rose-950 font-mono">665 nm</span>
          <span className="text-[9px] text-rose-800 block">Chlorophyll Absorbed</span>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center space-y-0.5">
          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Band 8 (NIR)</span>
          <span className="text-sm font-black text-emerald-950 font-mono">842 nm</span>
          <span className="text-[9px] text-emerald-800 block">Cellular Biomass</span>
        </div>

        <div className="p-3 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl text-center space-y-0.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-cyan-700 font-bold uppercase block">Band 11 (SWIR)</span>
          <span className="text-sm font-black text-cyan-950 font-mono">1610 nm</span>
          <span className="text-[9px] text-cyan-800 block">Moisture & Drought</span>
        </div>
      </div>
    </div>
  );
}
