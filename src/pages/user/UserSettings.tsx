import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';

export const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useUserStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    telegram: user?.telegram || '',
  });

  if (!isAuthenticated || !user) {
    navigate('/user/login');
    return null;
  }

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      phone: formData.phone,
      telegram: formData.telegram,
    });
    toast.success('Профиль обновлен успешно!');
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            to="/user/dashboard"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад в кабинет
          </Link>
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Управление профилем и настройками аккаунта
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'profile', label: 'Профиль', icon: <User className="w-4 h-4" /> },
            { id: 'security', label: 'Безопасность', icon: <Mail className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        <TabPanel isActive={activeTab === 'profile'}>
          <Card>
            <h3 className="text-xl font-semibold mb-6">Информация профиля</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Имя</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    className="pl-10 bg-dark-50 dark:bg-dark-700"
                    disabled
                  />
                </div>
                <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                  Email нельзя изменить
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Телефон (опционально)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Telegram (опционально)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => handleChange('telegram', e.target.value)}
                    placeholder="@username"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Сохранить изменения
              </Button>
            </div>
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'security'}>
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-semibold mb-4">Безопасность аккаунта</h3>

              <div className="space-y-4">
                <Alert variant="info">
                  Для изменения пароля или других настроек безопасности обратитесь в
                  службу поддержки.
                </Alert>

                <div className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <h4 className="font-medium mb-2">Двухфакторная аутентификация</h4>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-3">
                    Повысьте безопасность аккаунта с помощью 2FA
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Скоро доступно
                  </Button>
                </div>

                <div className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <h4 className="font-medium mb-2">KYC Верификация</h4>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-3">
                    Пройдите верификацию для увеличения лимитов
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Скоро доступно
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
