import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Trash2, CheckCircle2, Navigation, Undo2 } from 'lucide-react';

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

/**
 * Calculates geodesic area of a polygon from [lat, lng] vertices in meters squared,
 * hectares, acres, and guntha using equirectangular projection centered at centroid.
 *
 * @param {Array<[number, number]>} latLngPoints - Array of [lat, lng] coordinates
 * @returns {{ sqMeters: number, hectares: number, acres: number, guntha: number }}
 */
export function calculatePolygonArea(latLngPoints) {
  if (!latLngPoints || latLngPoints.length < 3) {
    return { sqMeters: 0, hectares: 0, acres: 0, guntha: 0 };
  }

  // Remove duplicate closing point if present
  let pts = [...latLngPoints];
  if (
    pts.length > 3 &&
    Math.abs(pts[0][0] - pts[pts.length - 1][0]) < 1e-7 &&
    Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 1e-7
  ) {
    pts.pop();
  }

  if (pts.length < 3) {
    return { sqMeters: 0, hectares: 0, acres: 0, guntha: 0 };
  }

  const R = 6378137.0; // WGS84 Earth radius in meters
  const n = pts.length;

  // Find centroid for projection origin
  let sumLat = 0;
  let sumLng = 0;
  for (let i = 0; i < n; i++) {
    sumLat += pts[i][0];
    sumLng += pts[i][1];
  }
  const lat0 = sumLat / n;
  const lon0 = sumLng / n;
  const cosLat0 = Math.cos((lat0 * Math.PI) / 180.0);

  // Project spherical coords to local metric Cartesian (x, y)
  const xy = pts.map(([lat, lng]) => ({
    x: R * ((lng - lon0) * Math.PI / 180.0) * cosLat0,
    y: R * ((lat - lat0) * Math.PI / 180.0)
  }));

  // Gauss's Shoelace formula
  let areaM2 = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    areaM2 += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  areaM2 = Math.abs(areaM2) / 2.0;

  const hectares = areaM2 / 10000.0;
  const acres = hectares * 2.4710538;
  const guntha = hectares * 100.0;

  return {
    sqMeters: Math.round(areaM2 * 100) / 100,
    hectares: Math.round(hectares * 10000) / 10000,
    acres: Math.round(acres * 100) / 100,
    guntha: Math.round(guntha * 10) / 10
  };
}

