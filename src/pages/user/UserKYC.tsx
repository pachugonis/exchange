import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { useUserStore } from '../../store/userStore';
import { useKYCStore } from '../../store/kycStore';
import type { KYCLevel, KYCLevelInfo } from '../../types/kyc';
import toast from 'react-hot-toast';

const KYC_LEVELS: KYCLevelInfo[] = [
  {
    level: 1,
    name: 'Базовый',
    description: 'Базовая верификация личности',
    dailyLimit: 1000,
    monthlyLimit: 10000,
    requirements: [
      'Имя и фамилия',
      'Дата рождения',
      'Страна проживания',
    ],
    icon: '🔰',
  },
  {
    level: 2,
    name: 'Продвинутый',
    description: 'Расширенная верификация с документами',
    dailyLimit: 10000,
    monthlyLimit: 100000,
    requirements: [
      'Все требования базового уровня',
      'Адрес проживания',
      'Загрузка паспорта или ID',
      'Селфи с документом',
    ],
    icon: '⭐',
  },
  {
    level: 3,
    name: 'Премиум',
    description: 'Полная верификация для максимальных лимитов',
    dailyLimit: 50000,
    monthlyLimit: 500000,
    requirements: [
      'Все требования продвинутого уровня',
      'Подтверждение телефона',
      'Подтверждение адреса (счет за коммунальные услуги)',
    ],
    icon: '💎',
  },
];

