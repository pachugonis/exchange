import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  License,
  LicenseStatusInfo,
  LicenseValidationResponse,
  LicenseCacheData,
  ValidationLogEntry,
  LicenseError,
} from '../types/license';
import {
  validateLicense,
  activateLicense,
  sendHeartbeat,
  testConnection,
} from '../api/licenseAPI';
import {
  getCurrentDomain,
  getCurrentProtocol,
  getLicenseStatusInfo,
  generateHardwareFingerprint,
  calculateDaysRemaining,
  GRACE_PERIOD_DAYS,
  VALIDATION_CHECK_INTERVAL_HOURS,
  HEARTBEAT_INTERVAL_HOURS,
} from '../utils/license';

interface LicenseState {
  // License data
  license: License | null;
  token: string | null;
  lastValidationResponse: LicenseValidationResponse | null;
  
  // Validation state
  isValidating: boolean;
  lastValidated: number;
  lastValidationFailed: boolean;
  lastError: LicenseError | null;
  validationLogs: ValidationLogEntry[];
  
  // Periodic checks
  nextCheckTime: number;
  checkIntervalId: number | null;
  heartbeatIntervalId: number | null;
  
  // Status
  statusInfo: LicenseStatusInfo;
  
  // Actions
  validateCurrentLicense: () => Promise<boolean>;
  activateNewLicense: (licenseKey: string, customerEmail: string, termsAgreed: boolean) => Promise<{ success: boolean; message: string }>;
  clearLicense: () => void;
  startPeriodicValidation: () => void;
  stopPeriodicValidation: () => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  testServerConnection: () => Promise<{ success: boolean; message: string; latency?: number }>;
  addValidationLog: (entry: Omit<ValidationLogEntry, 'id'>) => void;
  getValidationLogs: () => ValidationLogEntry[];
  isFeatureEnabled: (featureName: string) => boolean;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOG_ENTRIES = 100;

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      // Initial state
      license: null,
      token: null,
      lastValidationResponse: null,
      isValidating: false,
      lastValidated: 0,
      lastValidationFailed: false,
      lastError: null,
      validationLogs: [],
      nextCheckTime: 0,
      checkIntervalId: null,
      heartbeatIntervalId: null,
      statusInfo: getLicenseStatusInfo(null),

      // Validate current license
      validateCurrentLicense: async () => {
        const state = get();
        
        if (!state.license) {
          console.warn('No license to validate');
          return false;
        }

        set({ isValidating: true });

        try {
          const domain = getCurrentDomain();
          const protocol = getCurrentProtocol();
          const hardwareId = generateHardwareFingerprint();

          const response = await validateLicense({
            licenseKey: state.license.licenseKey,
            domain,
            protocol,
            customerEmail: state.license.customerEmail,
            hardwareId,
          });

          const now = Date.now();

          // Update license data with validation response
          const updatedLicense: License = {
            ...state.license,
            status: response.status,
            expiresAt: response.expiresAt,
            lastValidated: now,
            validationCount: state.license.validationCount + 1,
            features: response.features,
          };

          const nextCheck = now + (response.nextCheck * 1000);

          set({
            license: updatedLicense,
            lastValidationResponse: response,
            token: response.token || state.token,
            isValidating: false,
            lastValidated: now,
            lastValidationFailed: !response.valid,
            lastError: response.valid ? null : 'VALIDATION_FAILED',
            nextCheckTime: nextCheck,
            statusInfo: getLicenseStatusInfo(updatedLicense, !response.valid),
          });

          get().addValidationLog({
            timestamp: now,
            result: response.valid ? 'success' : 'failure',
            domain,
            message: response.message,
          });

          return response.valid;
        } catch (error) {
          const now = Date.now();
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set({
            isValidating: false,
            lastValidationFailed: true,
            lastError: 'NETWORK_ERROR',
            lastValidated: now,
            statusInfo: getLicenseStatusInfo(state.license, true),
          });

          get().addValidationLog({
            timestamp: now,
            result: 'failure',
            domain: getCurrentDomain(),
            message: 'Validation failed: Network error',
            errorDetails: errorMessage,
          });

          console.error('License validation failed:', error);
          return false;
        }
      },

