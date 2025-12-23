import { useLicenseStore } from '../../store/licenseStore';
import { formatDaysRemaining, formatExpirationDate } from '../../utils/license';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { AlertTriangle, XCircle, Clock, Shield } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function LicenseWarningBanner() {
  const { license, statusInfo } = useLicenseStore();
  const { t } = useTranslation();

  // Don't show banner if no license or license is fully valid
  if (!license) {
    return null;
  }

  // Grace Period Warning (Critical - Red Banner)
  if (statusInfo.inGracePeriod && statusInfo.gracePeriodSeverity === 'critical') {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('licenseBanner.critical.title')}</p>
                <p className="text-sm opacity-90">
                  {t('licenseBanner.critical.message', { days: statusInfo.gracePeriodDaysRemaining })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="/admin/license"
            >
              {t('licenseBanner.buttons.viewLicense')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grace Period Warning (Urgent - Orange Banner)
  if (statusInfo.inGracePeriod && statusInfo.gracePeriodSeverity === 'urgent') {
    return (
      <div className="bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('licenseBanner.urgent.title')}</p>
                <p className="text-sm opacity-90">
                  {t('licenseBanner.urgent.message', { days: statusInfo.gracePeriodDaysRemaining })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 border-white flex-shrink-0"
              href="/admin/license"
            >
              {t('licenseBanner.buttons.troubleshoot')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grace Period Warning (Warning - Yellow Banner)
  if (statusInfo.inGracePeriod && statusInfo.gracePeriodSeverity === 'warning') {
    return (
      <div className="bg-yellow-500 text-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {t('licenseBanner.warning.message', { days: statusInfo.gracePeriodDaysRemaining })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-300 flex-shrink-0"
              href="/admin/license"
            >
              {t('licenseBanner.buttons.details')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expired License (Red Banner)
  if (license.status === 'expired' && !statusInfo.inGracePeriod) {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('licenseBanner.expired.title')}</p>
                <p className="text-sm opacity-90">
                  {t('licenseBanner.expired.message', { date: formatExpirationDate(license.expiresAt) })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="mailto:sales@exchangekit.io"
            >
              {t('licenseBanner.buttons.renew')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Suspended License (Red Banner)
  if (license.status === 'suspended') {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('licenseBanner.suspended.title')}</p>
                <p className="text-sm opacity-90">
                  {t('licenseBanner.suspended.message')}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="mailto:support@exchangekit.io"
            >
              {t('licenseBanner.buttons.contactSupport')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expiring Soon - 7 Days (Orange Banner)
  if (statusInfo.needsRenewal && statusInfo.daysRemaining !== null && statusInfo.daysRemaining <= 7) {
    return (
      <div className="bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('licenseBanner.expiringSoon7.title')}</p>
                <p className="text-sm opacity-90">
                  {t('licenseBanner.expiringSoon7.message', { days: formatDaysRemaining(statusInfo.daysRemaining!) })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 border-white flex-shrink-0"
              href="mailto:sales@exchangekit.io"
            >
              {t('licenseBanner.buttons.renewNow')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expiring Soon - 30 Days (Yellow Banner)
  if (statusInfo.needsRenewal && statusInfo.daysRemaining !== null && statusInfo.daysRemaining <= 30) {
    return (
      <div className="bg-yellow-500 text-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {t('licenseBanner.expiringSoon30.message', { days: formatDaysRemaining(statusInfo.daysRemaining!) })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-300 flex-shrink-0"
              href="mailto:sales@exchangekit.io"
            >
              {t('licenseBanner.buttons.renew')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Domain Mismatch Warning
  if (!statusInfo.domainMatch) {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">{t('licenseBanner.domainMismatch.title')}</p>
                <p className="text-sm opacity-90">
                  {t('licenseBanner.domainMismatch.message', { domain: statusInfo.currentDomain })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="/admin/license"
            >
              {t('licenseBanner.buttons.manageDomains')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
