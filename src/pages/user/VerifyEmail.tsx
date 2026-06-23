import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmailWithToken } = useUserStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('Токен не найден. Пожалуйста, используйте ссылку из письма.');
      return;
    }

    // Verify token
    verifyEmailWithToken(token).then((result) => {
      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          navigate('/user/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setError(result.error || 'Ошибка подтверждения email');
      }
    });
  }, [searchParams, verifyEmailWithToken, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center">
              <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Подтверждение email...</h2>
              <p className="text-dark-600 dark:text-dark-400">
                Пожалуйста, подождите
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Email подтвержден!</h2>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Ваш email адрес был успешно подтвержден. Сейчас вы будете перенаправлены в личный кабинет.
              </p>
              <Link to="/user/dashboard">
                <Button className="w-full">
                  Перейти в личный кабинет
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
        <Card>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ошибка подтверждения</h2>
            <p className="text-dark-600 dark:text-dark-400 mb-6">
              {error || 'Не удалось подтвердить email. Возможно, ссылка устарела.'}
            </p>
            <Link to="/user/dashboard">
              <Button className="w-full">
                Перейти в личный кабинет
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
