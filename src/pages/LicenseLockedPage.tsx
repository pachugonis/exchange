import React from 'react';
import { ShieldX, Lock } from 'lucide-react';
import type { LicenseState } from '../api/license';

const TITLES: Record<string, string> = {
  revoked: 'Доступ к сервису закрыт',
  expired: 'Срок лицензии истёк',
};

/**
 * Полноэкранная заглушка, когда лицензия сайта отозвана или истекла.
 * Перекрывает всё приложение (включая админку) и показывает причину.
 */
export const LicenseLockedPage: React.FC<{ state: LicenseState }> = ({ state }) => {
  const title = TITLES[state.status] ?? 'Сервис недоступен';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500/10 to-secondary-500/10 px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500 rounded-full mb-6">
            <ShieldX className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>

          <p className="text-xl text-dark-600 dark:text-dark-400">
            {state.message || 'Лицензия на использование сервиса недействительна.'}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start gap-4 text-left">
            <Lock className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Что произошло?</h3>
              <p className="text-dark-600 dark:text-dark-400 mb-4">
                Лицензия на это программное обеспечение более не действует, поэтому
                работа сервиса приостановлена. Данные не удалены.
              </p>
              <h3 className="font-semibold text-lg mb-2">Как восстановить работу?</h3>
              <p className="text-dark-600 dark:text-dark-400">
                Свяжитесь с поставщиком решения для возобновления или продления лицензии.
                После восстановления лицензии сайт заработает автоматически.
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-dark-500 dark:text-dark-400">
          <p>© {new Date().getFullYear()} ExchangeKit</p>
        </div>
      </div>
    </div>
  );
};
