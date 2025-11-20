import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExchangeFlowStore } from '../store/exchangeFlowStore';
import { useAdminStore } from '../store/adminStore';
import { useOrderStore } from '../store/orderStore';
import { useUserStore } from '../store/userStore';
import { usePromoStore } from '../store/promoStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CurrencySelect } from '../components/ui/CurrencySelect';
import { PromoCodeInput } from '../components/exchange/PromoCodeInput';
import { ArrowLeftRight, RefreshCw, ArrowRight, ArrowLeft, Check, Loader2, Copy, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useExchangeStore } from '../store/exchangeStore';
import { createOrder } from '../api/mockAPI';

export const Exchange: React.FC = () => {
  const navigate = useNavigate();
  const { addOrder, cancelOrder, getOrderById } = useOrderStore();
  const { user } = useUserStore();
  const { incrementPromoUse, appliedPromo, removePromo } = usePromoStore();
  const { settings } = useAdminStore(); // Move hook to top level
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [renderKey, setRenderKey] = React.useState(0);
  const {
    currentStep,
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    rate,
    commission,
    email,
    telegram,
    promoCode,
    fromWallet,
    toWallet,
    agreedToTerms,
    agreedToAML,
    isLoadingRates,
    lastRateUpdate,
    validationErrors,
    orderId,
    setFromCurrency,
    setToCurrency,
    setFromAmount,
    swapCurrencies,
    setEmail,
    setTelegram,
    setPromoCode,
    setFromWallet,
    setToWallet,
    setAgreedToTerms,
    setAgreedToAML,
    goToNextStep,
    goToPreviousStep,
    validateStep,
    setOrderId,
    resetFlow,
    setCurrentStep,
  } = useExchangeFlowStore();

  const { currencies: currencyList, reloadCurrencies } = useExchangeStore();

  // Reload currencies on mount to get latest from admin settings
  useEffect(() => {
    reloadCurrencies();
  }, [reloadCurrencies]);

  // Auto-fill email from user account if logged in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.telegram && !telegram) {
      setTelegram(user.telegram);
    }
  }, [user, email, telegram, setEmail, setTelegram]);

  // Reset flow if on step 5 when mounting (user returning from completed order)
  useEffect(() => {
    if (currentStep === 5 && orderId) {
      // Check if this is a page load (not a fresh order creation)
      const currentOrder = getOrderById(orderId);
      if (currentOrder) {
        // Reset to start a new exchange
        console.log('Detected step 5 on mount with existing order, resetting flow');
        resetFlow();
      }
    } else if (currentStep > 5 || currentStep < 1) {
      resetFlow();
    }
  }, []); // Run only on mount

  // Log step changes for debugging
  useEffect(() => {
    console.log('=== STEP CHANGED ===');
    console.log('Current step:', currentStep);
    console.log('Order ID:', orderId);
    console.log('From currency:', fromCurrency?.code);
    console.log('To currency:', toCurrency?.code);
    console.log('==================');
    
    // Scroll to top when step changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, orderId, fromCurrency, toCurrency]);

  // Calculate commission with promo discount
  const getEffectiveCommission = () => {
    let effectiveCommission = commission;
    
    if (appliedPromo && appliedPromo.type === 'commission') {
      // Apply percentage discount to commission
      const discountMultiplier = (100 - appliedPromo.discount) / 100;
      effectiveCommission = commission * discountMultiplier;
    }
    
    return effectiveCommission;
  };

  // Get bonus amount from promo if applicable
  const getBonusAmount = () => {
    if (appliedPromo && appliedPromo.type === 'bonus' && appliedPromo.bonusAmount) {
      return appliedPromo.bonusAmount;
    }
    return 0;
  };

  // Calculate final amount with promo
  const getFinalToAmount = () => {
    const baseAmount = parseFloat(toAmount) || 0;
    const bonusAmount = getBonusAmount();
    return baseAmount + bonusAmount;
  };

  // Handle order creation
  const handleCreateOrder = async () => {
    console.log('Creating order, validating step 4...');
    const isValid = validateStep(4);
    console.log('Validation result:', isValid);
    console.log('Validation errors:', validationErrors);
    
    if (!isValid) {
      toast.error('Пожалуйста, заполните все обязательные поля и согласитесь с условиями');
      return;
    }

    setIsCreatingOrder(true);
    try {
      console.log('Creating order with data:', {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        rate,
        commission,
      });
      
      const order = await createOrder({
        fromCurrency: fromCurrency!,
        toCurrency: toCurrency!,
        fromAmount: parseFloat(fromAmount),
        toAmount: getFinalToAmount(),
        rate,
        commission: getEffectiveCommission(),
        contactInfo: {
          email,
          telegram,
          promoCode: appliedPromo?.code || '',
        },
        paymentDetails: {
          fromWallet,
          toWallet,
        },
      });

      // Add userId if user is authenticated
      if (user?.id) {
        order.userId = user.id;
      }

      console.log('Order created:', order);
      
      // Save order to store
      addOrder(order);
      
      // Increment promo usage if promo was applied
      if (appliedPromo?.code) {
        incrementPromoUse(appliedPromo.code);
      }
      
      // Clear promo after order creation
      removePromo();
      
      console.log('Setting order ID:', order.id);
      setOrderId(order.id);
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Showing success toast');
      toast.success('Заявка успешно создана!');
      
      console.log('Moving to step 5, current step before:', currentStep);
      // Use setCurrentStep from hook to trigger re-render
      setCurrentStep(5);
      
      // Force re-render by updating key
      setRenderKey(prev => prev + 1);
      
      // Force another update after a brief delay
      setTimeout(() => {
        console.log('Current step after timeout:', useExchangeFlowStore.getState().currentStep);
        if (useExchangeFlowStore.getState().currentStep !== 5) {
          console.log('Step not 5, forcing update');
          setCurrentStep(5);
          setRenderKey(prev => prev + 1);
        }
      }, 50);
    } catch (error) {
      toast.error('Ошибка при создании заявки');
      console.error('Order creation error:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = () => {
    console.log('handleCancelOrder called, orderId:', orderId);
    if (!orderId) {
      console.error('No orderId found');
      toast.error('Ошибка: номер заявки не найден');
      return;
    }
    
    console.log('Cancelling order:', orderId);
    cancelOrder(orderId);
    
    // Reset exchange flow to clear all data
    resetFlow();
    
    toast.success('Заявка успешно отменена');
    setShowCancelModal(false);
    
    // Redirect to home after a brief delay
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                step < currentStep
                  ? 'bg-primary-500 text-white'
                  : step === currentStep
                  ? 'bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900'
                  : 'bg-dark-200 dark:bg-dark-700 text-dark-500'
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            <div className="text-xs mt-2 text-center">
              {step === 1 && 'Валюты'}
              {step === 2 && 'Контакты'}
              {step === 3 && 'Реквизиты'}
              {step === 4 && 'Подтверждение'}
              {step === 5 && 'Оплата'}
            </div>
          </div>
          {step < 5 && (
            <div
              className={`flex-1 h-1 mx-2 transition ${
                step < currentStep ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Выберите валюты и сумму</h2>
      
      {/* From Currency */}
      <div>
        <CurrencySelect
          label="Отдаю"
          value={fromCurrency?.id || ''}
          onChange={(value) => {
            const currency = currencyList.find((c) => c.id === value);
            setFromCurrency(currency || null);
          }}
          currencies={currencyList}
          excludeCurrencyId={toCurrency?.id}
          error={validationErrors.fromCurrency}
        />
        
        <div className="mt-2">
          <Input
            type="number"
            placeholder="Сумма"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            min={fromCurrency?.minAmount || 0}
            max={fromCurrency?.maxAmount || undefined}
          />
          {validationErrors.fromAmount && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.fromAmount}</p>
          )}
        </div>
        {fromCurrency && (
          <p className="text-sm text-dark-500 mt-1">
            Мин: {fromCurrency.minAmount} | Макс: {fromCurrency.maxAmount} | Резерв: {fromCurrency.reserve}
          </p>
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center">
        <button
          onClick={swapCurrencies}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
          aria-label="Поменять валюты"
          disabled={!fromCurrency || !toCurrency}
        >
          <ArrowLeftRight className="w-6 h-6" />
        </button>
      </div>

      {/* Warning if same currency selected */}
      {fromCurrency && toCurrency && fromCurrency.id === toCurrency.id && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Внимание:</strong> Нельзя обменять одинаковые валюты. Пожалуйста, выберите другую валюту.
          </p>
        </div>
      )}

      {/* To Currency */}
      <div>
        <CurrencySelect
          label="Получаю"
          value={toCurrency?.id || ''}
          onChange={(value) => {
            const currency = currencyList.find((c) => c.id === value);
            setToCurrency(currency || null);
          }}
          currencies={currencyList}
          excludeCurrencyId={fromCurrency?.id}
          error={validationErrors.toCurrency}
        />
        
        <div className="mt-2">
          <Input
            type="text"
            placeholder="Рассчитанная сумма"
            value={toAmount}
            readOnly
            className="bg-dark-50 dark:bg-dark-900"
          />
        </div>
        {toCurrency && (
          <p className="text-sm text-dark-500 mt-1">
            Резерв: {formatCurrency(toCurrency.reserve, toCurrency.symbol)}
          </p>
        )}
      </div>

      {/* Exchange Info */}
      {rate > 0 && (
        <div className="bg-dark-50 dark:bg-dark-900 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Курс обмена:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                1 {fromCurrency?.code} = {rate.toFixed(8)} {toCurrency?.code}
              </span>
              {isLoadingRates && <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span>Комиссия:</span>
            <span className="font-semibold">
              {appliedPromo && appliedPromo.type === 'commission' ? (
                <>
                  <span className="line-through text-dark-400 mr-2">{(commission * 100).toFixed(1)}%</span>
                  <span className="text-green-600">{(getEffectiveCommission() * 100).toFixed(1)}%</span>
                </>
              ) : (
                <>{(commission * 100).toFixed(1)}%</>
              )}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-primary-500">
            <span>Вы получите:</span>
            <span>
              {toAmount} {toCurrency?.symbol}
              {appliedPromo && appliedPromo.type === 'bonus' && getBonusAmount() > 0 && (
                <span className="text-green-600 text-sm ml-2">+{getBonusAmount()}</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Контактная информация</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!user?.email}
        />
        {validationErrors.email && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
        )}
        {user?.email ? (
          <p className="text-sm text-dark-500 mt-1">Электронная почта взята из вашего профиля</p>
        ) : (
          <p className="text-sm text-dark-500 mt-1">На этот email будет отправлена информация о заявке</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Telegram (опционально)</label>
        <Input
          type="text"
          placeholder="@username"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          disabled={!!user?.telegram}
        />
        {user?.telegram ? (
          <p className="text-sm text-dark-500 mt-1">Telegram взят из вашего профиля</p>
        ) : (
          <p className="text-sm text-dark-500 mt-1">Для быстрой связи с поддержкой</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Промокод (опционально)</label>
        <PromoCodeInput amount={parseFloat(fromAmount) || 0} />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Платежные реквизиты</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Адрес кошелька отправителя ({fromCurrency?.code}) <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder={`Ваш ${fromCurrency?.code} адрес`}
          value={fromWallet}
          onChange={(e) => setFromWallet(e.target.value)}
        />
        {validationErrors.fromWallet && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.fromWallet}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Адрес кошелька получателя ({toCurrency?.code}) <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder={`Адрес для получения ${toCurrency?.code}`}
          value={toWallet}
          onChange={(e) => setToWallet(e.target.value)}
        />
        {validationErrors.toWallet && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.toWallet}</p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Подтверждение заявки</h2>
      
      {/* Summary */}
      <div className="bg-dark-50 dark:bg-dark-900 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-3">Детали обмена</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-600 dark:text-dark-400">Отдаете:</span>
              <span className="font-semibold">
                {fromAmount} {fromCurrency?.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-600 dark:text-dark-400">Получаете:</span>
              <span className="font-semibold">
                {toAmount} {toCurrency?.code}
                {appliedPromo && appliedPromo.type === 'bonus' && getBonusAmount() > 0 && (
                  <span className="text-green-600 ml-2">+{getBonusAmount()}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-600 dark:text-dark-400">Курс:</span>
              <span>
                1 {fromCurrency?.code} = {rate.toFixed(8)} {toCurrency?.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-600 dark:text-dark-400">Комиссия:</span>
              <span>
                {appliedPromo && appliedPromo.type === 'commission' ? (
                  <>
                    <span className="line-through text-dark-400 mr-2">{(commission * 100).toFixed(1)}%</span>
                    <span className="text-green-600 font-semibold">{(getEffectiveCommission() * 100).toFixed(1)}%</span>
                  </>
                ) : (
                  <>{(commission * 100).toFixed(1)}%</>
                )}
              </span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between">
                <span className="text-dark-600 dark:text-dark-400">Промокод:</span>
                <span className="text-green-600 font-semibold">
                  {appliedPromo.code}
                  {appliedPromo.type === 'commission' && ` (-${appliedPromo.discount}%)`}
                  {appliedPromo.type === 'bonus' && ` (+${appliedPromo.bonusAmount})`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
          <h3 className="font-semibold mb-3">Контактная информация</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-600 dark:text-dark-400">Email:</span>
              <span>{email}</span>
            </div>
            {telegram && (
              <div className="flex justify-between">
                <span className="text-dark-600 dark:text-dark-400">Telegram:</span>
                <span>{telegram}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
          <h3 className="font-semibold mb-3">Платежные реквизиты</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-dark-600 dark:text-dark-400 block mb-1">Кошелек отправителя:</span>
              <span className="font-mono text-xs break-all">{fromWallet}</span>
            </div>
            <div>
              <span className="text-dark-600 dark:text-dark-400 block mb-1">Кошелек получателя:</span>
              <span className="font-mono text-xs break-all">{toWallet}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agreements */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            Я согласен с{' '}
            <a href="/rules" className="text-primary-500 hover:underline" target="_blank">
              правилами обмена
            </a>
          </span>
        </label>
        {validationErrors.terms && (
          <p className="text-red-500 text-sm">{validationErrors.terms}</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToAML}
            onChange={(e) => setAgreedToAML(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            Я согласен с{' '}
            <a href="/rules" className="text-primary-500 hover:underline" target="_blank">
              политикой AML/KYC
            </a>
          </span>
        </label>
        {validationErrors.aml && (
          <p className="text-red-500 text-sm">{validationErrors.aml}</p>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => {
    // settings is now from component level, not a hook call here
    
    console.log('renderStep5 called');
    console.log('fromCurrency:', fromCurrency);
    console.log('toCurrency:', toCurrency);
    console.log('fromAmount:', fromAmount);
    console.log('toAmount:', toAmount);
    console.log('orderId:', orderId);
    
    // Safety checks
    if (!fromCurrency || !toCurrency) {
      console.error('Missing currency data in step 5');
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Ошибка: данные о валютах потеряны</p>
          <Button onClick={() => resetFlow()} className="mt-4">
            Начать сначала
          </Button>
        </div>
      );
    }
    
    if (!orderId) {
      console.error('Missing order ID in step 5');
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Ошибка: номер заявки не найден</p>
          <Button onClick={() => resetFlow()} className="mt-4">
            Начать сначала
          </Button>
        </div>
      );
    }
    
    // Get payment address from currency data
    const getPaymentAddress = () => {
      try {
        if (!fromCurrency) return 'Адрес не настроен';
        
        // Check if currency has payment address
        if (fromCurrency.paymentAddress) {
          return fromCurrency.paymentAddress;
        }
        
        return 'Адрес не настроен';
      } catch (error) {
        console.error('Error getting payment address:', error);
        return 'Ошибка получения адреса';
      }
    };

    const paymentAddress = getPaymentAddress();

    const copyToClipboard = (text: string) => {
      try {
        navigator.clipboard.writeText(text);
        toast.success('Скопировано в буфер обмена');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Ошибка копирования');
      }
    };
    
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold">Заявка создана!</h2>
        
        <div className="bg-dark-50 dark:bg-dark-900 rounded-lg p-6">
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-2">Номер заявки</p>
          <p className="text-2xl font-bold font-mono">{orderId}</p>
        </div>

        {/* Payment Address */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4 text-lg">Адрес для оплаты</h3>
          <div className="bg-white dark:bg-dark-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-dark-500 mb-2">Отправьте {fromAmount} {fromCurrency?.code} на адрес:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-dark-100 dark:bg-dark-900 px-3 py-2 rounded text-sm break-all">
                {paymentAddress}
              </code>
              <button
                onClick={() => copyToClipboard(paymentAddress)}
                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition"
                title="Копировать адрес"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Важно:</strong> Отправьте точную сумму {fromAmount} {fromCurrency?.code}
            </p>
          </div>
        </div>

        <div className="text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Следующие шаги:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Отправьте {fromAmount} {fromCurrency?.code} на указанный адрес</li>
            <li>Ожидайте подтверждения транзакции (обычно 10-30 минут)</li>
            <li>Получите {toAmount} {toCurrency?.code} на ваш кошелек</li>
            <li>Проверьте email для отслеживания статуса</li>
          </ol>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/')} variant="outline">
            На главную
          </Button>
          <Button
            onClick={() => {
              resetFlow();
              window.location.reload();
            }}
          >
            Новый обмен
          </Button>
          {/* Only show cancel button if order is not completed or cancelled */}
          {(() => {
            const currentOrder = getOrderById(orderId || '');
            const canCancel = currentOrder && 
                             currentOrder.status !== 'completed' && 
                             currentOrder.status !== 'cancelled';
            
            return canCancel ? (
              <Button
                onClick={() => {
                  console.log('Cancel button clicked, opening modal');
                  setShowCancelModal(true);
                }}
                variant="outline"
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <XCircle className="w-4 h-4" />
                Отменить заявку
              </Button>
            ) : null;
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">Обмен валют</h1>
        
        {/* Debug info - remove in production */}
        {/*
        <div className="text-xs text-gray-500 mb-2 text-center">
          Текущий шаг: {currentStep}
        </div>
        */}
        
        <Card key={renderKey}>
          {renderStepIndicator()}
          
          <div className="mt-8">
            {(() => {
              console.log('Rendering step:', currentStep);
              switch (currentStep) {
                case 1:
                  console.log('Rendering step 1');
                  return renderStep1();
                case 2:
                  console.log('Rendering step 2');
                  return renderStep2();
                case 3:
                  console.log('Rendering step 3');
                  return renderStep3();
                case 4:
                  console.log('Rendering step 4');
                  return renderStep4();
                case 5:
                  console.log('Rendering step 5');
                  return renderStep5();
                default:
                  console.log('Unknown step:', currentStep);
                  return (
                    <div className="text-center py-12">
                      <p className="text-red-500">Ошибка: некорректный шаг ({currentStep})</p>
                      <Button onClick={() => resetFlow()} className="mt-4">
                        Начать сначала
                      </Button>
                    </div>
                  );
              }
            })()}
            
            {/* Fallback if no step matches */}
            {currentStep < 1 || currentStep > 5 ? (
              <div className="text-center py-12">
                <p className="text-red-500">Ошибка: некорректный шаг ({currentStep})</p>
                <Button onClick={() => resetFlow()} className="mt-4">
                  Начать сначала
                </Button>
              </div>
            ) : null}
          </div>

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-dark-200 dark:border-dark-700">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Назад
              </Button>

              {currentStep < 4 ? (
                <Button onClick={goToNextStep} className="gap-2">
                  Далее <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateOrder} 
                  className="gap-2"
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Создание...
                    </>
                  ) : (
                    <>
                      Создать заявку <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Подтвердите отмену"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-dark-600 dark:text-dark-400">
            Вы уверены, что хотите отменить заявку <strong>{orderId}</strong>?
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Внимание:</strong> Отмена заявки необратима. Если вы уже отправили средства, обратитесь в поддержку.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Нет, оставить
            </Button>
            <Button
              onClick={handleCancelOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Да, отменить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
