import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Wheat,
  TrendingUp,
  Activity,
  Satellite,
  ScanEye,
  Store,
  CloudSun,
  BotMessageSquare,
  Sparkles,
  FileSpreadsheet,
  UserCircle,
  Sprout,
  X,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'My Farms', path: '/dashboard/farms', icon: MapPin },
    { name: 'Crop & Season Master', path: '/dashboard/crops', icon: Wheat },
    { header: 'Prediction Engines' },
    { name: 'Pre-Sowing Prediction', path: '/dashboard/pre-sowing', icon: TrendingUp },
    { name: 'In-Season Yield Update', path: '/dashboard/in-season', icon: Activity },
    { name: 'Satellite Monitoring', path: '/dashboard/monitoring', icon: Satellite },
    { header: 'Advisory & Intelligence' },
    { name: 'Crop Disease Scan', path: '/dashboard/disease', icon: ScanEye },
    { name: 'Mandi Market Prices', path: '/dashboard/market', icon: Store },
    { name: 'Weather Alerts', path: '/dashboard/weather', icon: CloudSun },
    { name: 'AI Farming Assistant', path: '/dashboard/assistant', icon: BotMessageSquare },
    { name: 'Optimization Engine', path: '/dashboard/optimization', icon: Sparkles },
    { header: 'Account & Reports' },
    { name: 'Analytical Reports', path: '/dashboard/reports', icon: FileSpreadsheet },
    { name: 'Farmer Profile', path: '/dashboard/profile', icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#174C32] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-emerald-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Sprout className="w-6 h-6 text-[#174C32]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">AGROVISION</span>
              <span className="block text-[10px] text-emerald-300 font-medium">Farmer Decision Portal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {navItems.map((item, index) => {
            if (item.header) {
              return (
                <div
                  key={index}
                  className="pt-4 pb-1 px-3 text-[11px] font-semibold tracking-wider text-emerald-300/80 uppercase"
                >
                  {item.header}
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#174C32] shadow-sm font-semibold'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#174C32]' : 'text-emerald-300'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#174C32]" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
          <div className="flex items-center justify-between text-xs text-emerald-200/80">
            <span>Project SIH25044</span>
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-[10px] text-emerald-100 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
