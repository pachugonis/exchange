import { useLicenseStore } from '../../store/licenseStore';
import { formatDaysRemaining, formatExpirationDate } from '../../utils/license';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { AlertTriangle, XCircle, Clock, Shield } from 'lucide-react';

export function LicenseWarningBanner() {
  const { license, statusInfo } = useLicenseStore();

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
                <p className="font-semibold">Critical: License Validation Failed</p>
                <p className="text-sm opacity-90">
                  Grace period expires in {statusInfo.gracePeriodDaysRemaining} days. 
                  Platform will become inaccessible. Please restore network connection immediately.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="/admin/license"
            >
              View License
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
                <p className="font-semibold">License Validation Issue</p>
                <p className="text-sm opacity-90">
                  Operating in grace period mode. {statusInfo.gracePeriodDaysRemaining} days remaining.
                  Check your network connection.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 border-white flex-shrink-0"
              href="/admin/license"
            >
              Troubleshoot
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
                  License validation pending. Grace period: {statusInfo.gracePeriodDaysRemaining} days remaining.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-300 flex-shrink-0"
              href="/admin/license"
            >
              Details
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
                <p className="font-semibold">License Expired</p>
                <p className="text-sm opacity-90">
                  Your license expired on {formatExpirationDate(license.expiresAt)}. 
                  Renew now to continue using the platform.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="mailto:sales@4ex.com"
            >
              Renew License
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
                <p className="font-semibold">License Suspended</p>
                <p className="text-sm opacity-90">
                  Your license has been suspended. Please contact support for assistance.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="mailto:support@4ex.com"
            >
              Contact Support
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
                <p className="font-semibold">License Expiring Soon</p>
                <p className="text-sm opacity-90">
                  Your license expires in {formatDaysRemaining(statusInfo.daysRemaining)}. 
                  Renew now to avoid service interruption.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 border-white flex-shrink-0"
              href="mailto:sales@4ex.com"
            >
              Renew Now
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
                  Your license expires in {formatDaysRemaining(statusInfo.daysRemaining)}. 
                  Consider renewing soon.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-300 flex-shrink-0"
              href="mailto:sales@4ex.com"
            >
              Renew
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
                <p className="font-semibold">Domain Mismatch</p>
                <p className="text-sm opacity-90">
                  This license is not authorized for domain: {statusInfo.currentDomain}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 border-white flex-shrink-0"
              href="/admin/license"
            >
              Manage Domains
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
