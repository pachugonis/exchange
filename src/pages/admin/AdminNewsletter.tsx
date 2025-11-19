import React, { useState } from 'react';
import { Mail, Users, Send, Trash2, Edit, Plus, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { useNewsletterStore } from '../../store/newsletterStore';
import { getEmailLogs } from '../../api/emailAPI';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminNewsletter: React.FC = () => {
  const {
    subscribers,
    campaigns,
    addSubscriber,
    removeSubscriber,
    toggleSubscriberStatus,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
  } = useNewsletterStore();

  const [activeTab, setActiveTab] = useState('subscribers');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    body: '',
  });

  const emailLogs = getEmailLogs();
  const activeSubscribers = subscribers.filter((s) => s.isActive).length;

  const handleAddSubscriber = async () => {
    if (!newEmail) return;

    const result = await addSubscriber(newEmail, newName);
    if (result.success) {
      toast.success('Подписчик добавлен!');
      setNewEmail('');
      setNewName('');
    } else {
      toast.error(result.error || 'Ошибка добавления');
    }
  };

  const handleRemoveSubscriber = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить подписчика?')) {
      removeSubscriber(id);
      toast.success('Подписчик удален');
    }
  };

  const handleCreateCampaign = () => {
    if (!campaignForm.title || !campaignForm.subject || !campaignForm.body) {
      toast.error('Заполните все поля');
      return;
    }

    if (editingCampaign) {
      updateCampaign(editingCampaign, campaignForm);
      toast.success('Кампания обновлена!');
    } else {
      createCampaign(campaignForm);
      toast.success('Кампания создана!');
    }

    setShowCampaignModal(false);
    setCampaignForm({ title: '', subject: '', body: '' });
    setEditingCampaign(null);
  };

  const handleEditCampaign = (campaign: any) => {
    setCampaignForm({
      title: campaign.title,
      subject: campaign.subject,
      body: campaign.body,
    });
    setEditingCampaign(campaign.id);
    setShowCampaignModal(true);
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm(`Отправить рассылку ${activeSubscribers} подписчикам?`)) {
      return;
    }

    toast.loading('Отправка рассылки...');
    const result = await sendCampaign(id);
    
    if (result.success) {
      toast.success(`Рассылка отправлена ${result.sent} подписчикам!`);
    } else {
      toast.error(result.error || 'Ошибка отправки');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Email рассылки</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Управление подписчиками и рассылками
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeSubscribers}</div>
              <div className="text-sm text-dark-600 dark:text-dark-400">
                Активных подписчиков
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Send className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {campaigns.filter((c) => c.status === 'sent').length}
              </div>
              <div className="text-sm text-dark-600 dark:text-dark-400">
                Отправлено кампаний
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Edit className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {campaigns.filter((c) => c.status === 'draft').length}
              </div>
              <div className="text-sm text-dark-600 dark:text-dark-400">
                Черновики
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Mail className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{emailLogs.length}</div>
              <div className="text-sm text-dark-600 dark:text-dark-400">
                Отправлено писем
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          tabs={[
            { id: 'subscribers', label: 'Подписчики' },
            { id: 'campaigns', label: 'Кампании' },
            { id: 'logs', label: 'Логи отправки' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Subscribers Tab */}
        <TabPanel isActive={activeTab === 'subscribers'}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="Имя (опционально)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddSubscriber} className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200 dark:border-dark-700">
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Имя</th>
                    <th className="text-left py-3 px-4">Дата подписки</th>
                    <th className="text-left py-3 px-4">Статус</th>
                    <th className="text-right py-3 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-dark-500">
                        Нет подписчиков
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((subscriber) => (
                      <tr
                        key={subscriber.id}
                        className="border-b border-dark-200 dark:border-dark-700"
                      >
                        <td className="py-3 px-4">{subscriber.email}</td>
                        <td className="py-3 px-4">{subscriber.name || '-'}</td>
                        <td className="py-3 px-4">
                          {formatDate(subscriber.subscribedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={subscriber.isActive ? 'success' : 'default'}>
                            {subscriber.isActive ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSubscriberStatus(subscriber.id)}
                            >
                              {subscriber.isActive ? 'Деактивировать' : 'Активировать'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveSubscriber(subscriber.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabPanel>

        {/* Campaigns Tab */}
        <TabPanel isActive={activeTab === 'campaigns'}>
          <div className="space-y-4">
            <Button onClick={() => setShowCampaignModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать кампанию
            </Button>

            <div className="grid gap-4">
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  Нет кампаний. Создайте первую!
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{campaign.title}</h3>
                          <Badge
                            variant={
                              campaign.status === 'sent'
                                ? 'success'
                                : campaign.status === 'scheduled'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {campaign.status === 'sent'
                              ? 'Отправлено'
                              : campaign.status === 'scheduled'
                              ? 'Запланировано'
                              : 'Черновик'}
                          </Badge>
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                          Тема: {campaign.subject}
                        </p>
                        {campaign.sentAt && (
                          <p className="text-xs text-dark-500">
                            Отправлено: {formatDate(campaign.sentAt)} ({campaign.recipientsCount}{' '}
                            получателей)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCampaign(campaign)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Удалить кампанию?')) {
                              deleteCampaign(campaign.id);
                              toast.success('Кампания удалена');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabPanel>

        {/* Email Logs Tab */}
        <TabPanel isActive={activeTab === 'logs'}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200 dark:border-dark-700">
                  <th className="text-left py-3 px-4">Получатель</th>
                  <th className="text-left py-3 px-4">Тема</th>
                  <th className="text-left py-3 px-4">Тип</th>
                  <th className="text-left py-3 px-4">Статус</th>
                  <th className="text-left py-3 px-4">Дата</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-dark-500">
                      Нет логов
                    </td>
                  </tr>
                ) : (
                  emailLogs
                    .sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0))
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-dark-200 dark:border-dark-700"
                      >
                        <td className="py-3 px-4">{log.to}</td>
                        <td className="py-3 px-4">{log.subject}</td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{log.type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              log.status === 'sent'
                                ? 'success'
                                : log.status === 'failed'
                                ? 'error'
                                : 'warning'
                            }
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {log.sentAt ? formatDate(log.sentAt) : '-'}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </TabPanel>
      </Card>

      {/* Campaign Modal */}
      <Modal
        isOpen={showCampaignModal}
        onClose={() => {
          setShowCampaignModal(false);
          setCampaignForm({ title: '', subject: '', body: '' });
          setEditingCampaign(null);
        }}
        title={editingCampaign ? 'Редактировать кампанию' : 'Создать кампанию'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название кампании</label>
            <Input
              value={campaignForm.title}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, title: e.target.value })
              }
              placeholder="Например: Новые возможности платформы"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Тема письма</label>
            <Input
              value={campaignForm.subject}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, subject: e.target.value })
              }
              placeholder="Тема, которую увидят получатели"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Текст письма</label>
            <textarea
              value={campaignForm.body}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, body: e.target.value })
              }
              placeholder="Содержимое письма..."
              className="w-full h-48 px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowCampaignModal(false);
                setCampaignForm({ title: '', subject: '', body: '' });
                setEditingCampaign(null);
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateCampaign}>
              {editingCampaign ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
