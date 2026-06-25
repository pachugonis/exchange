import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { Home } from './pages/Home';
import { Exchange } from './pages/Exchange';
import { About, FAQ } from './pages/Info';
import { Rules, Reviews, Contact } from './pages/Additional';
import { OrderTracking } from './pages/OrderTracking';
import { NotFound } from './pages/NotFound';
import { UserLogin, UserRegister, UserDashboard, UserSettings, UserKYC, ForgotPassword, ResetPassword, VerifyEmail } from './pages/user';
import { MaintenancePage } from './pages/MaintenancePage';
import { LicenseLockedPage } from './pages/LicenseLockedPage';
import { fetchLicenseState, type LicenseState } from './api/license';
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
import { useThemeStore } from './store/themeStore';
import { useAdminStore } from './store/adminStore';
import { useSiteSettingsStore } from './store/siteSettingsStore';
import { usePaymentTracking } from './hooks/usePaymentTracking';

function App() {
  const { theme } = useThemeStore();
  const { settings, isAuthenticated: isAdminAuthenticated } = useAdminStore();
  const { settings: siteSettings } = useSiteSettingsStore();

  // Отслеживание оплаты по блокчейну и авто-отмена просроченных заявок
  usePaymentTracking();

  // Контроль лицензии: при отзыве/истечении сайт блокируется заглушкой.
  // При недоступности бэкенда не блокируем (locked становится true только
  // по явному ответу сервера), чтобы не ронять сайт из-за временного сбоя.
  const [license, setLicense] = useState<LicenseState | null>(null);
  useEffect(() => {
    let active = true;
    const check = () => {
      fetchLicenseState()
        .then((s) => { if (active) setLicense(s); })
        .catch(() => { /* бэкенд недоступен — не блокируем */ });
    };
    check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    // Apply theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Применяем favicon, заданный в админке (Настройки сайта → Идентичность).
  useEffect(() => {
    const head = document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (siteSettings.siteFavicon) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        head.appendChild(link);
      }
      link.href = siteSettings.siteFavicon;
      link.removeAttribute('type');
    }
  }, [siteSettings.siteFavicon]);

  // Check if maintenance mode is enabled and user is not admin
  const isMaintenanceMode = settings.maintenanceMode && !isAdminAuthenticated;

  // Лицензия отозвана/истекла — перекрываем всё приложение заглушкой с причиной.
  if (license?.locked) {
    return <LicenseLockedPage state={license} />;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      {isMaintenanceMode ? (
        /* Show maintenance page for non-admin users when maintenance mode is on */
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<MaintenancePage />} />
        </Routes>
      ) : (
        /* Normal application routes */
        <>
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
          </Route>

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
                    <Route path="*" element={<NotFound />} />
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
