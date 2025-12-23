import { useState } from 'react';
import { useLicenseStore } from '../../store/licenseStore';
import {
  formatExpirationDate,
  formatDaysRemaining,
  getLicenseTierName,
} from '../../utils/license';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  Globe,
  Zap,
  Activity,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default function AdminLicense() {
  const {
    license,
    statusInfo,
    isValidating,
    lastValidated,
    validationLogs,
    validateCurrentLicense,
    getValidationLogs,
  } = useLicenseStore();

  const [showLogs, setShowLogs] = useState(false);

  const handleManualValidation = async () => {
    await validateCurrentLicense();
  };

  const getStatusBadge = () => {
    if (!license) {
      return <Badge variant="error">No License</Badge>;
    }

    switch (license.status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'expired':
        return <Badge variant="error">Expired</Badge>;
      case 'suspended':
        return <Badge variant="warning">Suspended</Badge>;
      case 'revoked':
        return <Badge variant="error">Revoked</Badge>;
      case 'pending':
        return <Badge variant="info">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getGracePeriodBadge = () => {
    if (!statusInfo.inGracePeriod) {
      return null;
    }

    const severityColors = {
      none: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      urgent: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    };

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${severityColors[statusInfo.gracePeriodSeverity]}`}>
        <AlertTriangle className="w-4 h-4" />
        <span>Grace Period: {statusInfo.gracePeriodDaysRemaining} days remaining</span>
      </div>
    );
  };

  if (!license) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <XCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold mb-1">No License Configured</h3>
            <p className="text-sm">Please activate a license to use the platform.</p>
            <Button href="/license-activation" className="mt-3">
              Activate License
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">License Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your platform license
          </p>
        </div>
        <Button
          onClick={handleManualValidation}
          disabled={isValidating}
          variant="outline"
        >
          {isValidating ? (
            <>
              <Loader className="w-4 h-4 mr-2" />
              Validating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Revalidate
            </>
          )}
        </Button>
      </div>

      {/* Grace Period Warning */}
      {statusInfo.inGracePeriod && (
        <Alert variant="warning">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold mb-1">Operating in Grace Period Mode</h3>
            <p className="text-sm">
              Unable to validate license with server. You have {statusInfo.gracePeriodDaysRemaining} days remaining
              before the license becomes invalid. Please check your network connection.
            </p>
          </div>
        </Alert>
      )}

      {/* Renewal Warning */}
      {statusInfo.needsRenewal && !statusInfo.inGracePeriod && (
        <Alert variant="warning">
          <Clock className="w-5 h-5" />
          <div>
            <h3 className="font-semibold mb-1">License Renewal Recommended</h3>
            <p className="text-sm">
              Your license expires in {formatDaysRemaining(statusInfo.daysRemaining)}. 
              Renew now to avoid service interruption.
            </p>
            <Button href="mailto:sales@exchangekit.io" className="mt-3" size="sm">
              Contact Sales
            </Button>
          </div>
        </Alert>
      )}

      {/* License Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* License Type */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Type</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {getLicenseTierName(license.licenseType)}
              </p>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <div className="mt-1">
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </Card>

        {/* Expiration */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expires</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {license.expiresAt ? formatDaysRemaining(statusInfo.daysRemaining) : 'Never'}
              </p>
            </div>
          </div>
        </Card>

        {/* Domains */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Domains</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {statusInfo.boundDomains.length} / {license.maxDomains === -1 ? '∞' : license.maxDomains}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* License Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          License Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* License Key */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              License Key
            </label>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {license.licenseKey}
            </p>
          </div>

          {/* Customer Email */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Customer Email
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {license.customerEmail}
            </p>
          </div>

          {/* Issued Date */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Issued Date
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(license.issuedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Expiration Date
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatExpirationDate(license.expiresAt)}
            </p>
          </div>

          {/* Last Validated */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Last Validated
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {lastValidated ? new Date(lastValidated).toLocaleString() : 'Never'}
            </p>
          </div>

          {/* Validation Count */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Validations
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {license.validationCount}
            </p>
          </div>
        </div>
      </Card>

      {/* Bound Domains */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bound Domains
        </h2>
        <div className="space-y-3">
          {license.boundDomains.map((binding) => (
            <div
              key={binding.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {binding.protocol}://{binding.domain}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Bound: {new Date(binding.boundAt).toLocaleDateString()} • 
                    Validated {binding.validationCount} times
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {binding.domain === statusInfo.currentDomain && (
                  <Badge variant="success">Current</Badge>
                )}
                {binding.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="error">Inactive</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Enabled Features */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Enabled Features
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(license.features).map(([feature, enabled]) => (
            <div
              key={feature}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                enabled
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {enabled ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium capitalize">
                {feature.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Validation Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Validation History
          </h2>
          <Button
            onClick={() => setShowLogs(!showLogs)}
            variant="outline"
            size="sm"
          >
            {showLogs ? 'Hide' : 'Show'} Logs
          </Button>
        </div>

        {showLogs && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validationLogs.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                No validation logs available
              </p>
            ) : (
              validationLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                >
                  <div className="mt-0.5">
                    {log.result === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : log.result === 'grace_period' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{log.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()} • {log.domain}
                    </p>
                    {log.errorDetails && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {log.errorDetails}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
