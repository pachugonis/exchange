import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Settings, Image as ImageIcon, Save, RotateCcw, Plus, Trash2, Palette } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { useAdminStore } from '../../store/adminStore';
import { useSiteSettingsStore } from '../../store/siteSettingsStore';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

export const AdminSiteSettings: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { settings, updateSettings, addFooterBanner, updateFooterBanner, deleteFooterBanner, resetToDefaults } = useSiteSettingsStore();
  const { t } = useTranslation();
  const [localSettings, setLocalSettings] = useState(settings);
  const [newBanner, setNewBanner] = useState({ image: '', link: '', title: '' });
  const [showBannerForm, setShowBannerForm] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logo = event.target?.result as string;
        setLocalSettings({ ...localSettings, siteLogo: logo });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>, bannerId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const image = event.target?.result as string;
        if (bannerId) {
          updateFooterBanner(bannerId, { image });
          toast.success(t('admin.siteSettings.messages.bannerImageUpdated'));
        } else {
          setNewBanner({ ...newBanner, image });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success(t('admin.siteSettings.messages.settingsSaved'));
  };

  const handleReset = () => {
    if (confirm(t('admin.siteSettings.messages.confirmReset'))) {
      resetToDefaults();
      setLocalSettings(settings);
      toast.success(t('admin.siteSettings.messages.settingsReset'));
    }
  };

  const handleAddBanner = () => {
    if (!newBanner.image || !newBanner.title) {
      toast.error(t('admin.siteSettings.messages.fillRequired'));
      return;
    }
    addFooterBanner(newBanner);
    setNewBanner({ image: '', link: '', title: '' });
    setShowBannerForm(false);
    toast.success(t('admin.siteSettings.messages.bannerAdded'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('admin.siteSettings.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('admin.siteSettings.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('admin.siteSettings.reset')}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            {t('admin.siteSettings.save')}
          </Button>
        </div>
      </div>

      {/* Design Variant Selection */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t('admin.siteSettings.designVariant.title')}
        </h2>
        <p className="text-sm text-dark-600 dark:text-dark-400 mb-4">
          {t('admin.siteSettings.designVariant.description')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setLocalSettings({ ...localSettings, designVariant: 'default' })}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              localSettings.designVariant === 'default'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-dark-300 dark:border-dark-600 hover:border-primary-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="designVariant"
                value="default"
                checked={localSettings.designVariant === 'default'}
                onChange={() => setLocalSettings({ ...localSettings, designVariant: 'default' })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold mb-1">{t('admin.siteSettings.designVariant.default')}</div>
                <div className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                  {t('admin.siteSettings.designVariant.defaultDesc')}
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600"></div>
                  <div className="w-8 h-8 rounded bg-blue-500"></div>
                  <div className="w-8 h-8 rounded bg-purple-600"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div
            onClick={() => setLocalSettings({ ...localSettings, designVariant: 'alternative' })}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              localSettings.designVariant === 'alternative'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-dark-300 dark:border-dark-600 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="designVariant"
                value="alternative"
                checked={localSettings.designVariant === 'alternative'}
                onChange={() => setLocalSettings({ ...localSettings, designVariant: 'alternative' })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold mb-1">{t('admin.siteSettings.designVariant.alternative')}</div>
                <div className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                  {t('admin.siteSettings.designVariant.alternativeDesc')}
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-500"></div>
                  <div className="w-8 h-8 rounded bg-emerald-500"></div>
                  <div className="w-8 h-8 rounded bg-amber-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Site Identity */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {t('admin.siteSettings.identity.title')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.identity.siteName')}</label>
            <Input
              value={localSettings.siteName}
              onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
              placeholder="ExchangeKit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.identity.logo')}</label>
            {localSettings.siteLogo && (
              <div className="mb-2">
                <img
                  src={localSettings.siteLogo}
                  alt="Logo"
                  className="h-12 object-contain"
                />
              </div>
            )}
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="px-4 py-2 bg-dark-100 dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-600 transition text-center">
                  <ImageIcon className="w-5 h-5 inline-block mr-2" />
                  {t('admin.siteSettings.identity.uploadLogo')}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {localSettings.siteLogo && (
                <Button
                  variant="outline"
                  onClick={() => setLocalSettings({ ...localSettings, siteLogo: null })}
                >
                  {t('admin.siteSettings.identity.remove')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Hero Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">{t('admin.siteSettings.hero.title')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.hero.heroTitle')}</label>
            <Input
              value={localSettings.heroTitle}
              onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.hero.heroSubtitle')}</label>
            <textarea
              value={localSettings.heroSubtitle}
              onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Stats Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('admin.siteSettings.stats.title')}</h2>
          <Toggle
            checked={localSettings.showStats}
            onChange={(checked) => setLocalSettings({ ...localSettings, showStats: checked })}
            label={localSettings.showStats ? t('admin.siteSettings.stats.show') : t('admin.siteSettings.stats.hide')}
          />
        </div>
        
        {localSettings.showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.stats.value')} 1</label>
              <Input
                value={localSettings.stat1Value}
                onChange={(e) => setLocalSettings({ ...localSettings, stat1Value: e.target.value })}
              />
              <label className="block text-sm font-medium mt-2 mb-2">{t('admin.siteSettings.stats.label')} 1</label>
              <Input
                value={localSettings.stat1Label}
                onChange={(e) => setLocalSettings({ ...localSettings, stat1Label: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.stats.value')} 2</label>
              <Input
                value={localSettings.stat2Value}
                onChange={(e) => setLocalSettings({ ...localSettings, stat2Value: e.target.value })}
              />
              <label className="block text-sm font-medium mt-2 mb-2">{t('admin.siteSettings.stats.label')} 2</label>
              <Input
                value={localSettings.stat2Label}
                onChange={(e) => setLocalSettings({ ...localSettings, stat2Label: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.stats.value')} 3</label>
              <Input
                value={localSettings.stat3Value}
                onChange={(e) => setLocalSettings({ ...localSettings, stat3Value: e.target.value })}
              />
              <label className="block text-sm font-medium mt-2 mb-2">{t('admin.siteSettings.stats.label')} 3</label>
              <Input
                value={localSettings.stat3Label}
                onChange={(e) => setLocalSettings({ ...localSettings, stat3Label: e.target.value })}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Features Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('admin.siteSettings.features.title')}</h2>
          <Toggle
            checked={localSettings.showFeatures}
            onChange={(checked) => setLocalSettings({ ...localSettings, showFeatures: checked })}
            label={localSettings.showFeatures ? t('admin.siteSettings.features.show') : t('admin.siteSettings.features.hide')}
          />
        </div>
        
        {localSettings.showFeatures && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="space-y-2">
                <label className="block text-sm font-medium">{t('admin.siteSettings.features.featureTitle').replace('{num}', String(num))}</label>
                <Input
                  value={localSettings[`feature${num}Title` as keyof typeof localSettings] as string}
                  onChange={(e) => setLocalSettings({ ...localSettings, [`feature${num}Title`]: e.target.value })}
                />
                <label className="block text-sm font-medium">{t('admin.siteSettings.features.featureDescription').replace('{num}', String(num))}</label>
                <Input
                  value={localSettings[`feature${num}Description` as keyof typeof localSettings] as string}
                  onChange={(e) => setLocalSettings({ ...localSettings, [`feature${num}Description`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Other Sections Visibility */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">{t('admin.siteSettings.visibility.title')}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>{t('admin.siteSettings.visibility.cryptoRates')}</span>
            <Toggle
              checked={localSettings.showCryptoRates}
              onChange={(checked) => setLocalSettings({ ...localSettings, showCryptoRates: checked })}
            />
          </div>
          
          {localSettings.showCryptoRates && (
            <div className="ml-8 mt-2">
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.visibility.cryptoRatesTitle')}</label>
              <Input
                value={localSettings.cryptoRatesTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, cryptoRatesTitle: e.target.value })}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>{t('admin.siteSettings.visibility.cta')}</span>
            <Toggle
              checked={localSettings.showCTA}
              onChange={(checked) => setLocalSettings({ ...localSettings, showCTA: checked })}
            />
          </div>
          
          {localSettings.showCTA && (
            <div className="ml-8 mt-2 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.visibility.ctaTitle')}</label>
                <Input
                  value={localSettings.ctaTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, ctaTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.visibility.ctaDescription')}</label>
                <Input
                  value={localSettings.ctaDescription}
                  onChange={(e) => setLocalSettings({ ...localSettings, ctaDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.visibility.ctaButtonText')}</label>
                <Input
                  value={localSettings.ctaButtonText}
                  onChange={(e) => setLocalSettings({ ...localSettings, ctaButtonText: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>{t('admin.siteSettings.visibility.popularDirections')}</span>
            <Toggle
              checked={localSettings.showPopularDirections}
              onChange={(checked) => setLocalSettings({ ...localSettings, showPopularDirections: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span>{t('admin.siteSettings.visibility.exchangeSteps')}</span>
            <Toggle
              checked={localSettings.showExchangeSteps}
              onChange={(checked) => setLocalSettings({ ...localSettings, showExchangeSteps: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span>{t('admin.siteSettings.visibility.testimonials')}</span>
            <Toggle
              checked={localSettings.showTestimonials}
              onChange={(checked) => setLocalSettings({ ...localSettings, showTestimonials: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Footer Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">{t('admin.siteSettings.footer.title')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.footer.description')}</label>
            <Input
              value={localSettings.footerDescription}
              onChange={(e) => setLocalSettings({ ...localSettings, footerDescription: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.footer.email')}</label>
              <Input
                value={localSettings.footerEmail}
                onChange={(e) => setLocalSettings({ ...localSettings, footerEmail: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.footer.telegram')}</label>
              <Input
                value={localSettings.footerTelegram}
                onChange={(e) => setLocalSettings({ ...localSettings, footerTelegram: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.footer.copyright')}</label>
            <Input
              value={localSettings.footerCopyright}
              onChange={(e) => setLocalSettings({ ...localSettings, footerCopyright: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Footer Banners */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('admin.siteSettings.banners.title')}</h2>
          <Button onClick={() => setShowBannerForm(!showBannerForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('admin.siteSettings.banners.addBanner')}
          </Button>
        </div>

        {showBannerForm && (
          <div className="mb-4 p-4 bg-dark-50 dark:bg-dark-700 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.banners.bannerName')} *</label>
              <Input
                value={newBanner.title}
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                placeholder={t('admin.siteSettings.banners.bannerNamePlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.banners.link')}</label>
              <Input
                value={newBanner.link}
                onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                placeholder={t('admin.siteSettings.banners.linkPlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteSettings.banners.image')} *</label>
              {newBanner.image && (
                <div className="mb-2">
                  <img src={newBanner.image} alt="Preview" className="h-[31px] w-[88px] object-cover border border-dark-300 dark:border-dark-600 rounded" />
                </div>
              )}
              <label className="cursor-pointer block">
                <div className="px-4 py-2 bg-dark-100 dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-600 transition text-center">
                  <ImageIcon className="w-5 h-5 inline-block mr-2" />
                  {t('admin.siteSettings.banners.uploadImage')}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBannerImageUpload(e)}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddBanner}>{t('admin.siteSettings.banners.add')}</Button>
              <Button variant="outline" onClick={() => {
                setShowBannerForm(false);
                setNewBanner({ image: '', link: '', title: '' });
              }}>
                {t('admin.siteSettings.banners.cancel')}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.footerBanners.map((banner) => (
            <div key={banner.id} className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <img src={banner.image} alt={banner.title} className="h-[31px] w-[88px] object-cover border border-dark-300 dark:border-dark-600 rounded" />
                <div className="flex-1">
                  <div className="font-medium">{banner.title}</div>
                  {banner.link && (
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline">
                      {banner.link}
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-3 py-1 text-sm bg-dark-100 dark:bg-dark-600 border border-dark-300 dark:border-dark-500 rounded hover:bg-dark-200 dark:hover:bg-dark-500 transition text-center">
                    {t('admin.siteSettings.banners.changeImage')}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerImageUpload(e, banner.id)}
                    className="hidden"
                  />
                </label>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(t('admin.siteSettings.messages.confirmDeleteBanner'))) {
                      deleteFooterBanner(banner.id);
                      toast.success(t('admin.siteSettings.messages.bannerDeleted'));
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {settings.footerBanners.length === 0 && !showBannerForm && (
          <p className="text-center text-dark-500 py-8">{t('admin.siteSettings.banners.noBanners')}</p>
        )}
      </Card>
    </div>
  );
};
