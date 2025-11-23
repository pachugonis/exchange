import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../hooks/useTranslation';

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            404
          </h1>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('notFound.title')}
        </h2>
        
        <p className="text-lg text-dark-600 dark:text-dark-400 mb-8">
          {t('notFound.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="w-5 h-5" />
              {t('notFound.goHome')}
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('notFound.goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
};
