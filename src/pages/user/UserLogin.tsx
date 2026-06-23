import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';

export const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password }, twoFactorCode || undefined);

    setLoading(false);

    if (result.success) {
      toast.success('Вход выполнен успешно!');
      navigate('/user/dashboard');
    } else if (result.requires2FA) {
      setShow2FA(true);
    } else {
      setError(result.error || 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Вход в личный кабинет</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Войдите для доступа к своим заявкам и настройкам
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {show2FA && (
              <div>
                <label className="block text-sm font-medium mb-2">Код 2FA</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="pl-10 text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  Введите 6-значный код из приложения-аутентификатора
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-dark-600 dark:text-dark-400">
                  Запомнить меня
                </span>
              </label>
              <Link
                to="/user/forgot-password"
                className="text-primary-500 hover:text-primary-600"
              >
                Забыли пароль?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-dark-600 dark:text-dark-400">
              Нет аккаунта?{' '}
            </span>
            <Link
              to="/user/register"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Зарегистрироваться
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
