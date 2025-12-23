// License Validation Utilities

import type {
  License,
  LicenseStatus,
  LicenseStatusInfo,
  LicenseType,
  GracePeriodSeverity,
  LicenseError,
  LicenseErrorInfo,
  LicenseTierConfig,
  LicenseConfig,
} from '../types/license';

// ============================================================================
// Constants
// ============================================================================

export const GRACE_PERIOD_DAYS = 7;
export const VALIDATION_CHECK_INTERVAL_HOURS = 24;
export const LIGHT_CHECK_INTERVAL_HOURS = 4;
export const HEARTBEAT_INTERVAL_HOURS = 6;

export const LICENSE_STORAGE_KEY = 'license-cache-data';
export const LICENSE_CONFIG_KEY = 'license-configuration';

// ============================================================================
// License Tier Configurations
// ============================================================================

export const LICENSE_TIERS: Record<LicenseType, LicenseTierConfig> = {
  standard: {
    type: 'standard',
    name: 'Стандартная лицензия',
    duration: 365, // 1 год
    maxDomains: 1,
    features: {
      crypto: true,
      telegram: true,
      kyc: true,
      customBranding: false,
      prioritySupport: false,
      api: true,
      multiCurrency: true,
      analytics: true,
    },
    description: 'Полный функционал на 1 год с привязкой к одному домену. Стоимость: 70,000 ₽',
  },
  professional: {
    type: 'professional',
    name: 'Профессиональная лицензия',
    duration: null, // Бессрочная
    maxDomains: 1,
    features: {
      crypto: true,
      telegram: true,
      kyc: true,
      customBranding: true,
      prioritySupport: true,
      api: true,
      multiCurrency: true,
      analytics: true,
    },
    description: 'Бессрочная лицензия с полным функционалом и возможностью изменения домена. Стоимость: 800,000 ₽',
  },
};

// ============================================================================
// Domain Detection and Validation
// ============================================================================

/**
 * Get current domain from window location
 */
export function getCurrentDomain(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  return window.location.hostname;
}

/**
 * Get current protocol
 */
export function getCurrentProtocol(): 'http' | 'https' {
  if (typeof window === 'undefined') {
    return 'http';
  }
  return window.location.protocol === 'https:' ? 'https' : 'http';
}

/**
 * Check if domain matches (with subdomain handling)
 */
export function isDomainMatch(licenseDomain: string, currentDomain: string): boolean {
  // Exact match
  if (licenseDomain === currentDomain) {
    return true;
  }

  // Handle localhost variations
  if ((licenseDomain === 'localhost' || licenseDomain === '127.0.0.1') && 
      (currentDomain === 'localhost' || currentDomain === '127.0.0.1')) {
    return true;
  }

  // Handle wildcard subdomains (e.g., *.example.com)
  if (licenseDomain.startsWith('*.')) {
    const baseDomain = licenseDomain.substring(2);
    return currentDomain.endsWith(`.${baseDomain}`) || currentDomain === baseDomain;
  }

  return false;
}

/**
 * Validate license key format
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  // Format: LIC-XXXX-XXXX-XXXX-XXXX (where X is alphanumeric)
  const pattern = /^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}

/**
 * Generate hardware fingerprint (simplified version)
 */
