import React from 'react';
import { Search, ArrowDownUp, Send, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Step {
  id: number;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

const steps: Step[] = [
  {
    id: 1,
    icon: <Search className="w-8 h-8" />,
    titleKey: 'exchange.steps.step1',
    descriptionKey: 'exchange.steps.step1Description',
  },
  {
    id: 2,
    icon: <ArrowDownUp className="w-8 h-8" />,
    titleKey: 'exchange.steps.step2',
    descriptionKey: 'exchange.steps.step2Description',
  },
  {
    id: 3,
    icon: <Send className="w-8 h-8" />,
    titleKey: 'exchange.steps.step3',
    descriptionKey: 'exchange.steps.step3Description',
  },
  {
    id: 4,
    icon: <CheckCircle className="w-8 h-8" />,
    titleKey: 'exchange.steps.step4',
    descriptionKey: 'exchange.steps.step4Description',
  },
];

export const ExchangeSteps: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 px-4 bg-dark-50 dark:bg-dark-800/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('exchange.steps.title')}</h2>
          <p className="text-dark-600 dark:text-dark-400">
            {t('exchange.steps.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 -translate-x-1/2 z-0" />
              )}

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-primary text-white">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
                  {step.id}
                </div>
                <h3 className="font-semibold text-lg mb-2">{t(step.titleKey)}</h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-white dark:bg-dark-800 rounded-lg border border-dark-200 dark:border-dark-700 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary-500" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-2">{t('exchange.steps.securityTitle')}</h4>
                <p className="text-sm text-dark-600 dark:text-dark-400">
                  {t('exchange.steps.securityDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
