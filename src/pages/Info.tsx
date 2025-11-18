import React from 'react';
import { Card } from '../components/ui/Card';
import { useContentStore } from '../store/contentStore';

export const About: React.FC = () => {
  const { aboutUs } = useContentStore();
  
  // Simple markdown-like parser
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold mt-6 mb-4">{line.substring(3)}</h2>;
      }
      // List items
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-6">{line.substring(2)}</li>;
      }
      // Empty lines
      if (line.trim() === '') {
        return <br key={index} />;
      }
      // Regular paragraphs
      return <p key={index} className="mb-4">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">О нас</h1>
        <Card>
          <div className="prose dark:prose-invert max-w-none text-lg">
            {renderContent(aboutUs)}
          </div>
        </Card>
      </div>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const { faqItems } = useContentStore();
  
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Часто задаваемые вопросы</h1>
        <div className="space-y-4">
          {faqItems.length === 0 ? (
            <Card>
              <p className="text-center text-dark-500 py-8">Вопросы не найдены</p>
            </Card>
          ) : (
            faqItems.map((item) => (
              <Card key={item.id}>
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-dark-600 dark:text-dark-400">
                  {item.answer}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