export default function FarmMap({
  latitude = 20.1983,
  longitude = 73.8821,
  onLocationChange,
  onBoundaryChange,
  onAreaCalculated,
  boundaryGeojson = null,
  isEditable = true,
  height = '350px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const drawingLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'street'
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [calculatedArea, setCalculatedArea] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({
    lat: Number(latitude) || 20.1983,
    lng: Number(longitude) || 73.8821
  });

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
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 18,
        }
      );

      satelliteLayer.addTo(map);
      tileLayerRef.current = satelliteLayer;

      // Layer group for interactive drawing (polygon, vertex markers, guideline)
      const drawingGroup = L.layerGroup().addTo(map);
      drawingLayerRef.current = drawingGroup;

      mapInstanceRef.current = map;

      // Add center marker
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

        // Map click handler to drop marker, auto-populate coordinates and add boundary vertices
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          const roundedLat = Number(lat.toFixed(6));
          const roundedLng = Number(lng.toFixed(6));

          if (markerRef.current) {
            markerRef.current.setLatLng([roundedLat, roundedLng]);
          }
          setCurrentCoords({ lat: roundedLat, lng: roundedLng });
          if (onLocationChange) {
            onLocationChange(roundedLat, roundedLng);
          }

          setPolygonPoints((prev) => [...prev, [roundedLat, roundedLng]]);
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
      try {
        mapInstanceRef.current.setView([numLat, numLng], mapInstanceRef.current.getZoom(), { animate: true });
      } catch (e) {}
    }
  }, [latitude, longitude]);

  // Load boundaryGeojson when prop updates
  useEffect(() => {
    if (mapInstanceRef.current && boundaryGeojson && polygonPoints.length === 0) {
      loadGeoJsonBoundary(boundaryGeojson, mapInstanceRef.current);
    }
  }, [boundaryGeojson]);

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
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 18,
        }
      );
      satelliteLayer.addTo(map);
      tileLayerRef.current = satelliteLayer;
      setMapType('satellite');
    }
  };

  // Render Polygon & Calculate Geodesic Area whenever polygonPoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !drawingLayerRef.current) return;
    const drawingGroup = drawingLayerRef.current;
    drawingGroup.clearLayers();

    // Render vertex markers
    if (isEditable && polygonPoints.length > 0) {
      polygonPoints.forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], {
          radius: 5,
          color: '#047857',
          fillColor: '#34d399',
          fillOpacity: 0.9,
          weight: 2
        }).addTo(drawingGroup);
      });
    }

    if (polygonPoints.length === 2) {
      // Connect first two points with a dashed guideline
      L.polyline(polygonPoints, {
        color: '#10b981',
        weight: 2.5,
        dashArray: '6, 6'
      }).addTo(drawingGroup);
      setCalculatedArea(null);
    } else if (polygonPoints.length >= 3) {
      // Closed polygon with shaded fill
      L.polygon(polygonPoints, {
        color: '#10b981',
        weight: 3,
        fillColor: '#174C32',
        fillOpacity: 0.45,
      }).addTo(drawingGroup);

      // Compute geodesic polygon area
      const area = calculatePolygonArea(polygonPoints);
      setCalculatedArea(area);

      // Notify parent of GeoJSON and calculated area in Hectares
      if (onBoundaryChange) {
        const coordinates = [...polygonPoints.map(([lat, lng]) => [lng, lat])];
        coordinates.push(coordinates[0]); // Close ring for valid GeoJSON
        const geojson = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
        onBoundaryChange(geojson, area.hectares, area);
      }

      if (onAreaCalculated) {
        onAreaCalculated(area);
      }
    } else {
      setCalculatedArea(null);
    }
  }, [polygonPoints]);

  const loadGeoJsonBoundary = (geojson, map) => {
    try {
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      if (drawingLayerRef.current) {
        drawingLayerRef.current.clearLayers();
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

      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [25, 25] });
        }
      } catch (e) {}

      // Calculate area from GeoJSON coordinates
      if (geojson && geojson.coordinates && geojson.coordinates[0]) {
        const pts = geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
        const area = calculatePolygonArea(pts);
        setCalculatedArea(area);
        if (onAreaCalculated) onAreaCalculated(area);
      }
    } catch (err) {
      console.error('Failed to load GeoJSON boundary:', err);
    }
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
    setCalculatedArea(null);
    if (drawingLayerRef.current) {
      drawingLayerRef.current.clearLayers();
    }
    if (polygonRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    if (onBoundaryChange) onBoundaryChange(null, 0, null);
    if (onAreaCalculated) onAreaCalculated(null);
  };

  const handleUndoPoint = () => {
    setPolygonPoints((prev) => {
      const next = prev.slice(0, -1);
      if (next.length < 3) {
        setCalculatedArea(null);
        if (next.length === 0) {
          if (onBoundaryChange) onBoundaryChange(null, 0, null);
          if (onAreaCalculated) onAreaCalculated(null);
        }
      }
      return next;
    });
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

      {/* Real-time Calculated Area Floating Badge */}
      {calculatedArea && calculatedArea.hectares > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-emerald-500/30 flex items-center gap-2.5 animate-fadeIn">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            📐
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              Calculated Parcel Area
            </div>
            <div className="text-xs font-extrabold text-[#174C32] flex items-center gap-1.5">
              <span>{calculatedArea.acres} Acres</span>
              <span className="text-gray-300">•</span>
              <span className="text-emerald-700 font-semibold">{calculatedArea.hectares} Ha</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600 font-normal">{calculatedArea.guntha} Guntha</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Map Controls Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
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
        </div>

        {isEditable && polygonPoints.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndoPoint}
              className="bg-white/95 hover:bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-md border border-amber-200 flex items-center gap-1 backdrop-blur-xs transition-all cursor-pointer"
              title="Undo last added vertex"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Undo ({polygonPoints.length})</span>
            </button>

            <button
              type="button"
              onClick={clearPolygon}
              className="bg-white/95 hover:bg-rose-50 text-rose-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-md border border-rose-200 flex items-center gap-1 backdrop-blur-xs transition-all cursor-pointer"
              title="Clear entire boundary polygon"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Coordinate & Boundary Status Footer */}
      <div className="bg-gray-900/90 text-white px-4 py-2 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>GPS Pin: <strong>{currentCoords.lat.toFixed(5)}°N, {currentCoords.lng.toFixed(5)}°E</strong></span>
        </div>

        {isEditable ? (
          <div className="text-[10px] font-sans">
            {polygonPoints.length === 0 ? (
              <span className="text-emerald-300">💡 Click on the map to trace your parcel boundary vertices.</span>
            ) : polygonPoints.length < 3 ? (
              <span className="text-amber-300">
                Click {3 - polygonPoints.length} more point(s) to close polygon & compute parcel area.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{polygonPoints.length}-pt boundary</span>
                {calculatedArea && calculatedArea.hectares > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-emerald-200 font-mono font-semibold">
                      {calculatedArea.acres} Ac ({calculatedArea.hectares} Ha)
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
        ) : (
          calculatedArea && calculatedArea.hectares > 0 && (
            <div className="text-[10px] text-emerald-300 font-sans flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Polygon Area: {calculatedArea.acres} Acres ({calculatedArea.hectares} Ha)</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
