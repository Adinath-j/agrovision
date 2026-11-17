import React, { useState, useEffect } from 'react';
import { Wheat, Calendar, Droplets, Thermometer, Info, CheckCircle2 } from 'lucide-react';
import { cropService } from '../../services/api';

export default function CropsCatalogPage() {
  const [crops, setCrops] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropsRes, seasonsRes] = await Promise.all([
          cropService.getCrops(),
          cropService.getSeasons()
        ]);
        setCrops(cropsRes.data.results || cropsRes.data || []);
        setSeasons(seasonsRes.data.results || seasonsRes.data || []);
      } catch (err) {
        console.error("Failed to load crops/seasons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#174C32]">Crop & Season Master Catalog</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configurable agronomic benchmarks, water thresholds, and maturity windows supporting AGROVISION ML models
        </p>
      </div>

      {/* Cropping Seasons Calendar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base font-bold text-gray-900">National Cropping Seasons (India)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {seasons.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl bg-[#F6F8F5] border border-gray-200/60 space-y-2">
              <span className="text-xs font-bold text-[#174C32] block">{s.name}</span>
              <p className="text-xs text-gray-600 leading-relaxed">{s.description}</p>
              <div className="pt-2 text-[11px] font-mono text-emerald-800 flex justify-between border-t border-gray-200/60">
                <span>Sow: Month {s.sowing_start_month}–{s.sowing_end_month}</span>
                <span>Harvest: Month {s.harvesting_start_month}–{s.harvesting_end_month}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Crops Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900">Supported Strategic Crops ({crops.length})</h2>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-xs">Loading crops catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{crop.name}</h3>
                      <p className="text-xs italic text-gray-500">{crop.scientific_name}</p>
                      {(crop.marathi_name || crop.hindi_name) && (
                        <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                          {[crop.marathi_name, crop.hindi_name].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {crop.category_display || crop.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {crop.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 block uppercase">Duration</span>
                      <span className="font-bold text-gray-800">{crop.growing_duration_days} Days</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 block uppercase">National Benchmark</span>
                      <span className="font-bold text-gray-800">{crop.standard_national_yield_kg_per_ha} kg/ha</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 block uppercase">Water Requirement</span>
                      <span className="font-bold text-gray-800">{crop.water_requirement_min_mm}–{crop.water_requirement_max_mm} mm</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 block uppercase">Ideal Temperature</span>
                      <span className="font-bold text-gray-800">{crop.ideal_temp_min_c}°C–{crop.ideal_temp_max_c}°C</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Soil pH: {crop.ideal_soil_ph_min}–{crop.ideal_soil_ph_max}</span>
                  <span className="text-emerald-700 font-semibold">Active in ML Pipeline</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
