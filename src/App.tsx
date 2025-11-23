import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { LicenseWarningBanner } from './components/layout/LicenseWarningBanner';
import { Home } from './pages/Home';
import { Exchange } from './pages/Exchange';
import { About, FAQ } from './pages/Info';
import { Rules, Reviews, Contact } from './pages/Additional';
import { OrderTracking } from './pages/OrderTracking';
import { UserLogin, UserRegister, UserDashboard, UserSettings, UserKYC, ForgotPassword, ResetPassword, VerifyEmail } from './pages/user';
import { MaintenancePage } from './pages/MaintenancePage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminSiteSettings } from './pages/admin/AdminSiteSettings';
import { AdminSecurity } from './pages/admin/AdminSecurity';
import { AdminCurrencies } from './pages/admin/AdminCurrencies';
import { AdminPromos } from './pages/admin/AdminPromos';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminKYC } from './pages/admin/AdminKYC';
import { AdminNewsletter } from './pages/admin/AdminNewsletter';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminLicense } from './pages/admin';
import LicenseActivation from './pages/LicenseActivation';
import { useThemeStore } from './store/themeStore';
import { useAdminStore } from './store/adminStore';
import { useLicenseStore } from './store/licenseStore';

function App() {
  const { theme } = useThemeStore();
  const { settings, isAuthenticated: isAdminAuthenticated } = useAdminStore();
  const { license, statusInfo } = useLicenseStore();

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check if maintenance mode is enabled and user is not admin
  const isMaintenanceMode = settings.maintenanceMode && !isAdminAuthenticated;
  
  // Check if license validation is required and license is not active
  const requiresLicenseActivation = !license && import.meta.env.VITE_LICENSE_ENABLE_VALIDATION !== 'false';
  
  // Check if access should be blocked due to license issues
  const isLicenseBlocked = license && !statusInfo.canAccess;

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      
      {/* Show license activation page if license is required but not present */}
      {requiresLicenseActivation ? (
        <Routes>
          <Route path="/license-activation" element={<LicenseActivation />} />
          <Route path="*" element={<Navigate to="/license-activation" replace />} />
        </Routes>
      ) : isLicenseBlocked ? (
        /* Show license blocked page if license is invalid */
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/license-activation" element={<LicenseActivation />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
              <div className="max-w-md w-full text-center">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Blocked</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {statusInfo.status === 'expired' 
                    ? 'Your license has expired. Please renew to continue using the platform.'
                    : statusInfo.status === 'suspended'
                    ? 'Your license has been suspended. Please contact support for assistance.'
                    : statusInfo.inGracePeriod
                    ? `Grace period expired. Please restore network connection to validate your license.`
                    : 'License validation failed. Please contact support.'}
                </p>
                <div className="space-y-3">
                  {isAdminAuthenticated && (
                    <a href="/admin/license" className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View License Details
                    </a>
                  )}
                  <a href="mailto:support@4ex.com" className="block w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          } />
        </Routes>
      ) : isMaintenanceMode ? (
        /* Show maintenance page for non-admin users when maintenance mode is on */
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<MaintenancePage />} />
        </Routes>
      ) : (
        /* Normal application routes */
        <>
          <LicenseWarningBanner />
          <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="currencies" element={<AdminCurrencies />} />
            <Route path="promos" element={<AdminPromos />} />
            <Route path="kyc" element={<AdminKYC />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="site-settings" element={<AdminSiteSettings />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="license" element={<AdminLicense />} />
          </Route>
          
          {/* License Routes */}
          <Route path="/license-activation" element={<LicenseActivation />} />

          {/* User Cabinet Routes */}
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/forgot-password" element={<ForgotPassword />} />
          <Route path="/user/reset-password" element={<ResetPassword />} />
          <Route path="/user/verify-email" element={<VerifyEmail />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/settings" element={<UserSettings />} />
          <Route path="/user/kyc" element={<UserKYC />} />

          {/* Public Routes */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen flex flex-col bg-white dark:bg-dark-900">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/exchange" element={<Exchange />} />
                    <Route path="/tracking" element={<OrderTracking />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/contact" element={<Contact />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
          </Routes>
        </>
      )}
    </BrowserRouter>
  );
}

export default App;
