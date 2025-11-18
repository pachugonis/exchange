import React from 'react';
import { Clock, CheckCircle, AlertCircle, XCircle, Loader } from 'lucide-react';
import type { OrderStatus } from '../../types/order';

interface ExchangeStatusProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  waiting_payment: {
    icon: <Clock className="w-5 h-5" />,
    label: 'Ожидает оплаты',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500/20',
  },
  payment_pending: {
    icon: <Loader className="w-5 h-5 animate-spin" />,
    label: 'Оплата обрабатывается',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500/20',
  },
  payment_received: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Оплата получена',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-500/20',
  },
  verification: {
    icon: <Loader className="w-5 h-5 animate-spin" />,
    label: 'Проверка',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500/20',
  },
  sending: {
    icon: <Loader className="w-5 h-5 animate-spin" />,
    label: 'Отправка',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500/20',
  },
  completed: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Завершен',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-500/20',
  },
  cancelled: {
    icon: <AlertCircle className="w-5 h-5" />,
    label: 'Отменен',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30 border-gray-500/20',
  },
  refund: {
    icon: <XCircle className="w-5 h-5" />,
    label: 'Возврат',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-500/20',
  },
};

export const ExchangeStatus: React.FC<ExchangeStatusProps> = ({
  status,
  className = '',
}) => {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bgColor} ${config.color} ${className}`}
    >
      {config.icon}
      <span className="font-medium">{config.label}</span>
    </div>
  );
};

interface ExchangeProgressProps {
  status: OrderStatus;
  currentStep?: number;
}

const progressSteps = [
  { id: 1, label: 'Заявка создана', statuses: ['waiting_payment'] },
  { id: 2, label: 'Средства получены', statuses: ['payment_pending', 'payment_received'] },
  { id: 3, label: 'Обработка', statuses: ['verification', 'sending'] },
  { id: 4, label: 'Отправлено', statuses: ['completed', 'cancelled', 'refund'] },
];

export const ExchangeProgress: React.FC<ExchangeProgressProps> = ({
  status,
  currentStep = 1,
}) => {
  const getStepStatus = (stepId: number): 'completed' | 'current' | 'upcoming' => {
    if (status === 'completed') return stepId <= 4 ? 'completed' : 'upcoming';
    if (status === 'refund' || status === 'cancelled') {
      return stepId < currentStep ? 'completed' : 'upcoming';
    }
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        {progressSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    stepStatus === 'completed'
                      ? 'bg-green-500 text-white'
                      : stepStatus === 'current'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-200 dark:bg-dark-700 text-dark-400'
                  }`}
                >
                  {stepStatus === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-xs mt-2 text-center ${
                    stepStatus === 'upcoming'
                      ? 'text-dark-400'
                      : 'text-dark-700 dark:text-dark-200'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < progressSteps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-dark-200 dark:bg-dark-700 relative">
                  <div
                    className={`absolute inset-0 transition-all ${
                      getStepStatus(step.id + 1) !== 'upcoming'
                        ? 'bg-green-500'
                        : ''
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
