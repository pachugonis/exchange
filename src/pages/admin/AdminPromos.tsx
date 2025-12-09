import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { usePromoStore } from '../../store/promoStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { 
  Plus, 
  Ticket, 
  Edit2, 
  Trash2, 
  Copy,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Percent,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { PromoCode } from '../../types/promo';

export const AdminPromos: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode } = usePromoStore();
  const { t } = useTranslation();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromoCode>>({
    code: '',
    discount: 0,
    type: 'commission',
    minAmount: 0,
    maxUses: undefined,
    isActive: true,
  });

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || formData.code.trim() === '') {
      toast.error(t('admin.promos.messages.enterCode'));
      return;
    }

    if (formData.type === 'commission' && (!formData.discount || formData.discount <= 0)) {
      toast.error(t('admin.promos.messages.enterDiscount'));
      return;
    }

    if (formData.type === 'bonus' && (!formData.bonusAmount || formData.bonusAmount <= 0)) {
      toast.error(t('admin.promos.messages.enterBonus'));
      return;
    }

    if (editingCode) {
      // Update existing promo
      updatePromoCode(editingCode, formData);
      toast.success(t('admin.promos.messages.updated'));
      setEditingCode(null);
    } else {
      // Check if code already exists
      const exists = promoCodes.find(p => p.code.toLowerCase() === formData.code!.toLowerCase());
      if (exists) {
        toast.error(t('admin.promos.messages.codeExists'));
        return;
      }

      // Create new promo
      const newPromo: PromoCode = {
        code: formData.code.toUpperCase(),
        discount: formData.discount || 0,
        type: formData.type || 'commission',
        bonusAmount: formData.bonusAmount,
        minAmount: formData.minAmount,
        maxUses: formData.maxUses,
        usesCount: 0,
        expiresAt: formData.expiresAt,
        isActive: formData.isActive ?? true,
        createdAt: Date.now(),
      };

      addPromoCode(newPromo);
      toast.success(t('admin.promos.messages.created'));
    }

    // Reset form
    setFormData({
      code: '',
      discount: 0,
      type: 'commission',
      minAmount: 0,
      maxUses: undefined,
      isActive: true,
    });
    setIsCreating(false);
  };

  const handleEdit = (promo: PromoCode) => {
    setFormData(promo);
    setEditingCode(promo.code);
    setIsCreating(true);
  };

  const handleDelete = (code: string) => {
    if (confirm(t('admin.promos.messages.confirmDelete'))) {
      deletePromoCode(code);
      toast.success(t('admin.promos.messages.deleted'));
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('admin.promos.messages.codeCopied'));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isPromoExpired = (promo: PromoCode) => {
    return promo.expiresAt && promo.expiresAt < Date.now();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('admin.promos.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('admin.promos.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingCode(null);
            setFormData({
              code: '',
              discount: 0,
              type: 'commission',
              minAmount: 0,
              maxUses: undefined,
              isActive: true,
            });
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? t('common.buttons.cancel') : t('admin.promos.create')}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <h2 className="text-xl font-semibold mb-6">
            {editingCode ? t('admin.promos.edit') : t('admin.promos.new')}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.promos.codeField')} <span className="text-red-500">{t('admin.promos.required')}</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME2025"
                  className="font-mono"
                  disabled={!!editingCode}
                />
                {!editingCode && (
                  <Button type="button" onClick={handleGenerateCode} variant="outline">
                    {t('admin.promos.generate')}
                  </Button>
                )}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.promos.type')} <span className="text-red-500">{t('admin.promos.required')}</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700 transition">
                  <input
                    type="radio"
                    name="type"
                    value="commission"
                    checked={formData.type === 'commission'}
                    onChange={(e) => setFormData({ ...formData, type: 'commission' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">{t('admin.promos.commissionDiscount')}</div>
                    <div className="text-xs text-dark-500">{t('admin.promos.percentOfCommission')}</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700 transition">
                  <input
                    type="radio"
                    name="type"
                    value="bonus"
                    checked={formData.type === 'bonus'}
                    onChange={(e) => setFormData({ ...formData, type: 'bonus' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">{t('admin.promos.fixedBonus')}</div>
                    <div className="text-xs text-dark-500">{t('admin.promos.amountInCurrency')}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Discount or Bonus Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.type === 'commission' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.promos.discountPercent')} <span className="text-red-500">{t('admin.promos.required')}</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                    placeholder="10"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.promos.bonusAmount')} <span className="text-red-500">{t('admin.promos.required')}</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bonusAmount || ''}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: parseFloat(e.target.value) })}
                    placeholder="50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.promos.minExchangeAmount')}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minAmount || ''}
                  onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Max Uses and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.promos.maxUses')}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder={t('admin.promos.unlimited')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.promos.expiryDate')}
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    expiresAt: e.target.value ? new Date(e.target.value).getTime() : undefined 
                  })}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium">{t('admin.promos.active')}</span>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    {t('admin.promos.activeDescription')}
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                {editingCode ? t('admin.promos.saveChanges') : t('admin.promos.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCode(null);
                  setFormData({
                    code: '',
                    discount: 0,
                    type: 'commission',
                    minAmount: 0,
                    maxUses: undefined,
                    isActive: true,
                  });
                }}
              >
                {t('common.buttons.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Promo Codes List */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Ticket className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold">{t('admin.promos.allPromos')} ({promoCodes.length})</h2>
        </div>

        <div className="space-y-4">
          {promoCodes.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('admin.promos.notFound')}</p>
              <p className="text-sm mt-1">{t('admin.promos.createFirst')}</p>
            </div>
          ) : (
            promoCodes.map((promo) => (
              <div
                key={promo.code}
                className="p-4 border border-dark-200 dark:border-dark-700 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-lg font-bold font-mono bg-dark-100 dark:bg-dark-700 px-3 py-1 rounded">
                        {promo.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="p-1 hover:bg-dark-200 dark:hover:bg-dark-600 rounded transition"
                        title={t('admin.promos.copyCode')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {isPromoExpired(promo) || !promo.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <XCircle className="w-3 h-3" /> {t('admin.promos.inactive')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" /> {t('admin.promos.active')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-dark-500 dark:text-dark-400 text-xs mb-1">{t('admin.promos.typeLabel')}</div>
                        <div className="flex items-center gap-1">
                          {promo.type === 'commission' ? (
                            <>
                              <Percent className="w-3 h-3" />
                              <span>{t('admin.promos.discount')} {promo.discount}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3" />
                              <span>{t('admin.promos.bonus')} ${promo.bonusAmount}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-dark-500 dark:text-dark-400 text-xs mb-1">{t('admin.promos.used')}</div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {promo.usesCount || 0}
                            {promo.maxUses ? ` / ${promo.maxUses}` : ''}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-dark-500 dark:text-dark-400 text-xs mb-1">{t('admin.promos.minAmount')}</div>
                        <div>${promo.minAmount || 0}</div>
                      </div>

                      <div>
                        <div className="text-dark-500 dark:text-dark-400 text-xs mb-1">{t('admin.promos.expiryDate')}</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {promo.expiresAt ? (
                            <span className={promo.expiresAt < Date.now() ? 'text-red-500' : ''}>
                              {formatDate(promo.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-dark-500">{t('admin.promos.permanent')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded transition"
                      title={t('common.buttons.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.code)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition"
                      title={t('common.buttons.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
