import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MessageSquare, Shield, Key, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from '../../hooks/useTranslation';
import { generateQRCodeURL, formatSecret } from '../../utils/twoFactor';
import toast from 'react-hot-toast';

export const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, updateProfile, enable2FA, verify2FA, disable2FA } = useUserStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    telegram: user?.telegram || '',
  });
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  if (!isAuthenticated || !user) {
    navigate('/user/login');
    return null;
  }

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      phone: formData.phone,
      telegram: formData.telegram,
    });
    toast.success(t('user.settings.profileUpdated'));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEnable2FA = () => {
    const { secret } = enable2FA();
    setTwoFactorSecret(secret);
    setShow2FASetup(true);
  };

  const handleVerify2FA = async () => {
    const result = await verify2FA(verificationCode);
    if (result.success) {
      toast.success(t('user.settings.twoFA.enabled'));
      setShow2FASetup(false);
      setVerificationCode('');
      setTwoFactorSecret('');
    } else {
      toast.error(result.error || t('user.settings.twoFA.verificationError'));
    }
  };

  const handleDisable2FA = async () => {
    const result = await disable2FA(disableCode);
    if (result.success) {
      toast.success(t('user.settings.twoFA.disabled'));
      setDisableCode('');
    } else {
      toast.error(result.error || t('user.settings.twoFA.disableError'));
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            to="/user/dashboard"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('user.settings.backToDashboard')}
          </Link>
          <h1 className="text-3xl font-bold">{t('navigation.settings')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('user.settings.description')}
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'profile', label: t('user.settings.profile'), icon: <User className="w-4 h-4" /> },
            { id: 'security', label: t('user.settings.security'), icon: <Mail className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        <TabPanel isActive={activeTab === 'profile'}>
          <Card>
            <h3 className="text-xl font-semibold mb-6">{t('user.settings.profileInfo')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('user.settings.name')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('user.settings.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    className="pl-10 bg-dark-50 dark:bg-dark-700"
                    disabled
                  />
                </div>
                <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                  {t('user.settings.emailCannotChange')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('user.settings.phoneOptional')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('user.settings.telegramOptional')}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <Input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => handleChange('telegram', e.target.value)}
                    placeholder="@username"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                {t('user.settings.saveChanges')}
              </Button>
            </div>
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'security'}>
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-semibold mb-4">{t('user.settings.accountSecurity')}</h3>

              <div className="space-y-4">
                {/* Password Change Section */}
                <div className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-6 h-6 text-primary-500" />
                      <div>
                        <h4 className="font-medium">{t('user.settings.changePassword')}</h4>
                        <p className="text-sm text-dark-600 dark:text-dark-400">
                          {t('user.settings.changePasswordDescription')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Alert variant="info">
                      {t('user.settings.passwordResetInfo')}{' '}
                      <Link 
                        to="/user/forgot-password" 
                        className="text-primary-500 hover:text-primary-600 font-medium underline"
                      >
                        {t('user.settings.passwordRecovery')}
                      </Link>
                      . {t('user.settings.emailLinkSent')}
                    </Alert>

                    <Link to="/user/forgot-password">
                      <Button variant="outline" className="gap-2 w-full sm:w-auto">
                        <Lock className="w-4 h-4" />
                        {t('user.settings.changePassword')}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 2FA Section */}
                <div className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary-500" />
                      <div>
                        <h4 className="font-medium">{t('user.settings.twoFactorAuth')}</h4>
                        <p className="text-sm text-dark-600 dark:text-dark-400">
                          {t('user.settings.twoFactorDesc')}
                        </p>
                      </div>
                    </div>
                    {user.twoFactorEnabled ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                        {t('user.settings.enabled')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-dark-200 dark:bg-dark-600 text-dark-600 dark:text-dark-300 text-sm rounded-full">
                        {t('user.settings.disabled')}
                      </span>
                    )}
                  </div>

                  {!user.twoFactorEnabled ? (
                    !show2FASetup ? (
                      <Button onClick={handleEnable2FA} className="gap-2">
                        <Shield className="w-4 h-4" />
                        {t('user.settings.enable2FA')}
                      </Button>
                    ) : (
                      <div className="space-y-4 mt-4">
                        <Alert variant="info">
                          {t('user.settings.downloadAuthApp')}
                        </Alert>

                        <div className="flex flex-col items-center gap-4 p-4 bg-white dark:bg-dark-800 rounded-lg">
                          <div className="p-4 bg-white rounded-lg">
                            <img 
                              src={generateQRCodeURL(user.email, twoFactorSecret)} 
                              alt="QR Code for 2FA"
                              className="w-48 h-48"
                            />
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                              {t('user.settings.orEnterManually')}
                            </p>
                            <code className="px-4 py-2 bg-dark-100 dark:bg-dark-700 rounded text-sm font-mono">
                              {formatSecret(twoFactorSecret)}
                            </code>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('user.settings.enterCodeToConfirm')}
                          </label>
                          <Input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="text-center text-lg tracking-widest font-mono"
                            maxLength={6}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleVerify2FA}
                            disabled={verificationCode.length !== 6}
                            className="gap-2"
                          >
                            <Key className="w-4 h-4" />
                            {t('user.settings.confirm')}
                          </Button>
                          <Button 
                            onClick={() => {
                              setShow2FASetup(false);
                              setTwoFactorSecret('');
                              setVerificationCode('');
                            }}
                            variant="outline"
                          >
                            {t('user.settings.cancel')}
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4 mt-4">
                      <Alert variant="success">
                        {t('user.settings.twoFactorSuccess')}
                      </Alert>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('user.settings.enterCodeToDisable')}
                        </label>
                        <Input
                          type="text"
                          value={disableCode}
                          onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="text-center text-lg tracking-widest font-mono"
                          maxLength={6}
                        />
                      </div>

                      <Button 
                        onClick={handleDisable2FA}
                        disabled={disableCode.length !== 6}
                        variant="outline"
                        className="gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        {t('user.settings.disable2FA')}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary-500" />
                      <div>
                        <h4 className="font-medium">{t('user.settings.kycVerification')}</h4>
                        <p className="text-sm text-dark-600 dark:text-dark-400">
                          {t('user.settings.kycDesc')}
                        </p>
                      </div>
                    </div>
                    {user.kycStatus === 'verified' ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {t('user.settings.level')} {user.kycLevel}
                      </span>
                    ) : user.kycStatus === 'pending' ? (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('user.settings.underReview')}
                      </span>
                    ) : user.kycStatus === 'rejected' ? (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {t('user.settings.rejected')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-dark-200 dark:bg-dark-600 text-dark-600 dark:text-dark-300 text-sm rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('user.settings.notPassed')}
                      </span>
                    )}
                  </div>
                  <Link to="/user/kyc">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="w-4 h-4" />
                      {user.kycStatus === 'verified' 
                        ? t('user.settings.increaseLevel') 
                        : user.kycStatus === 'pending'
                        ? t('user.settings.viewStatus')
                        : t('user.settings.passVerification')}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
