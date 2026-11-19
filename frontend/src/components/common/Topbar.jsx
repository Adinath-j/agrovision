import React from 'react';
import { Menu, Bell, User, LogOut, MapPin, Globe, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left section: mobile hamburger + current location */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium text-gray-700">
            {user?.district && user?.state ? `${user.district}, ${user.state}` : 'National Agro Portal'}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-emerald-700 font-semibold uppercase">{user?.role || 'FARMER'}</span>
        </div>
      </div>

      {/* Right section: System health, Language, User Actions */}
      <div className="flex items-center gap-3">
        {/* User Card & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 text-[#174C32] font-bold flex items-center justify-center text-sm">
              {user?.first_name ? user.first_name[0] : (user?.username?.[0] || 'F').toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {user?.farmer_profile ? `${user.farmer_profile.total_land_area_hectares} Ha Land` : 'Agro Member'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
