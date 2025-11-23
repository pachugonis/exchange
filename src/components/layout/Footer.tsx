import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Shield, Send } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNewsletterStore } from '../../store/newsletterStore';
import { useSiteSettingsStore } from '../../store/siteSettingsStore';
import { useDesignVariant } from '../../hooks/useDesignVariant';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

export const Footer: React.FC = () => {
  const { addSubscriber } = useNewsletterStore();
  const { settings } = useSiteSettingsStore();
  const designVariant = useDesignVariant();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const result = await addSubscriber(email);
    setLoading(false);

    if (result.success) {
      toast.success(t('home.newsletter.success'));
      setEmail('');
    } else {
      toast.error(result.error || t('home.newsletter.error'));
    }
  };
  
  const footerBg = designVariant === 'alternative' 
    ? 'bg-gradient-to-br from-dark-900 via-emerald-900/10 to-dark-900'
    : 'bg-dark-900';
  const logoGradient = designVariant === 'alternative' ? 'bg-gradient-alternative' : 'bg-gradient-primary';
  const hoverColor = designVariant === 'alternative' ? 'hover:text-emerald-400' : 'hover:text-primary-400';

  return (
    <footer className={`${footerBg} text-dark-100 mt-20`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className={`text-xl font-bold mb-4 ${logoGradient} bg-clip-text text-transparent`}>
              {settings.siteName}
            </h3>
            <p className="text-dark-400 text-sm">
              {settings.footerDescription}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('navigation.footerNavigation')}</h4>
            <ul className="space-y-2 text-dark-400">
              <li><Link to="/" className={hoverColor}>{t('navigation.home')}</Link></li>
              <li><Link to="/exchange" className={hoverColor}>{t('navigation.exchange')}</Link></li>
              <li><Link to="/about" className={hoverColor}>{t('navigation.about')}</Link></li>
              <li><Link to="/faq" className={hoverColor}>{t('navigation.faq')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('navigation.footerInfo')}</h4>
            <ul className="space-y-2 text-dark-400">
              <li><Link to="/rules" className={hoverColor}>{t('navigation.rules')}</Link></li>
              <li><Link to="/reviews" className={hoverColor}>{t('navigation.reviews')}</Link></li>
              <li><Link to="/contact" className={hoverColor}>{t('navigation.contact')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('navigation.footerContacts')}</h4>
            <ul className="space-y-3 text-dark-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {settings.footerEmail}
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                {settings.footerTelegram}
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('home.sslSecure')}
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter Subscription */}
        <div className="border-t border-dark-700 mt-8 pt-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-semibold mb-2">{t('home.newsletter.title')}</h4>
            <p className="text-dark-400 text-sm mb-4">
              {t('home.newsletter.description')}
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder={t('home.newsletter.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-dark-800 border-dark-600"
                required
              />
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? t('home.newsletter.sending') : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('home.newsletter.button')}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Banners Section */}
        {settings.footerBanners.length > 0 && (
          <div className="border-t border-dark-700 mt-8 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {settings.footerBanners.map((banner) => (
                <a
                  key={banner.id}
                  href={banner.link || '#'}
                  target={banner.link ? '_blank' : undefined}
                  rel={banner.link ? 'noopener noreferrer' : undefined}
                  className="w-[88px] h-[31px] hover:opacity-80 transition"
                  title={banner.title}
                >
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-dark-500 text-sm">
          <p>{settings.footerCopyright}</p>
        </div>
      </div>
    </footer>
  );
};
