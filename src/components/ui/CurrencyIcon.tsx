import React from 'react';
import type { Currency } from '../../types';

interface CurrencyIconProps {
  currency: Currency;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({
  currency,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  // Use icon image for crypto currencies if available
  if (currency.type === 'crypto' && currency.iconUrl) {
    return (
      <img
        src={currency.iconUrl}
        alt={currency.name}
        className={`${sizeClasses[size]} rounded-full ${className}`}
        onError={(e) => {
          // Fallback to text icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'block';
          }
        }}
      />
    );
  }

  // Fallback to text/emoji icon for non-crypto or if iconUrl not available
  return (
    <span className={`${textSizes[size]} ${className}`}>
      {currency.icon}
    </span>
  );
};
