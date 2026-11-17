import React, { useState, useEffect } from 'react';
import {
  Store,
  TrendingUp,
  MapPin,
  ArrowRight,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { cropService } from '../../services/api';

export default function MarketPreviewPage() {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Soybean');
  const [selectedState, setSelectedState] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gross Revenue Estimator State
  const [productionTonnes, setProductionTonnes] = useState(3.5);
  const [selectedMandiPrice, setSelectedMandiPrice] = useState(4650.0);
  const [selectedMandiName, setSelectedMandiName] = useState('Nashik APMC');
  const [revenueResult, setRevenueResult] = useState(null);

  const states = [
    'Maharashtra',
    'Madhya Pradesh',
    'Karnataka',
    'Gujarat',
    'Punjab',
    'Uttar Pradesh'
  ];

  useEffect(() => {
    cropService.getCrops().then((res) => {
      const list = res.data.results || res.data || [];
      setCrops(list);
    });
  }, []);

  const fetchMarketComparison = async (crop, state) => {
    setLoading(true);
    try {
      const url = `/api/market/compare/?crop=${crop}${state ? `&state=${state}` : ''}`;
      const res = await api.get(url);
      setComparisonData(res.data);

      if (res.data?.best_market_opportunity) {
        setSelectedMandiPrice(res.data.best_market_opportunity.modal_price);
        setSelectedMandiName(res.data.best_market_opportunity.mandi);
      }
    } catch (err) {
      console.error("Market data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketComparison(selectedCrop, selectedState);
  }, [selectedCrop, selectedState]);

  // Calculate gross revenue
  useEffect(() => {
    const quintals = productionTonnes * 10.0;
    const gross = quintals * selectedMandiPrice;
    setRevenueResult({
      production_tonnes: productionTonnes,
      production_quintals: quintals,
      modal_price: selectedMandiPrice,
      gross_revenue: gross,
      formatted: `₹${gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    });
  }, [productionTonnes, selectedMandiPrice]);

  const chartData = comparisonData?.comparison?.map((c) => ({
    mandi: c.mandi.replace(' APMC', '').slice(0, 15),
    price: c.modal_price
  })) || [];

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Live AGMARKNET Mandi Price Feeds
          </span>
          <span className="text-xs font-semibold text-gray-500">
            Official APMC Mandi Market Prices (Govt. of India)
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#174C32] mt-2">
          Agricultural Market Price Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
          Compare real-time modal prices across regional APMC mandis and estimate gross harvest revenue based on predicted yields.
        </p>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Crop Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-xl">
          {crops.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCrop(c.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCrop === c.name
                  ? 'bg-[#174C32] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* State Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#174C32]"
          >
            <option value="">All Supported States</option>
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 text-xs">
          Loading AGMARKNET mandi feeds for {selectedCrop}...
        </div>
      ) : (
        <>
          {/* Best Market Opportunity Banner */}
          {comparisonData?.best_market_opportunity && (
            <div className="bg-gradient-to-r from-emerald-900 to-[#174C32] rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-700">
                  Top Price Realization Opportunity
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {comparisonData.best_market_opportunity.mandi}
                </h3>
                <p className="text-xs text-emerald-100/90 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{comparisonData.best_market_opportunity.district}, {comparisonData.best_market_opportunity.state}</span>
                  <span>•</span>
                  <span>Arrivals: {comparisonData.best_market_opportunity.arrivals_tonnes} Tonnes</span>
                </p>
              </div>

              <div className="text-right bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="text-[11px] text-emerald-200 block uppercase font-medium">Highest Modal Rate</span>
                <span className="text-3xl font-black text-white">
                  ₹{comparisonData.best_market_opportunity.modal_price.toLocaleString()}/Q
                </span>
                <span className="text-[10px] text-emerald-300 block mt-0.5">
                  Min: ₹{comparisonData.best_market_opportunity.min_price} • Max: ₹{comparisonData.best_market_opportunity.max_price}
                </span>
              </div>
            </div>
          )}

          {/* Grid: Mandi Comparison Table & Price Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Comparison Table (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  APMC Mandi Rates for {selectedCrop} ({comparisonData?.markets_compared_count} Markets)
                </h3>
                <span className="text-[11px] font-mono text-gray-500">
                  {comparisonData?.date}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F8F5] text-gray-600 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Mandi Market</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Modal Price</th>
                      <th className="p-3">Min - Max</th>
                      <th className="p-3 rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comparisonData?.comparison?.map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 font-bold text-gray-900">{m.mandi}</td>
                        <td className="p-3 text-gray-600">{m.district}, {m.state}</td>
                        <td className="p-3 font-extrabold text-[#174C32]">₹{m.modal_price}/Q</td>
                        <td className="p-3 text-gray-500 text-[11px]">₹{m.min_price} - ₹{m.max_price}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedMandiName(m.mandi);
                              setSelectedMandiPrice(m.modal_price);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-[11px] transition-colors"
                          >
                            Select for Revenue
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spatial Price Comparison Bar Chart (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Spatial Modal Price Spread</h3>
                <span className="text-[11px] text-gray-500 font-mono">₹ / Quintal</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="mandi" angle={-25} textAnchor="end" tick={{ fontSize: 9 }} interval={0} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" domain={['dataMin - 500', 'dataMax + 200']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val) => [`₹${val}/Q`, 'Modal Rate']}
                    />
                    <Bar dataKey="price" fill="#2E8B57" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Gross Revenue Estimator Module */}
          <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-2xs space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Estimated Gross Harvest Revenue Calculator</h3>
                <p className="text-xs text-gray-500">
                  Estimated Gross Revenue = Predicted Production (Tonnes) × 10 × Selected APMC Modal Price (₹/Q)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expected Production (Tonnes)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={productionTonnes}
                  onChange={(e) => setProductionTonnes(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  = {(productionTonnes * 10).toFixed(1)} Quintals
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Selected Target APMC Mandi
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedMandiName} (₹${selectedMandiPrice}/Q)`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-semibold"
                />
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  Click 'Select for Revenue' in table above to change
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center space-y-1">
                <span className="text-xs text-amber-800 font-semibold block uppercase">
                  Estimated Gross Revenue
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-950 block">
                  {revenueResult?.formatted}
                </span>
                <span className="text-[10px] text-amber-700 block">
                  ({selectedCrop} at {selectedMandiName})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F8F5] border border-gray-200 text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-700">Important Disclaimer:</strong> Estimated gross revenue is an indicative calculation based on selected APMC modal price; actual market realisations vary with crop grade, moisture content, clean weight deductions, and dynamic auction bids.
            </div>
          </div>

        </>
      )}

    </div>
  );
}
