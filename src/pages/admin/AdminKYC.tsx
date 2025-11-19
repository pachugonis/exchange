import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useKYCStore } from '../../store/kycStore';
import { useUserStore } from '../../store/userStore';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminKYC: React.FC = () => {
  const { getAllKYCSubmissions, updateKYCStatus } = useKYCStore();
  const { updateProfile } = useUserStore();
  const [selectedKYC, setSelectedKYC] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  const allSubmissions = getAllKYCSubmissions();
  const filteredSubmissions = filterStatus === 'all' 
    ? allSubmissions 
    : allSubmissions.filter(kyc => kyc.status === filterStatus);

  const handleApprove = (userId: string, level: number) => {
    updateKYCStatus(userId, 'verified');
    updateProfile({ kycStatus: 'verified', kycLevel: level });
    toast.success('KYC верификация одобрена');
    setShowDetailsModal(false);
  };

  const handleReject = (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }
    updateKYCStatus(userId, 'rejected', rejectionReason);
    updateProfile({ kycStatus: 'rejected' });
    toast.success('KYC верификация отклонена');
    setRejectionReason('');
    setShowDetailsModal(false);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'warning' as const, icon: Clock, text: 'На проверке' },
      verified: { variant: 'success' as const, icon: CheckCircle, text: 'Одобрено' },
      rejected: { variant: 'error' as const, icon: XCircle, text: 'Отклонено' },
    };
    const { variant, icon: Icon, text } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Верификация</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Управление заявками на верификацию пользователей
          </p>
        </div>
        <Shield className="w-8 h-8 text-primary-500" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Все ({allSubmissions.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            На проверке ({allSubmissions.filter(k => k.status === 'pending').length})
          </Button>
          <Button
            variant={filterStatus === 'verified' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('verified')}
          >
            Одобрено ({allSubmissions.filter(k => k.status === 'verified').length})
          </Button>
          <Button
            variant={filterStatus === 'rejected' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('rejected')}
          >
            Отклонено ({allSubmissions.filter(k => k.status === 'rejected').length})
          </Button>
        </div>
      </Card>

      {/* KYC List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700">
                <th className="text-left py-3 px-4">ID пользователя</th>
                <th className="text-left py-3 px-4">Уровень</th>
                <th className="text-left py-3 px-4">ФИО</th>
                <th className="text-left py-3 px-4">Страна</th>
                <th className="text-left py-3 px-4">Дата подачи</th>
                <th className="text-left py-3 px-4">Статус</th>
                <th className="text-left py-3 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-dark-500">
                    Нет заявок для отображения
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((kyc) => (
                  <tr key={kyc.userId} className="border-b border-dark-100 dark:border-dark-800 hover:bg-dark-50 dark:hover:bg-dark-800">
                    <td className="py-3 px-4 font-mono text-sm">{kyc.userId}</td>
                    <td className="py-3 px-4">
                      <Badge variant="default">Уровень {kyc.level}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {kyc.firstName} {kyc.lastName}
                    </td>
                    <td className="py-3 px-4">{kyc.country}</td>
                    <td className="py-3 px-4 text-sm">
                      {kyc.submittedAt ? formatDate(kyc.submittedAt) : '-'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(kyc.status)}</td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setShowDetailsModal(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Просмотр
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setRejectionReason('');
        }}
        title="Детали KYC заявки"
        size="lg"
      >
        {selectedKYC && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-dark-600 dark:text-dark-400">ID пользователя</label>
                <p className="font-mono text-sm">{selectedKYC.userId}</p>
              </div>
              <div>
                <label className="text-sm text-dark-600 dark:text-dark-400">Уровень</label>
                <p className="font-semibold">Уровень {selectedKYC.level}</p>
              </div>
            </div>

            {/* Personal Info */}
            <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
              <h3 className="font-semibold mb-3">Персональная информация</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-dark-600 dark:text-dark-400">Имя</label>
                  <p>{selectedKYC.firstName}</p>
                </div>
                <div>
                  <label className="text-sm text-dark-600 dark:text-dark-400">Фамилия</label>
                  <p>{selectedKYC.lastName}</p>
                </div>
                <div>
                  <label className="text-sm text-dark-600 dark:text-dark-400">Дата рождения</label>
                  <p>{selectedKYC.dateOfBirth}</p>
                </div>
                <div>
                  <label className="text-sm text-dark-600 dark:text-dark-400">Страна</label>
                  <p>{selectedKYC.country}</p>
                </div>
              </div>
            </div>

            {/* Address (Level 2+) */}
            {selectedKYC.level >= 2 && (
              <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
                <h3 className="font-semibold mb-3">Адрес</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm text-dark-600 dark:text-dark-400">Адрес</label>
                    <p>{selectedKYC.address}</p>
                  </div>
                  <div>
                    <label className="text-sm text-dark-600 dark:text-dark-400">Город</label>
                    <p>{selectedKYC.city}</p>
                  </div>
                  <div>
                    <label className="text-sm text-dark-600 dark:text-dark-400">Индекс</label>
                    <p>{selectedKYC.postalCode || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {selectedKYC.documents && selectedKYC.documents.length > 0 && (
              <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
                <h3 className="font-semibold mb-3">Документы</h3>
                <div className="space-y-2">
                  {selectedKYC.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary-500" />
                        <div>
                          <p className="font-medium text-sm">{doc.fileName}</p>
                          <p className="text-xs text-dark-500">
                            {doc.type === 'passport' && 'Паспорт'}
                            {doc.type === 'id_card' && 'ID карта'}
                            {doc.type === 'driver_license' && 'Водительские права'}
                            {doc.type === 'selfie' && 'Селфи'}
                            {doc.type === 'address_proof' && 'Подтверждение адреса'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDocumentModal(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Просмотр
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Limits */}
            <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
              <h3 className="font-semibold mb-3">Лимиты</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-dark-600 dark:text-dark-400">Дневной лимит</label>
                  <p className="font-semibold">${selectedKYC.dailyLimit?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-dark-600 dark:text-dark-400">Месячный лимит</label>
                  <p className="font-semibold">${selectedKYC.monthlyLimit?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Rejection Reason (if rejected) */}
            {selectedKYC.status === 'rejected' && selectedKYC.rejectionReason && (
              <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
                <h3 className="font-semibold mb-2 text-red-600">Причина отклонения</h3>
                <p className="text-sm">{selectedKYC.rejectionReason}</p>
              </div>
            )}

            {/* Actions */}
            {selectedKYC.status === 'pending' && (
              <div className="border-t border-dark-200 dark:border-dark-700 pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Причина отклонения (если отклоняете)
                  </label>
                  <Input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Укажите причину отклонения"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(selectedKYC.userId, selectedKYC.level)}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Одобрить
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedKYC.userId)}
                    variant="outline"
                    className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                  >
                    <XCircle className="w-4 h-4" />
                    Отклонить
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedDocument(null);
        }}
        title="Просмотр документа"
        size="xl"
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                {selectedDocument.fileName}
              </p>
              <p className="text-xs text-dark-500 mb-4">
                {selectedDocument.type === 'passport' && 'Паспорт'}
                {selectedDocument.type === 'id_card' && 'ID карта'}
                {selectedDocument.type === 'driver_license' && 'Водительские права'}
                {selectedDocument.type === 'selfie' && 'Селфи'}
                {selectedDocument.type === 'address_proof' && 'Подтверждение адреса'}
              </p>
            </div>
            <div className="bg-dark-100 dark:bg-dark-800 rounded-lg p-4 max-h-[600px] overflow-auto">
              <img
                src={selectedDocument.fileUrl}
                alt={selectedDocument.fileName}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
              >
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
