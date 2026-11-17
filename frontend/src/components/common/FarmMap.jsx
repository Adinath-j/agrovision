import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Trash2, CheckCircle2, Navigation } from 'lucide-react';

// Fix Leaflet marker icon paths in Vite safely
try {
  if (L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }
} catch (err) {
  console.warn("Leaflet default icon merge ignored:", err);
}

export default function FarmMap({
  latitude = 20.1983,
  longitude = 73.8821,
  onLocationChange,
  onBoundaryChange,
  boundaryGeojson = null,
  isEditable = true,
  height = '350px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'street'
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [currentCoords, setCurrentCoords] = useState({ lat: Number(latitude) || 20.1983, lng: Number(longitude) || 73.8821 });

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }
    if (mapInstanceRef.current) return; // Prevent duplicate init

    try {
      const initialLat = Number(latitude) || 20.1983;
      const initialLng = Number(longitude) || 73.8821;

      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      // Default to ESRI Satellite Imagery
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      });

      satelliteLayer.addTo(map);
      tileLayerRef.current = satelliteLayer;
      mapInstanceRef.current = map;

      // Add marker
      const marker = L.marker([initialLat, initialLng], { draggable: isEditable });
      marker.addTo(map);
      markerRef.current = marker;

      setTimeout(() => {
        try { map.invalidateSize(); } catch (e) {}
      }, 250);

      if (isEditable) {
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const roundedLat = Number(lat.toFixed(6));
          const roundedLng = Number(lng.toFixed(6));
          setCurrentCoords({ lat: roundedLat, lng: roundedLng });
          if (onLocationChange) onLocationChange(roundedLat, roundedLng);
        });

        // Map click handler to add polygon vertices or move marker
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setPolygonPoints((prev) => {
            const newPoints = [...prev, [Number(lat.toFixed(6)), Number(lng.toFixed(6))]];
            return newPoints;
          });
        });
      }

      // Load existing boundary if provided
      if (boundaryGeojson) {
        loadGeoJsonBoundary(boundaryGeojson, map);
      }
    } catch (err) {
      console.error("Map initialization failed safely:", err);
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

  // Update center when props change externally
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const numLat = Number(latitude);
    const numLng = Number(longitude);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      setCurrentCoords({ lat: numLat, lng: numLng });
      if (markerRef.current) {
        markerRef.current.setLatLng([numLat, numLng]);
      }
    }
  }, [latitude, longitude]);

  // Handle Layer Toggle
  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapType === 'satellite') {
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
      streetLayer.addTo(map);
      tileLayerRef.current = streetLayer;
      setMapType('street');
    } else {
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18,
      });
      satelliteLayer.addTo(map);
      tileLayerRef.current = satelliteLayer;
      setMapType('satellite');
    }
  };

  // Render Polygon on Map whenever polygonPoints change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (polygonPoints.length >= 3) {
      const poly = L.polygon(polygonPoints, {
        color: '#10b981',
        weight: 3,
        fillColor: '#174C32',
        fillOpacity: 0.45,
      }).addTo(map);

      polygonRef.current = poly;

      // Notify parent of GeoJSON
      if (onBoundaryChange) {
        const coordinates = [...polygonPoints.map(([lat, lng]) => [lng, lat])];
        coordinates.push(coordinates[0]); // Close ring
        const geojson = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
        onBoundaryChange(geojson);
      }
    }
  }, [polygonPoints]);

  const loadGeoJsonBoundary = (geojson, map) => {
    try {
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
      }
      const layer = L.geoJSON(geojson, {
        style: {
          color: '#10b981',
          weight: 3,
          fillColor: '#174C32',
          fillOpacity: 0.45,
        }
      }).addTo(map);
      polygonRef.current = layer;
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch (err) {
      console.error('Failed to load GeoJSON boundary:', err);
    }
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
    if (polygonRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    if (onBoundaryChange) onBoundaryChange(null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCurrentCoords({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
        if (onLocationChange) onLocationChange(lat, lng);
      },
      (err) => alert('Unable to retrieve your location: ' + err.message)
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xs">
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 0 }} />

      {/* Floating Map Controls Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleMapType}
          className="bg-white/95 hover:bg-white text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md border border-gray-200/80 flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>{mapType === 'satellite' ? 'Street Map' : 'Satellite Optics'}</span>
        </button>

        {isEditable && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="bg-white/95 hover:bg-white text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md border border-gray-200/80 flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
            title="Use current GPS position"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>My GPS</span>
          </button>
        )}

        {isEditable && polygonPoints.length > 0 && (
          <button
            type="button"
            onClick={clearPolygon}
            className="bg-white/95 hover:bg-rose-50 text-rose-700 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md border border-rose-200 flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Boundary ({polygonPoints.length})</span>
          </button>
        )}
      </div>

      {/* Coordinate & Boundary Status Footer */}
      <div className="bg-gray-900/90 text-white px-4 py-2 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>GPS Pin: <strong>{currentCoords.lat.toFixed(5)}°N, {currentCoords.lng.toFixed(5)}°E</strong></span>
        </div>

        {isEditable && (
          <div className="text-[10px] text-emerald-300 font-sans">
            {polygonPoints.length === 0 ? (
              <span>💡 Click on the map to trace your farm's boundary vertices.</span>
            ) : polygonPoints.length < 3 ? (
              <span>Click {3 - polygonPoints.length} more point(s) to close polygon boundary.</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" /> {polygonPoints.length}-point boundary mapped
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
