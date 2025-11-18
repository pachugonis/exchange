import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExchangeFlowStore } from '../store/exchangeFlowStore';
import { useAdminStore } from '../store/adminStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeftRight, RefreshCw, ArrowRight, ArrowLeft, Check, Loader2, Copy } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useExchangeStore } from '../store/exchangeStore';
import { createOrder } from '../api/mockAPI';

export const Exchange: React.FC = () => {
  const navigate = useNavigate();
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
  } = useExchangeFlowStore();

  const { currencies: currencyList } = useExchangeStore();

  // Handle order creation
  const handleCreateOrder = async () => {
    if (!validateStep(4)) return;

    try {
      const order = await createOrder({
        fromCurrency: fromCurrency!,
        toCurrency: toCurrency!,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount),
        rate,
        commission,
        contactInfo: {
          email,
          telegram,
          promoCode,
        },
        paymentDetails: {
          fromWallet,
          toWallet,
        },
      });

      setOrderId(order.id);
      toast.success('Заявка успешно создана!');
      goToNextStep();
    } catch (error) {
      toast.error('Ошибка при создании заявки');
      console.error(error);
    }
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
        <label className="block text-sm font-medium mb-2">Отдаю</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <select
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={fromCurrency?.id || ''}
              onChange={(e) => {
                const currency = currencyList.find((c) => c.id === e.target.value);
                setFromCurrency(currency || null);
              }}
            >
              <option value="">Выберите валюту</option>
              {currencyList.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            {validationErrors.fromCurrency && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.fromCurrency}</p>
            )}
          </div>
          
          <div>
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
        >
          <ArrowLeftRight className="w-6 h-6" />
        </button>
      </div>

      {/* To Currency */}
      <div>
        <label className="block text-sm font-medium mb-2">Получаю</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <select
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={toCurrency?.id || ''}
              onChange={(e) => {
                const currency = currencyList.find((c) => c.id === e.target.value);
                setToCurrency(currency || null);
              }}
            >
              <option value="">Выберите валюту</option>
              {currencyList.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            {validationErrors.toCurrency && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.toCurrency}</p>
            )}
          </div>
          
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
            <span className="font-semibold">{(commission * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-primary-500">
            <span>Вы получите:</span>
            <span>
              {toAmount} {toCurrency?.symbol}
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
        />
        {validationErrors.email && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
        )}
        <p className="text-sm text-dark-500 mt-1">На этот email будет отправлена информация о заявке</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Telegram (опционально)</label>
        <Input
          type="text"
          placeholder="@username"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
        />
        <p className="text-sm text-dark-500 mt-1">Для быстрой связи с поддержкой</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Промокод (опционально)</label>
        <Input
          type="text"
          placeholder="Введите промокод"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
        />
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
              <span>{(commission * 100).toFixed(1)}%</span>
            </div>
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
    const { orderId } = useExchangeFlowStore.getState();
    const { settings } = useAdminStore();
    
    // Get payment address from admin settings
    const getPaymentAddress = () => {
      if (!fromCurrency) return '';
      
      // Extract base currency code for address lookup
      const baseCode = fromCurrency.code.includes('_') 
        ? fromCurrency.code.split('_')[0] 
        : fromCurrency.code;
      
      return settings.paymentAddresses[baseCode] || settings.paymentAddresses[fromCurrency.code] || 'Адрес не настроен';
    };

    const paymentAddress = getPaymentAddress();

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success('Скопировано в буфер обмена');
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
              navigate('/exchange');
            }}
          >
            Новый обмен
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">Обмен валют</h1>
        
        <Card>
          {renderStepIndicator()}
          
          <div className="mt-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
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
                <Button onClick={handleCreateOrder} className="gap-2">
                  Создать заявку <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
