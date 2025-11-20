import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Settings, Image as ImageIcon, Type, Eye, EyeOff, Save, RotateCcw, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { useAdminStore } from '../../store/adminStore';
import { useSiteSettingsStore } from '../../store/siteSettingsStore';
import toast from 'react-hot-toast';

export const AdminSiteSettings: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { settings, updateSettings, addFooterBanner, updateFooterBanner, deleteFooterBanner, resetToDefaults } = useSiteSettingsStore();
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
          toast.success('Изображение баннера обновлено');
        } else {
          setNewBanner({ ...newBanner, image });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Настройки сохранены');
  };

  const handleReset = () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      resetToDefaults();
      setLocalSettings(settings);
      toast.success('Настройки сброшены');
    }
  };

  const handleAddBanner = () => {
    if (!newBanner.image || !newBanner.title) {
      toast.error('Заполните обязательные поля');
      return;
    }
    addFooterBanner(newBanner);
    setNewBanner({ image: '', link: '', title: '' });
    setShowBannerForm(false);
    toast.success('Баннер добавлен');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Настройки сайта</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Управление главной страницей и внешним видом сайта
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Сохранить
          </Button>
        </div>
      </div>

      {/* Site Identity */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Идентичность сайта
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название сайта</label>
            <Input
              value={localSettings.siteName}
              onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
              placeholder="4EX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Логотип</label>
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
                  Загрузить логотип
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
                  Удалить
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Hero Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Главный экран (Hero)</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Заголовок</label>
            <Input
              value={localSettings.heroTitle}
              onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Подзаголовок</label>
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
          <h2 className="text-xl font-semibold">Секция статистики</h2>
          <Toggle
            checked={localSettings.showStats}
            onChange={(checked) => setLocalSettings({ ...localSettings, showStats: checked })}
            label={localSettings.showStats ? 'Показывать' : 'Скрыть'}
          />
        </div>
        
        {localSettings.showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Значение 1</label>
              <Input
                value={localSettings.stat1Value}
                onChange={(e) => setLocalSettings({ ...localSettings, stat1Value: e.target.value })}
              />
              <label className="block text-sm font-medium mt-2 mb-2">Текст 1</label>
              <Input
                value={localSettings.stat1Label}
                onChange={(e) => setLocalSettings({ ...localSettings, stat1Label: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Значение 2</label>
              <Input
                value={localSettings.stat2Value}
                onChange={(e) => setLocalSettings({ ...localSettings, stat2Value: e.target.value })}
              />
              <label className="block text-sm font-medium mt-2 mb-2">Текст 2</label>
              <Input
                value={localSettings.stat2Label}
                onChange={(e) => setLocalSettings({ ...localSettings, stat2Label: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Значение 3</label>
              <Input
                value={localSettings.stat3Value}
                onChange={(e) => setLocalSettings({ ...localSettings, stat3Value: e.target.value })}
              />
              <label className="block text-sm font-medium mt-2 mb-2">Текст 3</label>
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
          <h2 className="text-xl font-semibold">Преимущества</h2>
          <Toggle
            checked={localSettings.showFeatures}
            onChange={(checked) => setLocalSettings({ ...localSettings, showFeatures: checked })}
            label={localSettings.showFeatures ? 'Показывать' : 'Скрыть'}
          />
        </div>
        
        {localSettings.showFeatures && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="space-y-2">
                <label className="block text-sm font-medium">Преимущество {num} - Заголовок</label>
                <Input
                  value={localSettings[`feature${num}Title` as keyof typeof localSettings] as string}
                  onChange={(e) => setLocalSettings({ ...localSettings, [`feature${num}Title`]: e.target.value })}
                />
                <label className="block text-sm font-medium">Преимущество {num} - Описание</label>
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
        <h2 className="text-xl font-semibold mb-4">Видимость секций</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Курсы криптовалют</span>
            <Toggle
              checked={localSettings.showCryptoRates}
              onChange={(checked) => setLocalSettings({ ...localSettings, showCryptoRates: checked })}
            />
          </div>
          
          {localSettings.showCryptoRates && (
            <div className="ml-8 mt-2">
              <label className="block text-sm font-medium mb-2">Заголовок секции</label>
              <Input
                value={localSettings.cryptoRatesTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, cryptoRatesTitle: e.target.value })}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>Призыв к действию (CTA)</span>
            <Toggle
              checked={localSettings.showCTA}
              onChange={(checked) => setLocalSettings({ ...localSettings, showCTA: checked })}
            />
          </div>
          
          {localSettings.showCTA && (
            <div className="ml-8 mt-2 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-2">Заголовок</label>
                <Input
                  value={localSettings.ctaTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, ctaTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <Input
                  value={localSettings.ctaDescription}
                  onChange={(e) => setLocalSettings({ ...localSettings, ctaDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Текст кнопки</label>
                <Input
                  value={localSettings.ctaButtonText}
                  onChange={(e) => setLocalSettings({ ...localSettings, ctaButtonText: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>Популярные направления</span>
            <Toggle
              checked={localSettings.showPopularDirections}
              onChange={(checked) => setLocalSettings({ ...localSettings, showPopularDirections: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Шаги обмена</span>
            <Toggle
              checked={localSettings.showExchangeSteps}
              onChange={(checked) => setLocalSettings({ ...localSettings, showExchangeSteps: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Отзывы</span>
            <Toggle
              checked={localSettings.showTestimonials}
              onChange={(checked) => setLocalSettings({ ...localSettings, showTestimonials: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Footer Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Настройки подвала</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <Input
              value={localSettings.footerDescription}
              onChange={(e) => setLocalSettings({ ...localSettings, footerDescription: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={localSettings.footerEmail}
                onChange={(e) => setLocalSettings({ ...localSettings, footerEmail: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Telegram</label>
              <Input
                value={localSettings.footerTelegram}
                onChange={(e) => setLocalSettings({ ...localSettings, footerTelegram: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Копирайт</label>
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
          <h2 className="text-xl font-semibold">Баннеры в подвале (88x31 px)</h2>
          <Button onClick={() => setShowBannerForm(!showBannerForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Добавить баннер
          </Button>
        </div>

        {showBannerForm && (
          <div className="mb-4 p-4 bg-dark-50 dark:bg-dark-700 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Название *</label>
              <Input
                value={newBanner.title}
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                placeholder="Название баннера"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Ссылка</label>
              <Input
                value={newBanner.link}
                onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Изображение (88x31 px) *</label>
              {newBanner.image && (
                <div className="mb-2">
                  <img src={newBanner.image} alt="Preview" className="h-[31px] w-[88px] object-cover border border-dark-300 dark:border-dark-600 rounded" />
                </div>
              )}
              <label className="cursor-pointer block">
                <div className="px-4 py-2 bg-dark-100 dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-600 transition text-center">
                  <ImageIcon className="w-5 h-5 inline-block mr-2" />
                  Загрузить изображение
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
              <Button onClick={handleAddBanner}>Добавить</Button>
              <Button variant="outline" onClick={() => {
                setShowBannerForm(false);
                setNewBanner({ image: '', link: '', title: '' });
              }}>
                Отмена
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
                    Изменить изображение
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
                    if (confirm('Удалить баннер?')) {
                      deleteFooterBanner(banner.id);
                      toast.success('Баннер удален');
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
          <p className="text-center text-dark-500 py-8">Баннеры не добавлены</p>
        )}
      </Card>
    </div>
  );
};
