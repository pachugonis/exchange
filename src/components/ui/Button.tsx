import React from 'react';
import { useDesignVariant } from '../../hooks/useDesignVariant';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const designVariant = useDesignVariant();
  
  const baseClasses = designVariant === 'alternative'
    ? 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: designVariant === 'alternative'
      ? 'bg-gradient-alternative text-emerald-900 dark:text-emerald-900 hover:opacity-90 shadow-lg shadow-emerald-500/30 hover:scale-105 dark:shadow-emerald-400/40'
      : 'bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary-500/30',
    secondary: 'bg-dark-700 dark:bg-dark-600 text-white hover:bg-dark-600 dark:hover:bg-dark-500',
    outline: designVariant === 'alternative'
      ? 'border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
      : 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-dark-800',
    ghost: 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
