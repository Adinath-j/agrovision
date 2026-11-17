import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Dashboard Pages
import DashboardOverview from './pages/dashboard/DashboardOverview';
import FarmsListPage from './pages/dashboard/FarmsListPage';
import AddFarmPage from './pages/dashboard/AddFarmPage';
import CropsCatalogPage from './pages/dashboard/CropsCatalogPage';
import PreSowingPreviewPage from './pages/dashboard/PreSowingPreviewPage';
import InSeasonPreviewPage from './pages/dashboard/InSeasonPreviewPage';
import SatellitePreviewPage from './pages/dashboard/SatellitePreviewPage';
import DiseasePreviewPage from './pages/dashboard/DiseasePreviewPage';
import MarketPreviewPage from './pages/dashboard/MarketPreviewPage';
import WeatherPreviewPage from './pages/dashboard/WeatherPreviewPage';
import AssistantPreviewPage from './pages/dashboard/AssistantPreviewPage';
import OptimizationPreviewPage from './pages/dashboard/OptimizationPreviewPage';
import ReportsPreviewPage from './pages/dashboard/ReportsPreviewPage';
import ProfilePage from './pages/dashboard/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Farmer Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="farms" element={<FarmsListPage />} />
            <Route path="farms/new" element={<AddFarmPage />} />
            <Route path="crops" element={<CropsCatalogPage />} />
            <Route path="pre-sowing" element={<PreSowingPreviewPage />} />
            <Route path="in-season" element={<InSeasonPreviewPage />} />
            <Route path="monitoring" element={<SatellitePreviewPage />} />
            <Route path="disease" element={<DiseasePreviewPage />} />
            <Route path="market" element={<MarketPreviewPage />} />
            <Route path="weather" element={<WeatherPreviewPage />} />
            <Route path="assistant" element={<AssistantPreviewPage />} />
            <Route path="optimization" element={<OptimizationPreviewPage />} />
            <Route path="reports" element={<ReportsPreviewPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
