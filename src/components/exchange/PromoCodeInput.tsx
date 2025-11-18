import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePromoStore } from '../../store/promoStore';
import toast from 'react-hot-toast';

interface PromoCodeInputProps {
  amount: number;
  onApply?: (discount: number, type: 'commission' | 'bonus', bonusAmount?: number) => void;
  className?: string;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  amount,
  onApply,
  className = '',
}) => {
  const [code, setCode] = useState('');
  const { appliedPromo, validatePromo, applyPromo, removePromo, promoCodes } = usePromoStore();

  const handleApply = () => {
    if (!code.trim()) {
      toast.error('Введите промокод');
      return;
    }

    const validation = validatePromo(code, amount);

    if (!validation.valid) {
      toast.error(validation.error || 'Неверный промокод');
      return;
    }

    applyPromo(code);
    toast.success('Промокод применен!');
    setCode('');

    if (validation.promo && onApply) {
      onApply(
        validation.promo.discount,
        validation.promo.type,
        validation.promo.bonusAmount
      );
    }
  };

  const handleRemove = () => {
    removePromo();
    toast.success('Промокод удален');
    if (onApply) {
      onApply(0, 'commission');
    }
  };

  return (
    <div className={className}>
      {!appliedPromo ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Введите промокод"
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleApply()}
            />
          </div>
          <Button onClick={handleApply} variant="outline">
            Применить
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium text-green-700 dark:text-green-400">
                {appliedPromo.code}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                {appliedPromo.type === 'commission' ? (
                  <>Скидка на комиссию: {appliedPromo.discount}%</>
                ) : (
                  <>Бонус: +{appliedPromo.bonusAmount}</>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-800/50 rounded transition"
          >
            <X className="w-5 h-5 text-green-600 dark:text-green-400" />
          </button>
        </div>
      )}

      {promoCodes.filter(p => p.isActive).length > 0 && (
        <div className="mt-2 text-xs text-dark-500 dark:text-dark-400">
          Доступные промокоды: {promoCodes.filter(p => p.isActive).map(p => p.code).join(', ')}
        </div>
      )}
    </div>
  );
};