export function generateHardwareFingerprint(): string {
  // In production, this would use more sophisticated methods
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const fingerprint = `${userAgent}-${platform}-${language}-${screenResolution}-${timezone}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `HW-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

// ============================================================================
// License Status Calculation
// ============================================================================

/**
 * Calculate days remaining until expiration
 */
export function calculateDaysRemaining(expiresAt: number | null): number | null {
  if (expiresAt === null) {
    return null; // Lifetime license
  }

  const now = Date.now();
  const diff = expiresAt - now;
  
  if (diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Calculate grace period days remaining
 */
export function calculateGracePeriodDays(lastValidated: number, gracePeriodDays: number = GRACE_PERIOD_DAYS): number {
  const now = Date.now();
  const gracePeriodEnd = lastValidated + (gracePeriodDays * 24 * 60 * 60 * 1000);
  const diff = gracePeriodEnd - now;
  
  if (diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Determine grace period severity level
 */
export function getGracePeriodSeverity(daysRemaining: number): GracePeriodSeverity {
  if (daysRemaining <= 0) {
    return 'critical';
  } else if (daysRemaining <= 2) {
    return 'critical';
  } else if (daysRemaining <= 4) {
    return 'urgent';
  } else if (daysRemaining <= 7) {
    return 'warning';
  }
  return 'none';
}

/**
 * Check if license is in grace period
 */
export function isInGracePeriod(lastValidated: number, lastValidationFailed: boolean): boolean {
  if (!lastValidationFailed) {
    return false;
  }

  const gracePeriodDays = calculateGracePeriodDays(lastValidated);
  return gracePeriodDays > 0;
}

/**
 * Check if license needs renewal
 */
export function needsRenewal(expiresAt: number | null, warningDays: number = 30): boolean {
  if (expiresAt === null) {
    return false; // Lifetime license
  }

  const daysRemaining = calculateDaysRemaining(expiresAt);
  return daysRemaining !== null && daysRemaining <= warningDays;
}

/**
 * Check if license allows access
 */
export function canAccessApplication(
  status: LicenseStatus,
  expiresAt: number | null,
  inGracePeriod: boolean,
  gracePeriodDaysRemaining: number
): boolean {
  // Suspended or revoked licenses cannot access
  if (status === 'suspended' || status === 'revoked') {
    return false;
  }

  // Active licenses can access
  if (status === 'active') {
    return true;
  }

  // Expired licenses can access if in grace period
  if (status === 'expired') {
    return inGracePeriod && gracePeriodDaysRemaining > 0;
  }

  // Pending licenses cannot access
  return false;
}

/**
 * Get license status information for display
 */
export function getLicenseStatusInfo(license: License | null, lastValidationFailed: boolean = false): LicenseStatusInfo {
  if (!license) {
    return {
      isValid: false,
      licenseType: 'standard',
      status: 'pending',
      expiresAt: null,
      daysRemaining: null,
      boundDomains: [],
      currentDomain: getCurrentDomain(),
      domainMatch: false,
      features: LICENSE_TIERS.standard.features,
      lastValidated: 0,
      inGracePeriod: false,
      gracePeriodDaysRemaining: 0,
      gracePeriodSeverity: 'none',
      needsRenewal: false,
      canAccess: false,
    };
  }

  const currentDomain = getCurrentDomain();
  const boundDomainsList = license.boundDomains.map(b => b.domain);
  const domainMatch = boundDomainsList.some(d => isDomainMatch(d, currentDomain));
  const daysRemaining = calculateDaysRemaining(license.expiresAt);
  const inGracePeriod = isInGracePeriod(license.lastValidated, lastValidationFailed);
  const gracePeriodDaysRemaining = inGracePeriod ? calculateGracePeriodDays(license.lastValidated) : 0;
  const gracePeriodSeverity = getGracePeriodSeverity(gracePeriodDaysRemaining);
  const licenseNeedsRenewal = needsRenewal(license.expiresAt);
  const canAccess = canAccessApplication(license.status, license.expiresAt, inGracePeriod, gracePeriodDaysRemaining);

  return {
    isValid: license.status === 'active' && (daysRemaining === null || daysRemaining > 0),
    licenseType: license.licenseType,
    status: license.status,
    expiresAt: license.expiresAt,
    daysRemaining,
    boundDomains: boundDomainsList,
    currentDomain,
    domainMatch,
    features: license.features,
    lastValidated: license.lastValidated,
    inGracePeriod,
    gracePeriodDaysRemaining,
    gracePeriodSeverity,
    needsRenewal: licenseNeedsRenewal,
    canAccess,
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Get license error information
 */
export function getLicenseError(errorType: LicenseError): LicenseErrorInfo {
  const errorMap: Record<LicenseError, Omit<LicenseErrorInfo, 'type'>> = {
    INVALID_KEY: {
      message: 'The license key you entered is not valid.',
      details: 'Please check the format and try again.',
      actionRequired: 'Verify your license key or contact support',
      supportContact: 'licenses@exchangekit.io',
    },
    EXPIRED: {
      message: 'Your license has expired.',
      details: 'Please renew your license to continue using the platform.',
      actionRequired: 'Renew your license',
      supportContact: 'sales@exchangekit.io',
    },
    SUSPENDED: {
      message: 'Your license has been suspended.',
      details: 'Please contact support for assistance.',
      actionRequired: 'Contact support to resolve the issue',
      supportContact: 'support@exchangekit.io',
    },
    REVOKED: {
      message: 'This license has been revoked and can no longer be used.',
      details: 'The license has been permanently deactivated.',
      actionRequired: 'Contact support or purchase a new license',
      supportContact: 'licenses@exchangekit.io',
    },
    DOMAIN_MISMATCH: {
      message: 'License is bound to a different domain.',
      details: 'This license is not authorized for the current domain.',
      actionRequired: 'Update domain binding or use correct domain',
      supportContact: 'support@exchangekit.io',
    },
    DOMAIN_LIMIT_REACHED: {
      message: 'Maximum number of domains reached.',
      details: 'This license is already bound to the maximum allowed domains.',
      actionRequired: 'Unbind an existing domain or upgrade your license',
      supportContact: 'sales@exchangekit.io',
    },
    SERVER_UNREACHABLE: {
      message: 'Unable to connect to license server.',
      details: 'Operating in grace period mode.',
      actionRequired: 'Check network connection or wait for reconnection',
      supportContact: 'support@exchangekit.io',
    },
    NETWORK_ERROR: {
      message: 'Network error during license validation.',
      details: 'Could not reach the license server.',
      actionRequired: 'Check your internet connection and try again',
      supportContact: 'support@exchangekit.io',
    },
    VALIDATION_FAILED: {
      message: 'License validation failed.',
      details: 'Could not verify the license with the server.',
      actionRequired: 'Try again or contact support',
      supportContact: 'support@exchangekit.io',
    },
    GRACE_PERIOD_EXPIRED: {
      message: 'Grace period has expired.',
      details: 'License validation is required to continue.',
      actionRequired: 'Restore network connection to validate license',
      supportContact: 'support@exchangekit.io',
    },
    UNKNOWN_ERROR: {
      message: 'An unknown error occurred.',
      details: 'Please try again or contact support.',
      actionRequired: 'Contact support if the problem persists',
      supportContact: 'support@exchangekit.io',
    },
  };

  return {
    type: errorType,
    ...errorMap[errorType],
  };
}

// ============================================================================
// Configuration Management
// ============================================================================

/**
 * Get license configuration from environment
 */
export function getLicenseConfig(): LicenseConfig {
  return {
    licenseKey: import.meta.env.VITE_LICENSE_KEY,
    serverUrl: import.meta.env.VITE_LICENSE_SERVER_URL || 'https://license.exchangekit.io',
    publicKey: import.meta.env.VITE_LICENSE_PUBLIC_KEY,
    checkInterval: parseInt(import.meta.env.VITE_LICENSE_CHECK_INTERVAL || '24', 10),
    gracePeriod: parseInt(import.meta.env.VITE_LICENSE_GRACE_PERIOD || '7', 10),
    enableValidation: import.meta.env.VITE_LICENSE_ENABLE_VALIDATION !== 'false',
  };
}

/**
 * Save license configuration to localStorage
 */
export function saveLicenseConfig(config: Partial<LicenseConfig>): void {
  try {
    const existingConfig = getLicenseConfig();
    const updatedConfig = { ...existingConfig, ...config };
    localStorage.setItem(LICENSE_CONFIG_KEY, JSON.stringify(updatedConfig));
  } catch (error) {
    console.error('Failed to save license configuration:', error);
  }
}

/**
 * Format license expiration date
 */
export function formatExpirationDate(expiresAt: number | null): string {
  if (expiresAt === null) {
    return 'Never (Lifetime License)';
  }

  const date = new Date(expiresAt);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format days remaining display
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) {
    return 'Unlimited';
  }

  if (days === 0) {
    return 'Expired';
  }

  if (days === 1) {
    return '1 day';
  }

  return `${days} days`;
}

/**
 * Get license tier display name
 */
export function getLicenseTierName(licenseType: LicenseType): string {
  return LICENSE_TIERS[licenseType]?.name || 'Unknown License';
}

/**
 * Check if feature is enabled in license
 */
export function isFeatureEnabled(license: License | null, featureName: string): boolean {
  if (!license) {
    return false;
  }

  return license.features[featureName] === true;
}
