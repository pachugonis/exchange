import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePromoStore } from '../../store/promoStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { Currency } from '../../types';
import toast from 'react-hot-toast';

interface PromoCodeInputProps {
  amount: number;
  currency?: Currency; // The currency being sent
  onApply?: (discount: number, type: 'commission' | 'bonus', bonusAmount?: number) => void;
  className?: string;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  amount,
  currency,
  onApply,
  className = '',
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const { appliedPromo, validatePromo, applyPromo, removePromo, promoCodes } = usePromoStore();

  // Calculate USD equivalent of the amount
  const calculateUSDAmount = async (): Promise<number> => {
    if (!currency || !amount) return amount;

    // If already USD, return as is
    if (currency.code === 'USD' || currency.code.includes('USD')) {
      return amount;
    }

    try {
      // If currency has CoinGecko ID, get current USD price
      if (currency.coinGeckoId) {
        const { fetchCoinPrice } = await import('../../api/cryptoAPI');
        const price = await fetchCoinPrice(currency.coinGeckoId);
        if (price && price.usd > 0) {
          return amount * price.usd;
        }
      }

      // Otherwise, use standard API rates
      const { fetchCryptoRates, calculateRate } = await import('../../api/cryptoAPI');
      const rates = await fetchCryptoRates();
      const usdRate = calculateRate(rates, currency.code, 'USD');
      return amount * usdRate;
    } catch (error) {
      console.error('Error calculating USD amount:', error);
      // Fallback: assume the amount is already in reasonable range
      return amount;
    }
  };

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error(t('exchange.promoCode.enterCode'));
      return;
    }

    // Calculate USD equivalent for validation
    const usdAmount = await calculateUSDAmount();
    const validation = validatePromo(code, usdAmount);

    if (!validation.valid) {
      // Translate error codes to localized messages
      let errorMessage = t('exchange.promoCode.invalid');
      
      if (validation.error) {
        if (validation.error === 'PROMO_NOT_FOUND') {
          errorMessage = t('exchange.promoCode.notFound');
        } else if (validation.error === 'PROMO_INACTIVE') {
          errorMessage = t('exchange.promoCode.inactive');
        } else if (validation.error === 'PROMO_EXPIRED') {
          errorMessage = t('exchange.promoCode.expired');
        } else if (validation.error === 'PROMO_EXHAUSTED') {
          errorMessage = t('exchange.promoCode.exhausted');
        } else if (validation.error.startsWith('PROMO_MIN_AMOUNT:')) {
          const minAmount = validation.error.split(':')[1];
          errorMessage = `${t('exchange.promoCode.minAmount')}: $${minAmount} USD`;
        }
      }
      
      toast.error(errorMessage);
      return;
    }

    applyPromo(code);
    toast.success(t('exchange.promoCode.applied'));
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
    toast.success(t('exchange.promoCode.removed'));
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
              placeholder={t('exchange.promoCode.placeholder')}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleApply()}
            />
          </div>
          <Button onClick={handleApply} variant="outline">
            {t('exchange.promoCode.apply')}
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
                  <>{t('exchange.promoCode.commissionDiscount')}: {appliedPromo.discount}%</>
                ) : (
                  <>{t('exchange.promoCode.bonus')}: +{appliedPromo.bonusAmount}</>
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
          {t('exchange.promoCode.available')}: {promoCodes.filter(p => p.isActive).map(p => p.code).join(', ')}
        </div>
      )}
    </div>
  );
};
