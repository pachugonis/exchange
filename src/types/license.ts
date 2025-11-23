// License System Types

/**
 * License type enum defining the different tiers
 */
export type LicenseType = 'trial' | 'standard' | 'professional' | 'enterprise' | 'lifetime';

/**
 * License status enum defining the current state
 */
export type LicenseStatus = 'pending' | 'active' | 'suspended' | 'expired' | 'revoked';

/**
 * Validation result enum
 */
export type ValidationResult = 'success' | 'failure' | 'grace_period';

/**
 * Grace period severity levels
 */
export type GracePeriodSeverity = 'none' | 'warning' | 'urgent' | 'critical';

/**
 * Feature flags configuration
 */
export interface LicenseFeatures {
  crypto: boolean;
  telegram: boolean;
  kyc: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  api: boolean;
  multiCurrency: boolean;
  analytics: boolean;
  [key: string]: boolean;
}

/**
 * Domain binding information
 */
export interface DomainBinding {
  id: string;
  domain: string;
  protocol: 'http' | 'https';
  boundAt: number;
  lastValidated: number;
  validationCount: number;
  ipAddress?: string;
  hardwareId?: string;
  isActive: boolean;
}

/**
 * Complete license information
 */
export interface License {
  id: string;
  licenseKey: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  customerId: string;
  customerEmail: string;
  issuedAt: number;
  expiresAt: number | null; // null for lifetime licenses
  maxDomains: number;
  features: LicenseFeatures;
  boundDomains: DomainBinding[];
  lastValidated: number;
  validationCount: number;
  metadata?: Record<string, any>;
}

/**
 * License validation request payload
 */
export interface LicenseValidationRequest {
  licenseKey: string;
  domain: string;
  protocol: 'http' | 'https';
  customerEmail?: string;
  hardwareId?: string;
}

/**
 * License validation response from server
 */
export interface LicenseValidationResponse {
  valid: boolean;
  licenseKey: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  expiresAt: number | null;
  daysRemaining: number | null;
  features: LicenseFeatures;
  domainMatch: boolean;
  message: string;
  nextCheck: number; // seconds until next required check
  token?: string; // JWT token for subsequent requests
  boundDomains?: string[];
  maxDomains?: number;
}

/**
 * License activation request payload
 */
export interface LicenseActivationRequest {
  licenseKey: string;
  customerEmail: string;
  domain: string;
  protocol: 'http' | 'https';
  termsAgreed: boolean;
  hardwareId?: string;
}

/**
 * License activation response
 */
export interface LicenseActivationResponse {
  success: boolean;
  license?: License;
  token?: string;
  message: string;
  error?: string;
}

/**
 * Domain binding request
 */
export interface DomainBindRequest {
  licenseKey: string;
  domain: string;
  protocol: 'http' | 'https';
  token: string;
}

/**
 * Domain unbind request
 */
export interface DomainUnbindRequest {
  licenseKey: string;
  domainId: string;
  token: string;
}

/**
 * License status information for display
 */
export interface LicenseStatusInfo {
  isValid: boolean;
  licenseType: LicenseType;
  status: LicenseStatus;
  expiresAt: number | null;
  daysRemaining: number | null;
  boundDomains: string[];
  currentDomain: string;
  domainMatch: boolean;
  features: LicenseFeatures;
  lastValidated: number;
  inGracePeriod: boolean;
  gracePeriodDaysRemaining: number;
  gracePeriodSeverity: GracePeriodSeverity;
  needsRenewal: boolean;
  canAccess: boolean;
}

/**
 * License configuration from environment
 */
export interface LicenseConfig {
  licenseKey?: string;
  serverUrl: string;
  publicKey?: string;
  checkInterval: number; // hours
  gracePeriod: number; // days
  enableValidation: boolean;
}

/**
 * Validation log entry
 */
export interface ValidationLogEntry {
  id: string;
  timestamp: number;
  result: ValidationResult;
  domain: string;
  message: string;
  errorDetails?: string;
}

/**
 * License error types
 */
export type LicenseError = 
  | 'INVALID_KEY'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'DOMAIN_MISMATCH'
  | 'DOMAIN_LIMIT_REACHED'
  | 'SERVER_UNREACHABLE'
  | 'NETWORK_ERROR'
  | 'VALIDATION_FAILED'
  | 'GRACE_PERIOD_EXPIRED'
  | 'UNKNOWN_ERROR';

/**
 * License error information
 */
export interface LicenseErrorInfo {
  type: LicenseError;
  message: string;
  details?: string;
  actionRequired?: string;
  supportContact?: string;
}

/**
 * License tier configuration
 */
export interface LicenseTierConfig {
  type: LicenseType;
  name: string;
  duration: number | null; // days, null for lifetime
  maxDomains: number;
  features: LicenseFeatures;
  description: string;
}

/**
 * Heartbeat request to license server
 */
export interface LicenseHeartbeatRequest {
  licenseKey: string;
  domain: string;
  token: string;
  metrics?: {
    activeUsers?: number;
    totalOrders?: number;
    uptime?: number;
  };
}

/**
 * Heartbeat response
 */
export interface LicenseHeartbeatResponse {
  acknowledged: boolean;
  nextCheckIn: number; // seconds
  message?: string;
  forceRevalidate?: boolean;
}

/**
 * License cache data stored locally
 */
export interface LicenseCacheData {
  license: License;
  validationResponse: LicenseValidationResponse;
  cachedAt: number;
  expiresAt: number;
  token?: string;
}
