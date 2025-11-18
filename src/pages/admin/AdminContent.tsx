import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useContentStore, FAQItem } from '../../store/contentStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { Save, Plus, Trash2, Edit2, X, FileText, HelpCircle, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminContent: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { aboutUs, faqItems, updateAboutUs, addFAQItem, updateFAQItem, deleteFAQItem, updateFAQItems } = useContentStore();
  const [activeTab, setActiveTab] = useState('about');
  
  // About Us state
  const [aboutContent, setAboutContent] = useState(aboutUs);
  
  // FAQ state
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [showAddFAQ, setShowAddFAQ] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSaveAbout = () => {
    updateAboutUs(aboutContent);
    toast.success('Страница "О нас" обновлена');
  };

  const handleAddFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      toast.error('Заполните все поля');
      return;
    }
    
    addFAQItem({
      question: newFAQ.question,
      answer: newFAQ.answer,
      order: faqItems.length + 1,
    });
    
    setNewFAQ({ question: '', answer: '' });
    setShowAddFAQ(false);
    toast.success('Вопрос добавлен');
  };

  const handleUpdateFAQ = (id: string, updates: Partial<FAQItem>) => {
    updateFAQItem(id, updates);
    setEditingFAQ(null);
    toast.success('Вопрос обновлен');
  };

  const handleDeleteFAQ = (id: string) => {
    if (confirm('Удалить этот вопрос?')) {
      deleteFAQItem(id);
      toast.success('Вопрос удален');
    }
  };

  const moveFAQUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...faqItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    newItems.forEach((item, idx) => item.order = idx + 1);
    updateFAQItems(newItems);
  };

  const moveFAQDown = (index: number) => {
    if (index === faqItems.length - 1) return;
    const newItems = [...faqItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    newItems.forEach((item, idx) => item.order = idx + 1);
    updateFAQItems(newItems);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление контентом</h1>
        <p className="text-dark-600 dark:text-dark-400">
          Редактирование страниц "О нас" и "Часто задаваемые вопросы"
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'about', label: 'О нас', icon: <FileText className="w-4 h-4" /> },
          { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* About Us Tab */}
      <TabPanel isActive={activeTab === 'about'}>
        <Card>
          <h2 className="text-xl font-semibold mb-4">Редактирование страницы "О нас"</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Содержание страницы (поддерживается Markdown)
              </label>
              <textarea
                value={aboutContent}
                onChange={(e) => setAboutContent(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder="Введите текст страницы..."
              />
              <p className="text-xs text-dark-500 mt-1">
                Используйте ## для заголовков, - для списков
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveAbout} className="gap-2">
                <Save className="w-4 h-4" />
                Сохранить изменения
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAboutContent(aboutUs)}
              >
                Отменить
              </Button>
            </div>
          </div>
        </Card>
      </TabPanel>

      {/* FAQ Tab */}
      <TabPanel isActive={activeTab === 'faq'}>
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Часто задаваемые вопросы</h2>
              <Button onClick={() => setShowAddFAQ(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить вопрос
              </Button>
            </div>

            {/* Add FAQ Form */}
            {showAddFAQ && (
              <Card className="mb-4 bg-dark-50 dark:bg-dark-700">
                <h3 className="font-semibold mb-3">Новый вопрос</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Вопрос</label>
                    <Input
                      value={newFAQ.question}
                      onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                      placeholder="Введите вопрос..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ответ</label>
                    <textarea
                      value={newFAQ.answer}
                      onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Введите ответ..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddFAQ} size="sm">
                      Добавить
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowAddFAQ(false);
                        setNewFAQ({ question: '', answer: '' });
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* FAQ List */}
            <div className="space-y-3">
              {faqItems.length === 0 ? (
                <p className="text-center text-dark-500 py-8">Нет вопросов</p>
              ) : (
                faqItems.map((item, index) => (
                  <Card key={item.id} className="bg-dark-50 dark:bg-dark-700">
                    {editingFAQ === item.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Вопрос</label>
                          <Input
                            defaultValue={item.question}
                            onBlur={(e) => handleUpdateFAQ(item.id, { question: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Ответ</label>
                          <textarea
                            defaultValue={item.answer}
                            onBlur={(e) => handleUpdateFAQ(item.id, { answer: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingFAQ(null)}
                        >
                          Готово
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.question}</h4>
                            <p className="text-sm text-dark-600 dark:text-dark-300">
                              {item.answer}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => moveFAQUp(index)}
                              disabled={index === 0}
                              className="p-1 hover:bg-dark-200 dark:hover:bg-dark-600 rounded disabled:opacity-30"
                              title="Переместить вверх"
                            >
                              <MoveUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveFAQDown(index)}
                              disabled={index === faqItems.length - 1}
                              className="p-1 hover:bg-dark-200 dark:hover:bg-dark-600 rounded disabled:opacity-30"
                              title="Переместить вниз"
                            >
                              <MoveDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingFAQ(item.id)}
                              className="p-1 hover:bg-dark-200 dark:hover:bg-dark-600 rounded"
                              title="Редактировать"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFAQ(item.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>
      </TabPanel>
    </div>
  );
};
