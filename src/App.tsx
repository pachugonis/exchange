import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { Home } from './pages/Home';
import { Exchange } from './pages/Exchange';
import { About, FAQ } from './pages/Info';
import { Rules, Reviews, Contact } from './pages/Additional';
import { OrderTracking } from './pages/OrderTracking';
import { UserLogin, UserRegister, UserDashboard, UserSettings } from './pages/user';
import { MaintenancePage } from './pages/MaintenancePage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminCurrencies } from './pages/admin/AdminCurrencies';
import { AdminPromos } from './pages/admin/AdminPromos';
import { AdminContent } from './pages/admin/AdminContent';
import { useThemeStore } from './store/themeStore';
import { useAdminStore } from './store/adminStore';

function App() {
  const { theme } = useThemeStore();
  const { settings, isAuthenticated: isAdminAuthenticated } = useAdminStore();

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

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      
      {/* Show maintenance page for non-admin users when maintenance mode is on */}
      {isMaintenanceMode ? (
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<MaintenancePage />} />
        </Routes>
      ) : (
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="currencies" element={<AdminCurrencies />} />
            <Route path="promos" element={<AdminPromos />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* User Cabinet Routes */}
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/settings" element={<UserSettings />} />

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
      )}
    </BrowserRouter>
  );
}

export default App;
