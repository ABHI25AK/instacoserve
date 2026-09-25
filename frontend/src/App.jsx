import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import BookingFlowPage from './pages/customer/BookingFlowPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';

// Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import EarningsPage from './pages/worker/EarningsPage';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import WorkerManagement from './pages/admin/WorkerManagement';
import DemandForecastPage from './pages/admin/DemandForecastPage';
import DisputeQueuePage from './pages/admin/DisputeQueuePage';
import WelfareFundPage from './pages/admin/WelfareFundPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Routes */}
                <Route
                  path="/customer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/book"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <BookingFlowPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Worker Routes */}
                <Route
                  path="/worker/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['worker']}>
                      <WorkerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/worker/earnings"
                  element={
                    <ProtectedRoute allowedRoles={['worker']}>
                      <EarningsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/overview"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminOverview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/workers"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <WorkerManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/forecast"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DemandForecastPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/disputes"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DisputeQueuePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/welfare"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <WelfareFundPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Global Floating Chatbot Assistant */}
            <ChatbotWidget />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
