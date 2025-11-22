import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrencyIcon } from '../ui/CurrencyIcon';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useExchangeStore } from '../../store/exchangeStore';
import { useExchangeFlowStore } from '../../store/exchangeFlowStore';
import toast from 'react-hot-toast';

interface FavoritesListProps {
  onSelect?: (fromCurrency: string, toCurrency: string) => void;
  className?: string;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  onSelect,
  className = '',
}) => {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavoriteStore();
  const { currencies } = useExchangeStore();
  const { setFromCurrency, setToCurrency, resetFlow } = useExchangeFlowStore();

  const getCurrencyByCode = (code: string) => {
    return currencies.find((c) => c.code === code);
  };

  const handleSelect = (fromCode: string, toCode: string) => {
    const fromCurrency = getCurrencyByCode(fromCode);
    const toCurrency = getCurrencyByCode(toCode);
    
    if (!fromCurrency || !toCurrency) {
      toast.error('Не удалось найти валюты');
      return;
    }

    if (onSelect) {
      // If custom handler is provided, use it
      onSelect(fromCode, toCode);
    } else {
      // Default behavior: navigate to exchange with pre-filled currencies
      resetFlow();
      setFromCurrency(fromCurrency);
      setToCurrency(toCurrency);
      navigate('/exchange');
      toast.success(`Переход к обмену: ${fromCode} → ${toCode}`);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(id);
    toast.success('Удалено из избранного');
  };

  if (favorites.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto text-dark-300 dark:text-dark-600 mb-3" />
          <h3 className="font-semibold mb-2">Нет избранных направлений</h3>
          <p className="text-sm text-dark-600 dark:text-dark-400">
            Добавьте часто используемые пары для быстрого доступа
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500 fill-current" />
        <h3 className="font-semibold">Избранные направления</h3>
        <Badge variant="info">{favorites.length}</Badge>
      </div>

      <div className="space-y-2">
        {favorites.map((fav) => {
          const fromCurrency = getCurrencyByCode(fav.fromCurrencyCode);
          const toCurrency = getCurrencyByCode(fav.toCurrencyCode);

          if (!fromCurrency || !toCurrency) return null;

          return (
            <div
              key={fav.id}
              onClick={() => handleSelect(fav.fromCurrencyCode, fav.toCurrencyCode)}
              className="flex items-center justify-between p-3 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-700 cursor-pointer transition group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <CurrencyIcon currency={fromCurrency} size="sm" />
                  <div>
                    <div className="font-medium text-sm">{fromCurrency.code}</div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">
                      {fromCurrency.name}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-primary-500" />

                <div className="flex items-center gap-2">
                  <CurrencyIcon currency={toCurrency} size="sm" />
                  <div>
                    <div className="font-medium text-sm">{toCurrency.code}</div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">
                      {toCurrency.name}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => handleRemove(fav.id, e)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
