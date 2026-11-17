import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  Compass,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Thermometer,
  ShieldAlert
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { farmService } from '../../services/api';
import api from '../../services/api';

export default function WeatherPreviewPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async (farmId) => {
    try {
      setRefreshing(true);
      const url = farmId ? `/api/weather/current/?farm_id=${farmId}` : '/api/weather/current/';
      const res = await api.get(url);
      setWeatherData(res.data);
    } catch (err) {
      console.error("Failed to load weather data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    farmService.getFarms().then((res) => {
      const list = res.data.results || res.data || [];
      setFarms(list);
      if (list.length > 0) {
        setSelectedFarmId(list[0].id);
        fetchWeather(list[0].id);
      } else {
        fetchWeather(null);
      }
    });
  }, []);

  const handleFarmChange = (e) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    fetchWeather(id);
  };

  // Prepare 24h hourly chart data
  const hourlyChartData = [];
  if (weatherData?.hourly_24h?.time) {
    const times = weatherData.hourly_24h.time.slice(0, 24);
    const temps = weatherData.hourly_24h.temperature_2m.slice(0, 24);
    const hums = weatherData.hourly_24h.relative_humidity_2m.slice(0, 24);
    const probs = weatherData.hourly_24h.precipitation_probability.slice(0, 24);

    for (let i = 0; i < times.length; i++) {
      const hourStr = times[i].split('T')[1]?.slice(0, 5) || `${i}:00`;
      hourlyChartData.push({
        time: hourStr,
        temp: temps[i],
        humidity: hums[i],
        rain_prob: probs[i]
      });
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Live Open-Meteo & IMD Weather Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#174C32] mt-2">
            Agricultural Weather & Advisory Alerts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Hyper-local meteorological telemetry mapped to your farm coordinates with actionable risk advisories
          </p>
        </div>

        {farms.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedFarmId}
              onChange={handleFarmChange}
              className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#174C32]"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.farm_name} ({f.district})</option>
              ))}
            </select>

            <button
              onClick={() => fetchWeather(selectedFarmId)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors shadow-2xs"
              title="Refresh Live Weather"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 text-xs">
          Connecting to Open-Meteo Live API and evaluating IMD thresholds...
        </div>
      ) : (
        <>
          {/* Active Agricultural Alerts Banner */}
          {weatherData?.alerts && weatherData.alerts.length > 0 && (
            <div className="space-y-3">
              {weatherData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-3xl border shadow-2xs flex flex-col sm:flex-row items-start gap-4 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-blue-50 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80">
                        {alert.type}
                      </span>
                      <h3 className="text-sm font-bold">{alert.title}</h3>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                    
                    <div className="pt-2 text-xs font-semibold flex items-start gap-1.5 text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>Recommended Field Operation: {alert.action}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Weather Dashboard Card */}
          <div className="bg-gradient-to-br from-[#174C32] to-[#1E6240] rounded-3xl p-6 sm:p-8 text-white shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-800/80 pb-4">
              <div>
                <span className="text-[11px] font-mono text-emerald-300 uppercase">
                  Source: {weatherData?.data_source}
                </span>
                <h2 className="text-xl font-extrabold mt-0.5">
                  {weatherData?.location} • {weatherData?.farm_name}
                </h2>
                <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                  {weatherData?.coordinates?.latitude}° N, {weatherData?.coordinates?.longitude}° E
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black block">
                    {weatherData?.current?.temperature_c}°C
                  </span>
                  <span className="text-xs text-emerald-200">
                    Feels like {weatherData?.current?.feels_like_c}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-emerald-950/40 rounded-2xl border border-emerald-800 space-y-1">
                <span className="text-emerald-300 flex items-center gap-1.5 text-[11px]">
                  <CloudSun className="w-4 h-4" /> Condition
                </span>
                <span className="text-sm font-bold block">{weatherData?.current?.condition}</span>
              </div>

              <div className="p-3.5 bg-emerald-950/40 rounded-2xl border border-emerald-800 space-y-1">
                <span className="text-emerald-300 flex items-center gap-1.5 text-[11px]">
                  <Droplets className="w-4 h-4" /> Humidity
                </span>
                <span className="text-sm font-bold block">{weatherData?.current?.humidity_pct}%</span>
              </div>

              <div className="p-3.5 bg-emerald-950/40 rounded-2xl border border-emerald-800 space-y-1">
                <span className="text-emerald-300 flex items-center gap-1.5 text-[11px]">
                  <Wind className="w-4 h-4" /> Wind Speed
                </span>
                <span className="text-sm font-bold block">{weatherData?.current?.wind_speed_kmh} km/h</span>
              </div>

              <div className="p-3.5 bg-emerald-950/40 rounded-2xl border border-emerald-800 space-y-1">
                <span className="text-emerald-300 flex items-center gap-1.5 text-[11px]">
                  <Compass className="w-4 h-4" /> Precipitation
                </span>
                <span className="text-sm font-bold block">{weatherData?.current?.precipitation_mm} mm</span>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast Cards */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900">7-Day Agricultural Outlook</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weatherData?.forecast_7_day?.map((day, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-2 text-center"
                >
                  <span className="text-xs font-bold text-gray-800 block">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                  </span>
                  <div className="text-xs text-emerald-800 font-semibold">{day.condition}</div>
                  
                  <div className="pt-1 text-xs">
                    <span className="font-extrabold text-gray-900">{day.temp_max}°</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">{day.temp_min}°</span>
                  </div>

                  <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 flex justify-between">
                    <span>Rain: {day.rain_sum_mm}mm</span>
                    <span className="font-bold text-blue-600">{day.rain_prob_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 24-Hour Hourly Trend Chart */}
          {hourlyChartData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">24-Hour Diurnal Temperature (°C) & Moisture Curve</h3>
                <span className="text-xs text-gray-500 font-mono">Hourly Open-Meteo Resolution</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyChartData}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E6240" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1E6240" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                    <YAxis unit="°C" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val) => [`${val}°C`, 'Temperature']}
                    />
                    <Area type="monotone" dataKey="temp" stroke="#174C32" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
