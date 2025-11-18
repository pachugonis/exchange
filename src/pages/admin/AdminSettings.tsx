import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Save, Wallet, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettings: React.FC = () => {
  const { isAuthenticated, settings, updateSettings, updatePaymentAddress, updateCommission } = useAdminStore();
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSaveCommission = () => {
    updateCommission(localSettings.commission);
    toast.success('Комиссия обновлена');
  };

  const handleSaveAddress = (currencyCode: string) => {
    const address = localSettings.paymentAddresses[currencyCode];
    if (address) {
      updatePaymentAddress(currencyCode, address);
      toast.success(`Адрес ${currencyCode} обновлен`);
    }
  };

  const handleSaveAllSettings = () => {
    updateSettings(localSettings);
    toast.success('Все настройки сохранены');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Настройки</h1>
        <p className="text-dark-600 dark:text-dark-400">
          Управление комиссиями и платежными адресами
        </p>
      </div>

      {/* Commission Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Percent className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold">Комиссия обмена</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Текущая комиссия (%)
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
              Диапазон: {(localSettings.minCommission * 100).toFixed(1)}% - {(localSettings.maxCommission * 100).toFixed(1)}%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Минимальная комиссия (%)
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
              Максимальная комиссия (%)
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
          <Save className="w-4 h-4" /> Сохранить комиссию
        </Button>
      </Card>

      {/* Payment Addresses */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold">Адреса для оплаты</h2>
        </div>

        <div className="space-y-6">
          {Object.entries(localSettings.paymentAddresses).map(([currencyCode, address]) => (
            <div key={currencyCode}>
              <label className="block text-sm font-medium mb-2">
                {currencyCode} Адрес
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={address}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      paymentAddresses: {
                        ...localSettings.paymentAddresses,
                        [currencyCode]: e.target.value,
                      },
                    })
                  }
                  placeholder={`Введите ${currencyCode} адрес`}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => handleSaveAddress(currencyCode)}
                  variant="outline"
                  className="gap-2 whitespace-nowrap"
                >
                  <Save className="w-4 h-4" /> Сохранить
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* General Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">Общие настройки</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email поддержки
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
              Telegram поддержки
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
              Порог автоподтверждения ($)
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
              Заявки на сумму ниже этого порога будут подтверждаться автоматически
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
              Режим технического обслуживания
            </label>
          </div>
        </div>

        <Button onClick={handleSaveAllSettings} size="lg" className="mt-6 gap-2">
          <Save className="w-4 h-4" /> Сохранить все настройки
        </Button>
      </Card>
    </div>
  );
};
