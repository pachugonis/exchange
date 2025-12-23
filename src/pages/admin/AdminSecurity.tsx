import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Lock, Key, Eye, EyeOff, Check, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAdminStore } from '../../store/adminStore';
import { useTranslation } from '../../hooks/useTranslation';
import { generateSecret, generateQRCodeURL, formatSecret, verifyTOTP } from '../../utils/twoFactor';
import toast from 'react-hot-toast';

export const AdminSecurity: React.FC = () => {
  const { isAuthenticated, username, twoFactorEnabled, twoFactorSecret, changePassword, enableTwoFactor, disableTwoFactor } = useAdminStore();
  const { t } = useTranslation();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [tempSecret, setTempSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('admin.security.messages.fillAllFields'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('admin.security.messages.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('admin.security.messages.passwordMismatch'));
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      toast.success(t('admin.security.messages.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(t('admin.security.messages.incorrectPassword'));
    }
  };

  const handleSetup2FA = () => {
    const secret = generateSecret();
    setTempSecret(secret);
    setShow2FASetup(true);
    setVerificationCode('');
  };

  const handleEnable2FA = async () => {
    if (!verificationCode) {
      toast.error(t('admin.security.messages.enterCode'));
      return;
    }

    const isValid = await verifyTOTP(tempSecret, verificationCode);
    if (isValid) {
      enableTwoFactor(tempSecret);
      toast.success(t('admin.security.messages.twoFactorEnabled'));
      setShow2FASetup(false);
      setTempSecret('');
      setVerificationCode('');
    } else {
      toast.error(t('admin.security.messages.invalidCode'));
    }
  };

  const handleDisable2FA = () => {
    if (confirm(t('admin.security.messages.confirmDisable2FA'))) {
      disableTwoFactor();
      toast.success(t('admin.security.messages.twoFactorDisabled'));
    }
  };

  const qrCodeURL = tempSecret ? generateQRCodeURL(username || 'admin', tempSecret, 'ExchangeKit Admin') : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('admin.security.title')}</h1>
        <p className="text-dark-600 dark:text-dark-400">
          {t('admin.security.subtitle')}
        </p>
      </div>

      {/* Change Password */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t('admin.security.changePassword.title')}
        </h2>
        <p className="text-sm text-dark-600 dark:text-dark-400 mb-4">
          {t('admin.security.changePassword.description')}
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.security.changePassword.currentPassword')}
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('admin.security.changePassword.currentPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.security.changePassword.newPassword')}
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('admin.security.changePassword.newPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-dark-500 mt-1">
              {t('admin.security.changePassword.passwordRequirements')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.security.changePassword.confirmPassword')}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('admin.security.changePassword.confirmPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button onClick={handleChangePassword} className="gap-2">
            <Lock className="w-4 h-4" />
            {t('admin.security.changePassword.submit')}
          </Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('admin.security.twoFactor.title')}
        </h2>
        <p className="text-sm text-dark-600 dark:text-dark-400 mb-4">
          {t('admin.security.twoFactor.description')}
        </p>

        <div className="space-y-4">
          {/* 2FA Status */}
          <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-dark-200 dark:bg-dark-600 text-dark-500'}`}>
                {twoFactorEnabled ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-medium">
                  {twoFactorEnabled ? t('admin.security.twoFactor.enabled') : t('admin.security.twoFactor.disabled')}
                </div>
                <div className="text-sm text-dark-600 dark:text-dark-400">
                  {twoFactorEnabled ? t('admin.security.twoFactor.statusEnabled') : t('admin.security.twoFactor.statusDisabled')}
                </div>
              </div>
            </div>
            {!twoFactorEnabled ? (
              <Button onClick={handleSetup2FA} className="gap-2">
                <Key className="w-4 h-4" />
                {t('admin.security.twoFactor.enable')}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleDisable2FA} className="gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <X className="w-4 h-4" />
                {t('admin.security.twoFactor.disable')}
              </Button>
            )}
          </div>

          {/* 2FA Setup */}
          {show2FASetup && (
            <div className="p-6 border-2 border-primary-500 rounded-lg bg-primary-50 dark:bg-primary-900/10">
              <h3 className="text-lg font-semibold mb-4">{t('admin.security.twoFactor.setup.title')}</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-3">
                    {t('admin.security.twoFactor.setup.step1')}
                  </p>
                  <div className="flex justify-center p-4 bg-white dark:bg-dark-800 rounded-lg">
                    <img src={qrCodeURL} alt="QR Code" className="w-48 h-48" />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-2">
                    {t('admin.security.twoFactor.setup.step2')}
                  </p>
                  <div className="p-3 bg-dark-100 dark:bg-dark-700 rounded-lg font-mono text-center text-lg">
                    {formatSecret(tempSecret)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.security.twoFactor.setup.step3')}
                  </label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t('admin.security.twoFactor.setup.codePlaceholder')}
                    className="text-center text-2xl tracking-wider font-mono"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleEnable2FA} className="gap-2">
                    <Check className="w-4 h-4" />
                    {t('admin.security.twoFactor.setup.verify')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShow2FASetup(false);
                      setTempSecret('');
                      setVerificationCode('');
                    }}
                  >
                    {t('admin.security.twoFactor.setup.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info about 2FA apps */}
          {!twoFactorEnabled && !show2FASetup && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{t('admin.security.twoFactor.info.title')}</strong><br />
                {t('admin.security.twoFactor.info.description')}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
