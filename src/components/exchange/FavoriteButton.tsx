import React from 'react';
import { Star } from 'lucide-react';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  fromCurrency: string;
  toCurrency: string;
  className?: string;
  showLabel?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  fromCurrency,
  toCurrency,
  className = '',
  showLabel = false,
}) => {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const favorite = isFavorite(fromCurrency, toCurrency);

  const handleToggle = () => {
    toggleFavorite(fromCurrency, toCurrency);
    if (!favorite) {
      toast.success(t('exchange.favorites.added'));
    } else {
      toast.success(t('exchange.favorites.removed'));
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
        favorite
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
          : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700'
      } ${className}`}
      title={favorite ? t('exchange.favorites.remove') : t('exchange.favorites.add')}
    >
      <Star
        className={`w-5 h-5 ${
          favorite ? 'fill-current' : ''
        }`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {favorite ? t('exchange.favorites.inFavorites') : t('exchange.favorites.toFavorites')}
        </span>
      )}
    </button>
  );
};
