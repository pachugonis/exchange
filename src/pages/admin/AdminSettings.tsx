import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Save, Percent, Mail, Server, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettings: React.FC = () => {
  const { isAuthenticated, settings, updateSettings, updatePaymentAddress, updateCommission } = useAdminStore();
  const { t } = useTranslation();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSaveCommission = () => {
    updateCommission(localSettings.commission);
    toast.success(t('admin.settings.messages.commissionUpdated'));
  };

  const handleSaveAllSettings = () => {
    updateSettings(localSettings);
    toast.success(t('admin.settings.messages.allSaved'));
  };

  const handleTestSmtp = async () => {
    if (!localSettings.smtpEnabled) {
      toast.error(t('admin.settings.smtp.enableFirst'));
      return;
    }

    if (!localSettings.smtpHost || !localSettings.smtpUser) {
      toast.error(t('admin.settings.smtp.fillRequired'));
      return;
    }

    toast.success(t('admin.settings.messages.smtpSaved'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('admin.settings.title')}</h1>
        <p className="text-dark-600 dark:text-dark-400">
          {t('admin.settings.subtitle')}
        </p>
      </div>

      {/* Commission Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Percent className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold">{t('admin.settings.commission.title')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.settings.commission.current')}
            </label>
            <Input
              type="number"
              step="0.001"
              min={localSettings.minCommission * 100}
              max={localSettings.maxCommission * 100}
              value={(localSettings.commission * 100).toFixed(2)}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  commission: parseFloat(e.target.value) / 100,
                })
              }
            />
            <p className="text-xs text-dark-500 mt-1">
              {t('admin.settings.commission.range')} {(localSettings.minCommission * 100).toFixed(1)}% - {(localSettings.maxCommission * 100).toFixed(1)}%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.settings.commission.minimum')}
            </label>
            <Input
              type="number"
              step="0.001"
              value={(localSettings.minCommission * 100).toFixed(2)}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  minCommission: parseFloat(e.target.value) / 100,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.settings.commission.maximum')}
            </label>
            <Input
              type="number"
              step="0.001"
              value={(localSettings.maxCommission * 100).toFixed(2)}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  maxCommission: parseFloat(e.target.value) / 100,
                })
              }
            />
          </div>
        </div>

        <Button onClick={handleSaveCommission} className="mt-4 gap-2">
          <Save className="w-4 h-4" /> {t('admin.settings.commission.save')}
        </Button>
      </Card>

      {/* General Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">{t('admin.settings.general.title')}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.settings.general.supportEmail')}
            </label>
            <Input
              type="email"
              value={localSettings.supportEmail}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  supportEmail: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.settings.general.supportTelegram')}
            </label>
            <Input
              type="text"
              value={localSettings.supportTelegram}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  supportTelegram: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.settings.general.autoConfirmThreshold')}
            </label>
            <Input
              type="number"
              value={localSettings.autoConfirmThreshold}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  autoConfirmThreshold: parseFloat(e.target.value),
                })
              }
            />
            <p className="text-xs text-dark-500 mt-1">
              {t('admin.settings.general.autoConfirmNote')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="maintenance"
              checked={localSettings.maintenanceMode}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  maintenanceMode: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <label htmlFor="maintenance" className="text-sm font-medium cursor-pointer">
              {t('admin.settings.general.maintenanceMode')}
            </label>
          </div>
        </div>

        <Button onClick={handleSaveAllSettings} size="lg" className="mt-6 gap-2">
          <Save className="w-4 h-4" /> {t('admin.settings.general.save')}
        </Button>
      </Card>

      {/* SMTP Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold">{t('admin.settings.smtp.title')}</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
            <input
              type="checkbox"
              id="smtpEnabled"
              checked={localSettings.smtpEnabled}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  smtpEnabled: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <label htmlFor="smtpEnabled" className="text-sm font-medium cursor-pointer">
              {t('admin.settings.smtp.enabled')}
            </label>
          </div>

          {localSettings.smtpEnabled && (
            <div className="space-y-4 p-4 border border-dark-200 dark:border-dark-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.settings.smtp.host')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder={t('admin.settings.smtp.hostPlaceholder')}
                    value={localSettings.smtpHost}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        smtpHost: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    {t('admin.settings.smtp.hostNote')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.settings.smtp.port')}
                  </label>
                  <Input
                    type="number"
                    value={localSettings.smtpPort}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        smtpPort: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    {t('admin.settings.smtp.portNote')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={localSettings.smtpSecure}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      smtpSecure: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="smtpSecure" className="text-sm cursor-pointer">
                  {t('admin.settings.smtp.secure')}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.settings.smtp.user')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder={t('admin.settings.smtp.userPlaceholder')}
                    value={localSettings.smtpUser}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        smtpUser: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.settings.smtp.password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showSmtpPassword ? 'text' : 'password'}
                      placeholder={t('admin.settings.smtp.passwordPlaceholder')}
                      value={localSettings.smtpPassword}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          smtpPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                    >
                      {showSmtpPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.settings.smtp.fromEmail')}
                  </label>
                  <Input
                    type="email"
                    placeholder={t('admin.settings.smtp.fromEmailPlaceholder')}
                    value={localSettings.smtpFromEmail}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        smtpFromEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.settings.smtp.fromName')}
                  </label>
                  <Input
                    type="text"
                    placeholder={t('admin.settings.smtp.fromNamePlaceholder')}
                    value={localSettings.smtpFromName}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        smtpFromName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleTestSmtp} variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  {t('admin.settings.smtp.test')}
                </Button>
                <Button onClick={handleSaveAllSettings} className="gap-2">
                  <Save className="w-4 h-4" />
                  {t('admin.settings.smtp.save')}
                </Button>
              </div>
            </div>
          )}

          {!localSettings.smtpEnabled && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>{t('common.messages.warning')}</strong> {t('admin.settings.smtp.disabledWarning')}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
