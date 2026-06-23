import React, { useState } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { useAnnouncementStore } from '../../store/announcementStore';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminAnnouncements: React.FC = () => {
  const { 
    getAllAnnouncements, 
    createAnnouncement, 
    updateAnnouncement,
    deleteAnnouncement, 
    toggleAnnouncementStatus 
  } = useAnnouncementStore();
  const { t } = useTranslation();
  
  const announcements = getAllAnnouncements();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publishDate) {
      toast.error(t('admin.announcements.selectDate'));
      return;
    }

    const publishTimestamp = new Date(publishDate).getTime();
    const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;
    
    if (editingId) {
      // Update existing announcement
      updateAnnouncement(editingId, {
        message: message.trim(),
        publishDate: publishTimestamp,
        endDate: endTimestamp,
      });
      toast.success(t('admin.announcements.updated'));
      setEditingId(null);
    } else {
      // Create new announcement
      const result = createAnnouncement(message, publishTimestamp, endTimestamp);
      if (result.success) {
        toast.success(t('admin.announcements.created'));
      } else {
        toast.error(result.error || t('admin.announcements.createError'));
        return;
      }
    }

    // Reset form
    setMessage('');
    setPublishDate('');
    setEndDate('');
    setShowForm(false);
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setMessage(announcement.message);
    setPublishDate(new Date(announcement.publishDate).toISOString().slice(0, 16));
    setEndDate(announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : '');
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('admin.announcements.confirmDelete'))) {
      deleteAnnouncement(id);
      toast.success(t('admin.announcements.deleted'));
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleAnnouncementStatus(id);
    toast.success(t('admin.announcements.statusChanged'));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setMessage('');
    setPublishDate('');
    setEndDate('');
  };

  const getMinDateTime = () => {
    return new Date().toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('admin.announcements.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('admin.announcements.subtitle')}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('admin.announcements.create')}
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {editingId ? t('admin.announcements.edit') : t('admin.announcements.new')}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.announcements.message')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('admin.announcements.messagePlaceholder')}
                className="w-full h-32 px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
                maxLength={500}
              />
              <p className="text-xs text-dark-500 mt-1">
                {message.length}/500 {t('admin.announcements.characters')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.announcements.publishDate')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                min={getMinDateTime()}
                required
              />
              <p className="text-xs text-dark-500 mt-1">
                {t('admin.announcements.publishNote')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.announcements.endDate')}
              </label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={publishDate || getMinDateTime()}
              />
              <p className="text-xs text-dark-500 mt-1">
                {t('admin.announcements.endNote')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? t('admin.announcements.update') : t('common.buttons.add')}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t('common.buttons.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Alert variant="info">
          {t('admin.announcements.noAnnouncements')}
        </Alert>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const now = Date.now();
            const isPublished = announcement.publishDate <= now;
            const isPending = announcement.publishDate > now;
            const isExpired = announcement.endDate && announcement.endDate <= now;

            return (
              <Card key={announcement.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {t('admin.announcements.announcementId')} #{announcement.id.slice(-6)}
                      </h3>
                      {announcement.isActive && isPublished && !isExpired && (
                        <Badge variant="success">{t('admin.announcements.published')}</Badge>
                      )}
                      {announcement.isActive && isPending && (
                        <Badge variant="warning">{t('admin.announcements.scheduled')}</Badge>
                      )}
                      {announcement.isActive && isExpired && (
                        <Badge variant="error">{t('admin.announcements.expired')}</Badge>
                      )}
                      {!announcement.isActive && (
                        <Badge variant="default">{t('admin.announcements.hidden')}</Badge>
                      )}
                    </div>
                    <p className="text-dark-600 dark:text-dark-300 mb-3">
                      {announcement.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-500">
                      <span>
                        {t('admin.announcements.created')}: {formatDate(announcement.createdAt)}
                      </span>
                      <span>
                        {t('admin.announcements.publishDate')}: {formatDate(announcement.publishDate)}
                      </span>
                      {announcement.endDate && (
                        <span>
                          {t('admin.announcements.endDate')}: {formatDate(announcement.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-dark-200 dark:border-dark-700">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(announcement)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('common.buttons.edit')}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(announcement.id)}
                    className="gap-2"
                  >
                    {announcement.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        {t('admin.announcements.hide')}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        {t('admin.announcements.show')}
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(announcement.id)}
                    className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.buttons.delete')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
