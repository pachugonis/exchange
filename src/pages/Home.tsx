import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Clock, Award, TrendingUp, TrendingDown, Megaphone, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { CurrencyIcon } from '../components/ui/CurrencyIcon';
import { fetchCryptoRates } from '../api/cryptoAPI';
import { Testimonials, PopularDirections } from '../components/home';
import { ExchangeSteps } from '../components/exchange';
import { useAnnouncementStore } from '../store/announcementStore';
import { useSiteSettingsStore } from '../store/siteSettingsStore';
import { currencies } from '../data/currencies';

export const Home: React.FC = () => {
  const { getActiveAnnouncement } = useAnnouncementStore();
  const { settings } = useSiteSettingsStore();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const activeAnnouncement = getActiveAnnouncement();
  
  const [cryptoRates, setCryptoRates] = useState<{
    BTC_USD: number;
    ETH_USD: number;
    USDT_USD: number;
  } | null>(null);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await fetchCryptoRates();
        setCryptoRates({
          BTC_USD: rates.BTC_USD,
          ETH_USD: rates.ETH_USD,
          USDT_USD: rates.USDT_USD,
        });
      } catch (error) {
        console.error('Failed to load crypto rates:', error);
      }
    };
    loadRates();
  }, []);
  return (
    <div className="min-h-screen">
      {/* Announcement Banner */}
      {activeAnnouncement && showAnnouncement && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Megaphone className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm md:text-base">{activeAnnouncement.message}</p>
              </div>
              <button
                onClick={() => setShowAnnouncement(false)}
                className="p-1 hover:bg-white/20 rounded transition flex-shrink-0"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            {settings.heroTitle}
          </h1>
          <p className="text-xl text-dark-600 dark:text-dark-300 mb-8 max-w-2xl mx-auto">
            {settings.heroSubtitle}
          </p>
          <Link to="/exchange">
            <Button size="lg" className="gap-2">
              Начать обмен <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          {settings.showStats && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
              <div className="text-dark-600 dark:text-dark-400">
                <div className="text-2xl font-bold text-primary-500">{settings.stat1Value}</div>
                <div>{settings.stat1Label}</div>
              </div>
              <div className="text-dark-600 dark:text-dark-400">
                <div className="text-2xl font-bold text-primary-500">{settings.stat2Value}</div>
                <div>{settings.stat2Label}</div>
              </div>
              <div className="text-dark-600 dark:text-dark-400">
                <div className="text-2xl font-bold text-primary-500">{settings.stat3Value}</div>
                <div>{settings.stat3Label}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      {settings.showFeatures && (
        <section className="py-20 px-4 bg-dark-50 dark:bg-dark-800/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Почему выбирают нас</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <Zap className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{settings.feature1Title}</h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {settings.feature1Description}
                </p>
              </Card>
              
              <Card>
                <Shield className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{settings.feature2Title}</h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {settings.feature2Description}
                </p>
              </Card>
              
              <Card>
                <Clock className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{settings.feature3Title}</h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {settings.feature3Description}
                </p>
              </Card>
              
              <Card>
                <Award className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{settings.feature4Title}</h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {settings.feature4Description}
                </p>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {/* Live Rates Widget */}
          {settings.showCryptoRates && cryptoRates && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8">{settings.cryptoRatesTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-dark-500 dark:text-dark-400 mb-1">Bitcoin</div>
                      <div className="text-2xl font-bold">${cryptoRates.BTC_USD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <CurrencyIcon currency={currencies.find(c => c.code === 'BTC')!} size="xl" />
                  </div>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-dark-500 dark:text-dark-400 mb-1">Ethereum</div>
                      <div className="text-2xl font-bold">${cryptoRates.ETH_USD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <CurrencyIcon currency={currencies.find(c => c.code === 'ETH')!} size="xl" />
                  </div>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-dark-500 dark:text-dark-400 mb-1">Tether</div>
                      <div className="text-2xl font-bold">${cryptoRates.USDT_USD.toFixed(4)}</div>
                    </div>
                    <CurrencyIcon currency={currencies.find(c => c.code === 'USDT_TRC20')!} size="xl" />
                  </div>
                </Card>
              </div>
              <p className="text-center text-xs text-dark-400 mt-4">
                🔄 Курсы обновляются автоматически с CoinGecko API
              </p>
            </div>
          )}
          
          {settings.showCTA && (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">{settings.ctaTitle}</h2>
              <p className="text-dark-600 dark:text-dark-300 mb-8 max-w-2xl mx-auto">
                {settings.ctaDescription}
              </p>
              <Link to="/exchange">
                <Button size="lg">{settings.ctaButtonText}</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Popular Directions */}
      {settings.showPopularDirections && <PopularDirections />}

      {/* Exchange Steps */}
      {settings.showExchangeSteps && <ExchangeSteps />}

      {/* Testimonials */}
      {settings.showTestimonials && <Testimonials />}
    </div>
  );
};
