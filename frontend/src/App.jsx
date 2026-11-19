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
import CropYieldPredictionPage from './pages/dashboard/CropYieldPredictionPage';
import InSeasonYieldPage from './pages/dashboard/InSeasonYieldPage';
import CropOptimizationPage from './pages/dashboard/CropOptimizationPage';
import WeatherAdvisoryPage from './pages/dashboard/WeatherAdvisoryPage';
import CropDiseasePage from './pages/dashboard/CropDiseasePage';
import MarketPricesPage from './pages/dashboard/MarketPricesPage';
import SatelliteMonitoringPage from './pages/dashboard/SatelliteMonitoringPage';
import FarmingAssistantPage from './pages/dashboard/FarmingAssistantPage';
import AnalyticalReportsPage from './pages/dashboard/AnalyticalReportsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
            <Route path="predictions" element={<CropYieldPredictionPage />} />
            <Route path="in-season" element={<InSeasonYieldPage />} />
            <Route path="monitoring" element={<SatelliteMonitoringPage />} />
            <Route path="disease" element={<CropDiseasePage />} />
            <Route path="market" element={<MarketPricesPage />} />
            <Route path="weather" element={<WeatherAdvisoryPage />} />
            <Route path="assistant" element={<FarmingAssistantPage />} />
            <Route path="optimization" element={<CropOptimizationPage />} />
            <Route path="reports" element={<AnalyticalReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
