import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, twoFactorEnabled } = useAdminStore();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, password, twoFactorCode || undefined);
      if (success) {
        toast.success(t('common.messages.success'));
        navigate('/admin/dashboard');
      } else {
        // Check if 2FA is enabled but code not provided
        if (twoFactorEnabled && !showTwoFactor) {
          setShowTwoFactor(true);
          toast.info(t('admin.login.twoFactorCode'));
        } else {
          toast.error(t('common.messages.error'));
        }
      }
    } catch (error) {
      toast.error(t('common.messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400 mt-2">
            {t('admin.login.title')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.login.username')}
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.login.password')}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {showTwoFactor && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.login.twoFactorCode')}
                </label>
                <Input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('admin.login.twoFactorPlaceholder')}
                  maxLength={6}
                  className="text-center text-2xl tracking-wider font-mono"
                  autoComplete="one-time-code"
                />
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('common.buttons.loading') : t('admin.login.submit')}
            </Button>

            <div className="text-xs text-center text-dark-500">
              Demo: admin / admin123
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
