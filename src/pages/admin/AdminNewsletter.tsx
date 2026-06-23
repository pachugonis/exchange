import React, { useState } from 'react';
import { Mail, Users, Send, Trash2, Edit, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { useNewsletterStore } from '../../store/newsletterStore';
import { useTranslation } from '../../hooks/useTranslation';
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
  const { t } = useTranslation();

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
      toast.success(t('admin.newsletter.subscriberAdded'));
      setNewEmail('');
      setNewName('');
    } else {
      toast.error(result.error || t('admin.newsletter.addError'));
    }
  };

  const handleRemoveSubscriber = (id: string) => {
    if (confirm(t('admin.newsletter.confirmRemove'))) {
      removeSubscriber(id);
      toast.success(t('admin.newsletter.subscriberRemoved'));
    }
  };

  const handleCreateCampaign = () => {
    if (!campaignForm.title || !campaignForm.subject || !campaignForm.body) {
      toast.error(t('admin.newsletter.fillAllFields'));
      return;
    }

    if (editingCampaign) {
      updateCampaign(editingCampaign, campaignForm);
      toast.success(t('admin.newsletter.campaignUpdated'));
    } else {
      createCampaign(campaignForm);
      toast.success(t('admin.newsletter.campaignCreated'));
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
    if (!confirm(`${t('admin.newsletter.confirmSend')} ${activeSubscribers} ${t('admin.newsletter.subscribers')}?`)) {
      return;
    }

    toast.loading(t('admin.newsletter.sending'));
    const result = await sendCampaign(id);
    
    if (result.success) {
      toast.success(`${t('admin.newsletter.sentTo')} ${result.sent} ${t('admin.newsletter.subscribers')}!`);
    } else {
      toast.error(result.error || t('admin.newsletter.sendError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('admin.newsletter.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('admin.newsletter.subtitle')}
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
                {t('admin.newsletter.stats.activeSubscribers')}
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
                {t('admin.newsletter.stats.campaignsSent')}
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
                {t('admin.newsletter.stats.drafts')}
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
                {t('admin.newsletter.stats.emailsSent')}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          tabs={[
            { id: 'subscribers', label: t('admin.newsletter.tabs.subscribers') },
            { id: 'campaigns', label: t('admin.newsletter.tabs.campaigns') },
            { id: 'logs', label: t('admin.newsletter.tabs.logs') },
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
                placeholder={t('admin.newsletter.emailPlaceholder')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder={t('admin.newsletter.namePlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddSubscriber} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('common.buttons.add')}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200 dark:border-dark-700">
                    <th className="text-left py-3 px-4">{t('admin.newsletter.table.email')}</th>
                    <th className="text-left py-3 px-4">{t('admin.newsletter.table.name')}</th>
                    <th className="text-left py-3 px-4">{t('admin.newsletter.table.subscribeDate')}</th>
                    <th className="text-left py-3 px-4">{t('admin.newsletter.table.status')}</th>
                    <th className="text-right py-3 px-4">{t('admin.newsletter.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-dark-500">
                        {t('admin.newsletter.noSubscribers')}
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
                            {subscriber.isActive ? t('admin.newsletter.active') : t('admin.newsletter.inactive')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSubscriberStatus(subscriber.id)}
                            >
                              {subscriber.isActive ? t('admin.newsletter.deactivate') : t('admin.newsletter.activate')}
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
              {t('admin.newsletter.createCampaign')}
            </Button>

            <div className="grid gap-4">
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  {t('admin.newsletter.noCampaigns')}
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
                              ? t('admin.newsletter.sent')
                              : campaign.status === 'scheduled'
                              ? t('admin.newsletter.scheduled')
                              : t('admin.newsletter.draft')}
                          </Badge>
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                          {t('admin.newsletter.subject')}: {campaign.subject}
                        </p>
                        {campaign.sentAt && (
                          <p className="text-xs text-dark-500">
                            {t('admin.newsletter.sentAt')}: {formatDate(campaign.sentAt)} ({campaign.recipientsCount}{' '}
                            {t('admin.newsletter.recipients')})
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
                            if (confirm(t('admin.newsletter.confirmDeleteCampaign'))) {
                              deleteCampaign(campaign.id);
                              toast.success(t('admin.newsletter.campaignDeleted'));
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
                  <th className="text-left py-3 px-4">{t('admin.newsletter.logs.recipient')}</th>
                  <th className="text-left py-3 px-4">{t('admin.newsletter.logs.subject')}</th>
                  <th className="text-left py-3 px-4">{t('admin.newsletter.logs.type')}</th>
                  <th className="text-left py-3 px-4">{t('admin.newsletter.logs.status')}</th>
                  <th className="text-left py-3 px-4">{t('admin.newsletter.logs.date')}</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-dark-500">
                      {t('admin.newsletter.noLogs')}
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
        title={editingCampaign ? t('admin.newsletter.editCampaign') : t('admin.newsletter.createCampaign')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.newsletter.form.campaignName')}</label>
            <Input
              value={campaignForm.title}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, title: e.target.value })
              }
              placeholder={t('admin.newsletter.form.campaignNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.newsletter.form.emailSubject')}</label>
            <Input
              value={campaignForm.subject}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, subject: e.target.value })
              }
              placeholder={t('admin.newsletter.form.emailSubjectPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.newsletter.form.emailBody')}</label>
            <textarea
              value={campaignForm.body}
              onChange={(e) =>
                setCampaignForm({ ...campaignForm, body: e.target.value })
              }
              placeholder={t('admin.newsletter.form.emailBodyPlaceholder')}
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
              {t('common.buttons.cancel')}
            </Button>
            <Button onClick={handleCreateCampaign}>
              {editingCampaign ? t('common.buttons.save') : t('common.buttons.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
