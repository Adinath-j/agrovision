import React, { useState, useEffect } from 'react';
import { UserCircle, ShieldCheck, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

export default function ProfilePage() {
  const { user, refreshUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    preferred_language: 'en',
    state: '',
    district: '',
    village: '',
    experience_years: 1,
    total_land_area_hectares: 1.0,
    has_soil_health_card: false,
    soil_health_card_number: '',
    pm_kisan_registered: false,
    preferred_mandi: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        preferred_language: user.preferred_language || 'en',
        state: user.state || '',
        district: user.district || '',
        village: user.village || '',
        experience_years: user.farmer_profile?.experience_years || 2,
        total_land_area_hectares: user.farmer_profile?.total_land_area_hectares || 2.0,
        has_soil_health_card: user.farmer_profile?.has_soil_health_card || false,
        soil_health_card_number: user.farmer_profile?.soil_health_card_number || '',
        pm_kisan_registered: user.farmer_profile?.pm_kisan_registered || false,
        preferred_mandi: user.farmer_profile?.preferred_mandi || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      // Update User fields
      await authService.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        preferred_language: formData.preferred_language,
        state: formData.state,
        district: formData.district,
        village: formData.village,
      });

      // Update Farmer Profile fields
      await authService.updateFarmerProfile({
        experience_years: parseInt(formData.experience_years),
        total_land_area_hectares: parseFloat(formData.total_land_area_hectares),
        has_soil_health_card: formData.has_soil_health_card,
        soil_health_card_number: formData.soil_health_card_number,
        pm_kisan_registered: formData.pm_kisan_registered,
        preferred_mandi: formData.preferred_mandi,
      });

      await refreshUserProfile();
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-extrabold text-[#174C32]">Farmer Profile & Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your personal identity, PM-KISAN registration, and Soil Health Card records
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-2xs space-y-8">
        
        {/* User Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
            1. Identity & Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Village</label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
            </div>
          </div>
        </div>

        {/* Farmer Specific Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
            2. Farming Details & Government Schemes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred APMC Mandi</label>
              <input
                type="text"
                value={formData.preferred_mandi}
                onChange={(e) => setFormData({ ...formData, preferred_mandi: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                placeholder="e.g. Nashik APMC"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pm_kisan"
                checked={formData.pm_kisan_registered}
                onChange={(e) => setFormData({ ...formData, pm_kisan_registered: e.target.checked })}
                className="w-4 h-4 rounded text-[#174C32] focus:ring-[#174C32]"
              />
              <label htmlFor="pm_kisan" className="text-xs font-semibold text-gray-800">
                Registered under PM-KISAN Samman Nidhi
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="soil_card"
                checked={formData.has_soil_health_card}
                onChange={(e) => setFormData({ ...formData, has_soil_health_card: e.target.checked })}
                className="w-4 h-4 rounded text-[#174C32] focus:ring-[#174C32]"
              />
              <label htmlFor="soil_card" className="text-xs font-semibold text-gray-800">
                Holder of Government Soil Health Card
              </label>
            </div>

            {formData.has_soil_health_card && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Soil Health Card Number
                </label>
                <input
                  type="text"
                  value={formData.soil_health_card_number}
                  onChange={(e) => setFormData({ ...formData, soil_health_card_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32]"
                  placeholder="e.g. MH-NSK-2024-8841"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#174C32] text-white hover:bg-[#1E6240] text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
