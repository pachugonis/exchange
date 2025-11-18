import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const variantConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-900 dark:text-blue-100',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-500',
    textColor: 'text-green-900 dark:text-green-100',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
    textColor: 'text-yellow-900 dark:text-yellow-100',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    textColor: 'text-red-900 dark:text-red-100',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  onClose,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className={`flex-1 ${config.textColor}`}>
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${config.iconColor} hover:opacity-70 transition`}
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
