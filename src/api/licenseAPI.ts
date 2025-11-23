// License Validation API

import type {
  LicenseValidationRequest,
  LicenseValidationResponse,
  LicenseActivationRequest,
  LicenseActivationResponse,
  DomainBindRequest,
  DomainUnbindRequest,
  LicenseHeartbeatRequest,
  LicenseHeartbeatResponse,
  LicenseFeatures,
} from '../types/license';

// Get license server URL from environment or use default
const LICENSE_SERVER_URL = import.meta.env.VITE_LICENSE_SERVER_URL || 'https://licenses.4ex.com';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Utility function to make API requests with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Validate license key and domain with license server
 */
export async function validateLicense(
  request: LicenseValidationRequest
): Promise<LicenseValidationResponse> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/validate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Validation failed: ${response.statusText}`);
    }

    const data: LicenseValidationResponse = await response.json();
    return data;
  } catch (error) {
    // Return mock response for development/offline mode
    if (import.meta.env.DEV) {
      console.warn('License validation failed, using mock response:', error);
      return getMockValidationResponse(request);
    }
    throw error;
  }
}

/**
 * Activate a new license and bind to current domain
 */
export async function activateLicense(
  request: LicenseActivationRequest
): Promise<LicenseActivationResponse> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/activate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Activation failed: ${response.statusText}`,
        error: errorData.error || 'ACTIVATION_FAILED',
      };
    }

    const data: LicenseActivationResponse = await response.json();
    return data;
  } catch (error) {
    // Return mock response for development
    if (import.meta.env.DEV) {
      console.warn('License activation failed, using mock response:', error);
      return getMockActivationResponse(request);
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error during activation',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Bind a new domain to existing license
 */
export async function bindDomain(request: DomainBindRequest): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/bind-domain`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${request.token}`,
      },
      body: JSON.stringify({
        licenseKey: request.licenseKey,
        domain: request.domain,
        protocol: request.protocol,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to bind domain');
  }
}

/**
 * Unbind domain from license
 */
export async function unbindDomain(request: DomainUnbindRequest): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/unbind-domain`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${request.token}`,
      },
      body: JSON.stringify({
        licenseKey: request.licenseKey,
        domainId: request.domainId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to unbind domain');
  }
}

/**
 * Get current license status
 */
export async function getLicenseStatus(licenseKey: string, token: string): Promise<LicenseValidationResponse> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-License-Key': licenseKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get license status: ${response.statusText}`);
    }

    const data: LicenseValidationResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get license status');
  }
}

/**
 * Send heartbeat to license server
 */
export async function sendHeartbeat(request: LicenseHeartbeatRequest): Promise<LicenseHeartbeatResponse> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/heartbeat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${request.token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Heartbeat failed: ${response.statusText}`);
    }

    const data: LicenseHeartbeatResponse = await response.json();
    return data;
  } catch (error) {
    // Heartbeat failures should not crash the app
    console.warn('Heartbeat failed:', error);
    return {
      acknowledged: false,
      nextCheckIn: 3600, // Try again in 1 hour
    };
  }
}

/**
 * Get enabled features for license
 */
export async function getLicenseFeatures(licenseKey: string, token: string): Promise<LicenseFeatures> {
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/license/features`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-License-Key': licenseKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get features: ${response.statusText}`);
    }

    const data: { features: LicenseFeatures } = await response.json();
    return data.features;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get license features');
  }
}

/**
 * Test connection to license server
 */
export async function testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetchWithTimeout(`${LICENSE_SERVER_URL}/api/health`, {
      method: 'GET',
    }, 5000);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        message: `License server responded with error: ${response.statusText}`,
        latency,
      };
    }

    return {
      success: true,
      message: 'Connection successful',
      latency,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to license server',
      latency: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Mock responses for development
// ============================================================================

function getMockValidationResponse(request: LicenseValidationRequest): LicenseValidationResponse {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const expiresAt = now + oneYear;
  const daysRemaining = Math.floor((expiresAt - now) / (24 * 60 * 60 * 1000));

  return {
    valid: true,
    licenseKey: request.licenseKey,
    licenseType: 'professional',
    status: 'active',
    expiresAt,
    daysRemaining,
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
    domainMatch: true,
    message: 'License is valid (Mock Response - Development Mode)',
    nextCheck: 86400, // 24 hours
    boundDomains: [request.domain],
    maxDomains: 3,
  };
}

function getMockActivationResponse(request: LicenseActivationRequest): LicenseActivationResponse {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  return {
    success: true,
    license: {
      id: 'mock-license-id',
      licenseKey: request.licenseKey,
      licenseType: 'professional',
      status: 'active',
      customerId: 'mock-customer-id',
      customerEmail: request.customerEmail,
      issuedAt: now,
      expiresAt: now + oneYear,
      maxDomains: 3,
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
      boundDomains: [{
        id: 'mock-binding-id',
        domain: request.domain,
        protocol: request.protocol,
        boundAt: now,
        lastValidated: now,
        validationCount: 1,
        isActive: true,
      }],
      lastValidated: now,
      validationCount: 1,
    },
    token: 'mock-jwt-token',
    message: 'License activated successfully (Mock Response - Development Mode)',
  };
}