      // Activate new license
      activateNewLicense: async (licenseKey: string, customerEmail: string, termsAgreed: boolean) => {
        if (!termsAgreed) {
          return { success: false, message: 'You must agree to the license terms' };
        }

        set({ isValidating: true });

        try {
          const domain = getCurrentDomain();
          const protocol = getCurrentProtocol();
          const hardwareId = generateHardwareFingerprint();

          const response = await activateLicense({
            licenseKey,
            customerEmail,
            domain,
            protocol,
            termsAgreed,
            hardwareId,
          });

          if (response.success && response.license) {
            const now = Date.now();
            const nextCheck = now + (VALIDATION_CHECK_INTERVAL_HOURS * 60 * 60 * 1000);

            set({
              license: response.license,
              token: response.token || null,
              isValidating: false,
              lastValidated: now,
              lastValidationFailed: false,
              lastError: null,
              nextCheckTime: nextCheck,
              statusInfo: getLicenseStatusInfo(response.license, false),
            });

            get().addValidationLog({
              timestamp: now,
              result: 'success',
              domain,
              message: 'License activated successfully',
            });

            // Start periodic validation
            get().startPeriodicValidation();
            get().startHeartbeat();

            return { success: true, message: response.message };
          } else {
            set({ isValidating: false });
            return { success: false, message: response.message };
          }
        } catch (error) {
          set({ isValidating: false });
          const errorMessage = error instanceof Error ? error.message : 'Activation failed';
          return { success: false, message: errorMessage };
        }
      },

      // Clear license data
      clearLicense: () => {
        get().stopPeriodicValidation();
        get().stopHeartbeat();
        
        set({
          license: null,
          token: null,
          lastValidationResponse: null,
          lastValidated: 0,
          lastValidationFailed: false,
          lastError: null,
          nextCheckTime: 0,
          statusInfo: getLicenseStatusInfo(null),
        });
      },

      // Start periodic validation
      startPeriodicValidation: () => {
        const state = get();
        
        // Clear existing interval
        if (state.checkIntervalId !== null) {
          clearInterval(state.checkIntervalId);
        }

        // Schedule periodic validation every 24 hours
        const intervalId = window.setInterval(() => {
          console.log('Running periodic license validation...');
          get().validateCurrentLicense();
        }, VALIDATION_CHECK_INTERVAL_HOURS * 60 * 60 * 1000);

        set({ checkIntervalId: intervalId as unknown as number });
      },

      // Stop periodic validation
      stopPeriodicValidation: () => {
        const state = get();
        if (state.checkIntervalId !== null) {
          clearInterval(state.checkIntervalId);
          set({ checkIntervalId: null });
        }
      },

      // Start heartbeat
      startHeartbeat: () => {
        const state = get();
        
        // Clear existing interval
        if (state.heartbeatIntervalId !== null) {
          clearInterval(state.heartbeatIntervalId);
        }

        // Schedule heartbeat every 6 hours
        const intervalId = window.setInterval(async () => {
          const currentState = get();
          if (!currentState.license || !currentState.token) {
            return;
          }

          try {
            await sendHeartbeat({
              licenseKey: currentState.license.licenseKey,
              domain: getCurrentDomain(),
              token: currentState.token,
            });
          } catch (error) {
            console.warn('Heartbeat failed:', error);
          }
        }, HEARTBEAT_INTERVAL_HOURS * 60 * 60 * 1000);

        set({ heartbeatIntervalId: intervalId as unknown as number });
      },

      // Stop heartbeat
      stopHeartbeat: () => {
        const state = get();
        if (state.heartbeatIntervalId !== null) {
          clearInterval(state.heartbeatIntervalId);
          set({ heartbeatIntervalId: null });
        }
      },

      // Test server connection
      testServerConnection: async () => {
        try {
          const result = await testConnection();
          return result;
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection test failed',
          };
        }
      },

      // Add validation log entry
      addValidationLog: (entry: Omit<ValidationLogEntry, 'id'>) => {
        const state = get();
        const id = `log-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        const newEntry: ValidationLogEntry = {
          id,
          ...entry,
        };

        const updatedLogs = [newEntry, ...state.validationLogs].slice(0, MAX_LOG_ENTRIES);
        
        set({ validationLogs: updatedLogs });
      },

      // Get validation logs
      getValidationLogs: () => {
        return get().validationLogs;
      },

      // Check if feature is enabled
      isFeatureEnabled: (featureName: string) => {
        const state = get();
        if (!state.license) {
          return false;
        }
        return state.license.features[featureName] === true;
      },
    }),
    {
      name: 'license-storage',
      partialize: (state) => ({
        license: state.license,
        token: state.token,
        lastValidationResponse: state.lastValidationResponse,
        lastValidated: state.lastValidated,
        lastValidationFailed: state.lastValidationFailed,
        lastError: state.lastError,
        validationLogs: state.validationLogs.slice(0, 10), // Only persist last 10 logs
        nextCheckTime: state.nextCheckTime,
      }),
    }
  )
);

// Initialize periodic validation on store creation if license exists
if (typeof window !== 'undefined') {
  const initialState = useLicenseStore.getState();
  if (initialState.license) {
    // Validate on startup
    initialState.validateCurrentLicense().then((valid) => {
      if (valid) {
        initialState.startPeriodicValidation();
        initialState.startHeartbeat();
      }
    });
  }
}