export const UserKYC: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useUserStore();
  const { submitKYC, getKYCData, uploadDocument } = useKYCStore();
  
  const [selectedLevel, setSelectedLevel] = useState<KYCLevel>(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    country: '',
    address: '',
    city: '',
    postalCode: '',
    documentType: 'passport' as const,
    documentNumber: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    document?: File;
    selfie?: File;
    addressProof?: File;
  }>({});

  if (!isAuthenticated || !user) {
    navigate('/user/login');
    return null;
  }

  const kycData = getKYCData(user.id);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: 'document' | 'selfie' | 'addressProof', file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate based on level
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.country) {
        toast.error('Заполните все обязательные поля');
        setIsSubmitting(false);
        return;
      }

      if (selectedLevel >= 2 && (!formData.address || !formData.city || !uploadedFiles.document || !uploadedFiles.selfie)) {
        toast.error('Для уровня 2 требуется адрес и загрузка документов');
        setIsSubmitting(false);
        return;
      }

      if (selectedLevel === 3 && !uploadedFiles.addressProof) {
        toast.error('Для уровня 3 требуется подтверждение адреса');
        setIsSubmitting(false);
        return;
      }

      // Upload documents (convert to base64 for storage)
      if (uploadedFiles.document) {
        const base64 = await fileToBase64(uploadedFiles.document);
        uploadDocument(user.id, {
          type: formData.documentType,
          fileName: uploadedFiles.document.name,
          fileUrl: base64,
        });
      }

      if (uploadedFiles.selfie) {
        const base64 = await fileToBase64(uploadedFiles.selfie);
        uploadDocument(user.id, {
          type: 'selfie',
          fileName: uploadedFiles.selfie.name,
          fileUrl: base64,
        });
      }

      if (uploadedFiles.addressProof) {
        const base64 = await fileToBase64(uploadedFiles.addressProof);
        uploadDocument(user.id, {
          type: 'address_proof',
          fileName: uploadedFiles.addressProof.name,
          fileUrl: base64,
        });
      }

      // Submit KYC
      const result = await submitKYC(user.id, selectedLevel, formData);

      if (result.success) {
        // Update user profile
        updateProfile({
          kycStatus: 'pending',
          kycLevel: selectedLevel,
        });

        toast.success('Заявка на верификацию отправлена!');
        navigate('/user/dashboard');
      } else {
        toast.error(result.error || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      toast.error('Ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (!kycData) return null;

    const statusConfig = {
      none: { variant: 'default' as const, icon: AlertCircle, text: 'Не пройдена' },
      pending: { variant: 'warning' as const, icon: Clock, text: 'На рассмотрении' },
      verified: { variant: 'success' as const, icon: CheckCircle, text: 'Верифицирован' },
      rejected: { variant: 'error' as const, icon: XCircle, text: 'Отклонена' },
    };

    const config = statusConfig[kycData.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const renderLevelSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Выберите уровень верификации</h2>
        <p className="text-dark-600 dark:text-dark-400">
          Выберите подходящий уровень в зависимости от ваших потребностей
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KYC_LEVELS.map((level) => (
          <Card
            key={level.level}
            className={`cursor-pointer transition-all ${
              selectedLevel === level.level
                ? 'ring-2 ring-primary-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedLevel(level.level)}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{level.icon}</div>
              <h3 className="text-lg font-bold">{level.name}</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                {level.description}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-dark-600 dark:text-dark-400">Дневной лимит:</span>
                <span className="font-semibold ml-2">${level.dailyLimit.toLocaleString()}</span>
              </div>
              <div className="text-sm">
                <span className="text-dark-600 dark:text-dark-400">Месячный лимит:</span>
                <span className="font-semibold ml-2">${level.monthlyLimit.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-dark-200 dark:border-dark-700 pt-3">
              <p className="text-xs font-medium mb-2">Требования:</p>
              <ul className="text-xs space-y-1">
                {level.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={() => setCurrentStep(2)} className="w-full">
        Продолжить
      </Button>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Персональная информация</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Имя <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Иван"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Фамилия <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Иванов"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Дата рождения <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Страна <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
          >
            <option value="">Выберите страну</option>
            <option value="RU">Россия</option>
            <option value="UA">Украина</option>
            <option value="KZ">Казахстан</option>
            <option value="BY">Беларусь</option>
            <option value="US">США</option>
            <option value="GB">Великобритания</option>
            <option value="DE">Германия</option>
          </select>
        </div>
      </div>

      {selectedLevel >= 2 && (
        <>
          <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
            <h3 className="text-lg font-semibold mb-4">Адрес проживания</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Адрес <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="ул. Примерная, д. 1, кв. 1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Город <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Москва"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Почтовый индекс</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Назад
        </Button>
        <Button onClick={() => setCurrentStep(3)} className="flex-1">
          Продолжить
        </Button>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Загрузка документов</h2>

      {selectedLevel >= 2 && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              Тип документа <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg"
              value={formData.documentType}
              onChange={(e) => handleInputChange('documentType', e.target.value)}
            >
              <option value="passport">Паспорт</option>
              <option value="id_card">ID карта</option>
              <option value="driver_license">Водительские права</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Номер документа <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.documentNumber}
              onChange={(e) => handleInputChange('documentNumber', e.target.value)}
              placeholder="1234 567890"
            />
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-dark-400" />
                <h4 className="font-medium mb-2">Фото документа</h4>
                <p className="text-sm text-dark-600 dark:text-dark-400 mb-3">
                  Загрузите четкое фото вашего документа
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('document', e.target.files?.[0] || null)}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload">
                  <span className="inline-block px-4 py-2 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700 transition">
                    Выбрать файл
                  </span>
                </label>
                {uploadedFiles.document && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {uploadedFiles.document.name}
                  </p>
                )}
              </div>
            </div>

            <div className="border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-dark-400" />
                <h4 className="font-medium mb-2">Селфи с документом</h4>
                <p className="text-sm text-dark-600 dark:text-dark-400 mb-3">
                  Сделайте селфи, держа документ рядом с лицом
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('selfie', e.target.files?.[0] || null)}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload">
                  <span className="inline-block px-4 py-2 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700 transition">
                    Выбрать файл
                  </span>
                </label>
                {uploadedFiles.selfie && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {uploadedFiles.selfie.name}
                  </p>
                )}
              </div>
            </div>

            {selectedLevel === 3 && (
              <div className="border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-dark-400" />
                  <h4 className="font-medium mb-2">Подтверждение адреса</h4>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-3">
                    Счет за коммунальные услуги не старше 3 месяцев
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('addressProof', e.target.files?.[0] || null)}
                    className="hidden"
                    id="address-upload"
                  />
                  <label htmlFor="address-upload">
                    <span className="inline-block px-4 py-2 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700 transition">
                      Выбрать файл
                    </span>
                  </label>
                  {uploadedFiles.addressProof && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {uploadedFiles.addressProof.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Alert variant="info">
        <strong>Важно:</strong> Убедитесь, что все фотографии четкие и читаемые. 
        Документы будут проверены в течение 1-3 рабочих дней.
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          Назад
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1 gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>Отправка...</>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Отправить на проверку
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (kycData?.status === 'pending') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Заявка на рассмотрении</h2>
            <p className="text-dark-600 dark:text-dark-400 mb-6">
              Ваша заявка на верификацию уровня {kycData.level} находится на рассмотрении.
              Мы уведомим вас по email, когда проверка будет завершена.
            </p>
            <Button onClick={() => navigate('/user/dashboard')}>
              Вернуться в кабинет
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (kycData?.status === 'verified') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Верификация пройдена!</h2>
            <p className="text-dark-600 dark:text-dark-400 mb-6">
              Вы успешно прошли верификацию уровня {kycData.level}. 
              Ваши лимиты: ${kycData.dailyLimit?.toLocaleString()} в день, 
              ${kycData.monthlyLimit?.toLocaleString()} в месяц.
            </p>
            <Button onClick={() => navigate('/user/dashboard')}>
              Вернуться в кабинет
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/settings')}
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад в настройки
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">KYC Верификация</h1>
              <p className="text-dark-600 dark:text-dark-400">
                Пройдите верификацию для увеличения лимитов на обмен
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {kycData?.status === 'rejected' && (
          <Alert variant="error" className="mb-6">
            <strong>Заявка отклонена:</strong> {kycData.rejectionReason || 'Не указана причина'}
          </Alert>
        )}

        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                        step < currentStep
                          ? 'bg-primary-500 text-white'
                          : step === currentStep
                          ? 'bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900'
                          : 'bg-dark-200 dark:bg-dark-700 text-dark-500'
                      }`}
                    >
                      {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                    </div>
                    <div className="text-xs mt-2 text-center">
                      {step === 1 && 'Уровень'}
                      {step === 2 && 'Данные'}
                      {step === 3 && 'Документы'}
                    </div>
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition ${
                        step < currentStep ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {currentStep === 1 && renderLevelSelection()}
          {currentStep === 2 && renderPersonalInfo()}
          {currentStep === 3 && renderDocuments()}
        </Card>
      </div>
    </div>
  );
};
