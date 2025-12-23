import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicenseStore } from '../store/licenseStore';
import { getCurrentDomain, getCurrentProtocol, isValidLicenseKeyFormat } from '../utils/license';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Loader } from '../components/ui/Loader';
import { Shield, AlertTriangle, CheckCircle, Globe, Lock, Info } from 'lucide-react';

export default function LicenseActivation() {
  const navigate = useNavigate();
  const { activateNewLicense, isValidating, testServerConnection } = useLicenseStore();
  
  const [licenseKey, setLicenseKey] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  const currentDomain = getCurrentDomain();
  const currentProtocol = getCurrentProtocol();

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    setError('');

    try {
      const result = await testServerConnection();
      setConnectionStatus(result);
    } catch (err) {
      setConnectionStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!licenseKey.trim()) {
      setError('Please enter your license key');
      return;
    }

    if (!isValidLicenseKeyFormat(licenseKey.trim())) {
      setError('Invalid license key format. Expected format: LIC-XXXX-XXXX-XXXX-XXXX');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!termsAgreed) {
      setError('You must agree to the license terms to continue');
      return;
    }

    // Attempt activation
    try {
      const result = await activateNewLicense(licenseKey.trim(), customerEmail.trim(), termsAgreed);
      
      if (result.success) {
        setSuccess(result.message);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Activate Your License
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your license key to activate ExchangeKit
          </p>
        </div>

        <Card className="p-6 mb-6">
          {/* Current Domain Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Domain Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Domain: <strong>{currentDomain}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Protocol: <strong>{currentProtocol.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Your license will be bound to this domain
                </p>
              </div>
            </div>
          </div>

          {/* Connection Test */}
          <div className="mb-6">
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              variant="outline"
              className="w-full"
            >
              {testingConnection ? (
                <>
                  <Loader className="w-4 h-4 mr-2" />
                  Testing Connection...
                </>
              ) : (
                'Test License Server Connection'
              )}
            </Button>

            {connectionStatus && (
              <div className={`mt-3 p-3 rounded-lg ${
                connectionStatus.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionStatus.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{connectionStatus.message}</span>
                  {connectionStatus.latency && (
                    <span className="text-xs ml-auto">({connectionStatus.latency}ms)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            {/* License Key */}
            <div>
              <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Key *
              </label>
              <Input
                id="licenseKey"
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="LIC-XXXX-XXXX-XXXX-XXXX"
                disabled={isValidating}
                maxLength={24}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the license key you received via email
              </p>
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isValidating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use the email address associated with your license purchase
              </p>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                id="termsAgreed"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                disabled={isValidating}
                className="mt-1"
              />
              <label htmlFor="termsAgreed" className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                I agree to the{' '}
                <a href="/license-terms" target="_blank" className="text-blue-600 hover:underline">
                  License Agreement
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="error">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert variant="success">
                <CheckCircle className="w-4 h-4" />
                <span>{success}</span>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isValidating || !licenseKey || !customerEmail || !termsAgreed}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader className="w-4 h-4 mr-2" />
                  Activating License...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Activate License
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Support Info */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Need help?{' '}
            <a href="mailto:licenses@exchangekit.io" className="text-blue-600 hover:underline">
              Contact License Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
