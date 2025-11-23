import React from 'react';
import { useDesignVariant } from '../../hooks/useDesignVariant';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const designVariant = useDesignVariant();
  
  const cardClasses = designVariant === 'alternative'
    ? 'bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-dark-200 dark:border-dark-700 p-8 transition-all hover:shadow-2xl hover:scale-[1.01]'
    : 'bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 p-6';
  
  return (
    <div
      className={`${cardClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
