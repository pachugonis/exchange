import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useUserStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await requestPasswordReset(email);

    setLoading(false);

    if (result.success) {
      setSent(true);
      toast.success('Письмо отправлено на вашу почту!');
    } else {
      setError(result.error || 'Ошибка отправки');
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Письмо отправлено!</h2>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Мы отправили инструкции по восстановлению пароля на адрес{' '}
                <strong>{email}</strong>
              </p>
              <p className="text-sm text-dark-500 mb-6">
                Если вы не получили письмо в течение нескольких минут, проверьте папку "Спам"
              </p>
              <Link to="/user/login">
                <Button className="w-full">
                  Вернуться ко входу
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/user/login"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться ко входу
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Восстановление пароля</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Введите email, связанный с вашим аккаунтом
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить ссылку'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
