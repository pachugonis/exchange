# License Server Validation Implementation Guide

## Overview

This document describes the client-side implementation of the license server validation and domain binding system for the 4EX Exchange platform. The implementation enables license-based distribution with server-side validation, ensuring each instance is properly authorized and bound to specific domains.

## Implementation Status

✅ **Phase 3: Client Integration - COMPLETE**

The following components have been implemented:

- ✅ TypeScript types and interfaces
- ✅ License validation API integration
- ✅ Zustand store for license state management
- ✅ License validation utilities and helpers
- ✅ License activation page component
- ✅ Admin license management page
- ✅ Warning banners for expiration and grace periods
- ✅ App.tsx integration with license validation
- ✅ Environment configuration template

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     4EX Exchange Client                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐     ┌─────────────┐ │
│  │  App.tsx     │─────▶│ License Store│────▶│ License API │ │
│  │  (Startup)   │      │   (Zustand)  │     │  Integration│ │
│  └──────────────┘      └──────────────┘     └─────────────┘ │
│         │                      │                     │        │
│         ▼                      ▼                     ▼        │
│  ┌──────────────┐      ┌──────────────┐     ┌─────────────┐ │
│  │   Warning    │      │   License    │     │ Local Cache │ │
│  │   Banners    │      │   Status     │     │ (LocalStorage)│
│  └──────────────┘      └──────────────┘     └─────────────┘ │
│                                                               │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
                    ┌─────────────────────┐
                    │  License Server     │
                    │  (Not Implemented)  │
                    └─────────────────────┘
```

### Data Flow

1. **Application Startup**
   - App.tsx checks for license in Zustand store
   - If no license: redirect to activation page
   - If license exists: validate with server
   - Store validation result in cache

2. **Periodic Validation**
   - Every 24 hours (configurable)
   - Background task revalidates license
   - Updates cache with fresh data
   - Triggers warnings if issues detected

3. **Grace Period Handling**
   - If validation fails: enter grace period (7 days default)
   - Show warning banners with severity levels
   - After grace period: block access

## File Structure

```
src/
├── api/
│   └── licenseAPI.ts           # API integration with license server
├── components/
│   └── layout/
│       └── LicenseWarningBanner.tsx  # Warning banners component
├── pages/
│   ├── admin/
│   │   └── AdminLicense.tsx    # Admin license management page
│   └── LicenseActivation.tsx   # License activation page
├── store/
│   └── licenseStore.ts         # Zustand store for license state
├── types/
│   └── license.ts              # TypeScript type definitions
├── utils/
│   └── license.ts              # License utilities and helpers
└── App.tsx                     # Main app with license integration
```

## Key Features

### 1. License Types Supported

| Type | Duration | Max Domains | Price | Features |
|------|----------|-------------|-------|----------|
| Standard | 1 year | 1 | 70,000 ₽ | Full features with domain binding |
| Professional | Lifetime | 1 | 800,000 ₽ | Full features + domain change capability |

**Key Differences:**

**Standard License:**
- Valid for 1 year from activation
- Bound to a single domain (cannot be changed)
- Includes all core features: crypto exchange, Telegram bot, KYC, API, multi-currency, analytics
- Requires annual renewal
- Price: 70,000 ₽/year

**Professional License:**
- Lifetime validity (never expires)
- Bound to a single domain (can be changed by user)
- All Standard features plus:
  - Custom branding capabilities
  - Priority support
  - Self-service domain unbinding/rebinding
- One-time payment
- Price: 800,000 ₽ (lifetime)

### 2. Validation Mechanisms

- **Startup Validation**: On application load
- **Periodic Validation**: Every 24 hours (configurable)
- **Manual Validation**: Triggered by admin
- **Heartbeat**: Every 6 hours for active monitoring

### 3. Grace Period System

When license validation fails (e.g., network issues):

| Days Remaining | Severity | UI Indication |
|---------------|----------|---------------|
| 7-5 days | Warning | Yellow banner |
| 4-3 days | Urgent | Orange banner |
| 2-0 days | Critical | Red banner |
| Expired | Blocked | Access denied |

### 4. Domain Binding

- Automatic domain detection on activation
- Support for multiple domains (license-dependent)
- Wildcard subdomain support (*.example.com)
- Protocol enforcement (HTTPS required for production)

## Usage Guide

### For Developers

#### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# For development (bypass validation)
VITE_LICENSE_ENABLE_VALIDATION=false

# For production (requires license)
VITE_LICENSE_ENABLE_VALIDATION=true
VITE_LICENSE_KEY=LIC-XXXX-XXXX-XXXX-XXXX
VITE_LICENSE_SERVER_URL=https://licenses.4ex.com
```

#### 2. Development Mode

In development, if `VITE_LICENSE_ENABLE_VALIDATION=false`, the system:
- Bypasses license checks
- Uses mock validation responses
- Allows full access to all features
- Shows mock license data in admin panel

**⚠️ WARNING**: Never deploy with validation disabled!

#### 3. Using License Store

```typescript
import { useLicenseStore } from './store/licenseStore';

function MyComponent() {
  const { 
    license, 
    statusInfo, 
    isValidating,
    validateCurrentLicense,
    isFeatureEnabled 
  } = useLicenseStore();

  // Check if feature is enabled
  if (!isFeatureEnabled('crypto')) {
    return <div>Crypto features not available in your license</div>;
  }

  // Manual validation
  const handleRevalidate = async () => {
    const success = await validateCurrentLicense();
    if (success) {
      console.log('License validated successfully');
    }
  };

  return (
    <div>
      <h3>License Status: {statusInfo.status}</h3>
      <p>Days Remaining: {statusInfo.daysRemaining}</p>
      <button onClick={handleRevalidate}>
        Revalidate License
      </button>
    </div>
  );
}
```

#### 4. Checking License Status

```typescript
import { useLicenseStore } from './store/licenseStore';

function ProtectedFeature() {
  const { statusInfo } = useLicenseStore();

  if (!statusInfo.canAccess) {
    return <AccessDenied />;
  }

  if (statusInfo.inGracePeriod) {
    return (
      <div>
        <WarningBanner>
          Grace period: {statusInfo.gracePeriodDaysRemaining} days remaining
        </WarningBanner>
        <FeatureContent />
      </div>
    );
  }

  return <FeatureContent />;
}
```

### For End Users (Deployment)

#### 1. Purchase License

1. Visit https://4ex.com/licenses
2. Choose license tier:
   - **Standard**: 70,000 ₽ - 1 year, single domain
   - **Professional**: 800,000 ₽ - Lifetime, domain change capability
3. Complete purchase
4. Receive license key via email (format: LIC-XXXX-XXXX-XXXX-XXXX)

#### 2. Deploy Application

1. Download and extract application package
2. Configure environment variables
3. Deploy to your server
4. Access the application URL

#### 3. Activate License

On first access, you'll be redirected to the activation page:

1. Enter your license key
2. Enter the email used for purchase
3. Confirm the domain being bound
4. Agree to license terms
5. Click "Activate License"

The system will:
- Validate your license key with the server
- Bind your license to the current domain
- Store license data locally
- Start periodic validation
- Redirect to the dashboard

#### 4. Monitor License Status

Access Admin Panel → License to view:

- License type and status
- Expiration date
- Bound domains
- Enabled features
- Validation history
- Days remaining

#### 5. Renewal Process

**For Standard License:**

When your license is about to expire:

1. You'll see warning banners (30 days before expiration)
2. Contact sales@4ex.com for renewal
3. Pay renewal fee (70,000 ₽)
4. Receive renewal confirmation or new license key
5. License automatically extends for another year

**For Professional License:**

- No renewal required (lifetime license)
- Unlimited updates and support included

### For Administrators

#### Managing License

**Admin Panel → License** provides:

- Real-time license status
- Manual revalidation button
- Bound domains list
- Enabled features overview
- Validation logs
- Renewal reminders

#### Troubleshooting

**License Server Unreachable:**
- Check network connectivity
- Verify firewall settings
- System enters grace period automatically
- 7 days to restore connection

**Domain Mismatch:**
- License bound to different domain
- **Standard License**: Contact support@4ex.com to resolve (domain change not allowed)
- **Professional License**: Unbind domain in Admin Panel and reactivate on new domain
- Access must be from the bound domain

**Expired License:**
- Contact sales@4ex.com for renewal
- Provide license key and email
- Receive renewal confirmation
- License activates automatically

**Validation Failed:**
- Check license server status
- Verify environment variables
- Review validation logs
- Contact support@4ex.com

## API Endpoints (License Server)

The client expects the following endpoints from the license server:

### POST /api/license/validate
Validate license and domain

**Request:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domain": "exchange.example.com",
  "protocol": "https",
  "customerEmail": "customer@example.com",
  "hardwareId": "HW-ABC123"
}
```

**Response:**
```json
{
  "valid": true,
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "licenseType": "professional",
  "status": "active",
  "expiresAt": 1735689600000,
  "daysRemaining": 365,
  "features": {
    "crypto": true,
    "telegram": true,
    "kyc": true
  },
  "domainMatch": true,
  "message": "License is valid",
  "nextCheck": 86400,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "boundDomains": ["exchange.example.com"],
  "maxDomains": 3
}
```

### POST /api/license/activate
Activate new license and bind domain

**Request:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "customerEmail": "customer@example.com",
  "domain": "exchange.example.com",
  "protocol": "https",
  "termsAgreed": true,
  "hardwareId": "HW-ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "license": { /* License object */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "License activated successfully"
}
```

### POST /api/license/heartbeat
Periodic check-in from active instance

**Request:**
```json
{
  "licenseKey": "LIC-XXXX-XXXX-XXXX-XXXX",
  "domain": "exchange.example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "metrics": {
    "activeUsers": 45,
    "totalOrders": 1234,
    "uptime": 86400
  }
}
```

**Response:**
```json
{
  "acknowledged": true,
  "nextCheckIn": 21600,
  "message": "Heartbeat received"
}
```

### GET /api/health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1701360000000
}
```

## Security Considerations

### Client-Side Security

1. **License Key Protection**
   - Never expose full keys in client code
   - Store securely in environment variables
   - Transmitted only over HTTPS

2. **Token Management**
   - JWT tokens for authenticated requests
   - Tokens stored in localStorage (encrypted)
   - Automatic token refresh

3. **Domain Validation**
   - Automatic domain detection
   - No manual domain specification
   - Protocol enforcement (HTTPS)

4. **Grace Period**
   - Prevents abuse during network issues
   - Limited time window (7 days)
   - Progressive restrictions

### Best Practices

1. **Never commit `.env` to version control**
2. **Use secrets management in production**
3. **Enable HTTPS for all deployments**
4. **Rotate license keys if compromised**
5. **Monitor validation logs regularly**
6. **Keep license server URL updated**

## Testing

### Unit Tests

Test license utilities:

```bash
npm run test -- license.test.ts
```

### Integration Tests

Test license flow:

```bash
npm run test:e2e -- license-activation.spec.ts
```

### Manual Testing Checklist

- [ ] License activation with valid key
- [ ] License activation with invalid key
- [ ] Expired license handling
- [ ] Domain mismatch detection
- [ ] Grace period countdown
- [ ] Manual revalidation
- [ ] Network failure resilience
- [ ] Warning banners display
- [ ] Admin license page access
- [ ] Feature flag enforcement

## Monitoring and Debugging

### Console Logs

Enable debug mode in `.env`:

```env
VITE_DEBUG=true
```

This shows detailed logs for:
- License validation requests
- Response parsing
- Cache operations
- Validation scheduling

### Validation Logs

View in Admin Panel → License → Validation History:
- Timestamp of each validation
- Success/failure status
- Error messages
- Domain information

### Network Debugging

Check browser DevTools → Network:
- License validation requests
- Response status codes
- Response payloads
- Request timing

## Migration Guide

### From Unlicensed to Licensed

1. **Backup Current Data**
   ```bash
   # Export localStorage
   # Backup database
   ```

2. **Update Environment**
   ```env
   VITE_LICENSE_ENABLE_VALIDATION=true
   VITE_LICENSE_KEY=your-license-key
   ```

3. **Redeploy Application**
   ```bash
   npm run build
   # Deploy to production
   ```

4. **Activate License**
   - Visit application URL
   - Complete activation flow
   - Verify license status

### Upgrading License Tier

**From Standard to Professional:**

1. **Contact Sales**: Email sales@4ex.com
2. **Upgrade Fee**: Pay difference (800,000 ₽ - remaining Standard license value)
3. **Receive New License Key**: Professional license key sent via email
4. **Update Configuration**: Update `.env` with new key
5. **Reactivate**: Visit application and activate Professional license
6. **Benefits After Upgrade**:
   - License becomes lifetime (no expiration)
   - Domain change capability enabled
   - Custom branding unlocked
   - Priority support activated

## Troubleshooting

### Common Issues

**Issue: "License Server Unreachable"**

Solution:
- Check network connectivity
- Verify `VITE_LICENSE_SERVER_URL` is correct
- Check firewall allows HTTPS to license server
- Wait for grace period to allow reconnection

**Issue: "Invalid License Key Format"**

Solution:
- Verify format: LIC-XXXX-XXXX-XXXX-XXXX
- Check for typos
- Ensure no extra spaces
- Try copying from email again

**Issue: "Domain Mismatch"**

Solution:
- License bound to different domain
- Access from correct domain
- Or contact support to update binding

**Issue: "License Expired"**

Solution:
- Contact sales@4ex.com for renewal
- Provide license key and customer email
- Receive renewal confirmation

**Issue: "Grace Period Expired"**

Solution:
- Restore network connection immediately
- License will revalidate automatically
- If still failing, contact support

### Debug Commands

```javascript
// In browser console

// Check license status
localStorage.getItem('license-storage')

// View validation logs
JSON.parse(localStorage.getItem('license-storage')).state.validationLogs

// Clear license (force reactivation)
localStorage.removeItem('license-storage')
window.location.reload()

// Test server connection
fetch('https://licenses.4ex.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

## Future Enhancements

Planned for future releases:

- [ ] **Offline License Validation**: Cryptographic signature verification
- [ ] **License Transfer**: Self-service domain unbinding
- [ ] **Usage Analytics**: Detailed usage tracking and reporting
- [ ] **Feature Add-ons**: Purchase additional features independently
- [ ] **Multi-tenant Support**: Single license for multiple subdomains
- [ ] **Automatic Renewal**: Auto-charge before expiration
- [ ] **License Marketplace**: Reseller and partner programs

## Support

### Contact Information

- **License Issues**: licenses@4ex.com
- **Technical Support**: support@4ex.com
- **Sales Inquiries**: sales@4ex.com
- **Security Issues**: security@4ex.com

### Response Times

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical (License Blocked) | 2 hours | 24 hours |
| High (Expiring Soon) | 4 hours | 2 business days |
| Medium (Questions) | 8 hours | 3 business days |
| Low (Enhancement) | 24 hours | Best effort |

### Support Hours

- **Email Support**: 24/7
- **Live Chat**: Mon-Fri 9:00-18:00 UTC
- **Emergency Hotline**: For enterprise customers only

## License Agreement

By using this software, you agree to:

1. **Valid License**: Maintain an active, valid license
2. **Single Deployment**: Use license only for authorized domains
3. **No Redistribution**: Do not share or redistribute license keys
4. **Compliance**: Follow all license terms and conditions
5. **Updates**: Keep software updated for security and compatibility

Violation of license terms may result in:
- Immediate license suspension
- Legal action
- No refund

## Changelog

### Version 2.0.0 (2025-12-16)

**License Tier Updates:**
- ✅ Removed: Trial, Enterprise, and Lifetime tiers
- ✅ Updated Standard License:
  - Duration: 1 year
  - Price: 70,000 ₽
  - Max domains: 1 (fixed, no changes allowed)
  - Full features included
- ✅ Updated Professional License:
  - Duration: Lifetime (no expiration)
  - Price: 800,000 ₽
  - Max domains: 1 (with domain change capability)
  - Full features + custom branding + priority support
- ✅ Documentation updated to reflect new pricing and capabilities

### Version 1.0.0 (2024-11-23)

**Initial Implementation:**
- ✅ License validation system
- ✅ Domain binding mechanism
- ✅ Grace period handling
- ✅ Warning banners
- ✅ Admin license management
- ✅ Activation flow
- ✅ Environment configuration
- ✅ Documentation

**Features:**
- Support for 5 license tiers
- Automatic domain detection
- Periodic validation (24h interval)
- 7-day grace period
- Mock responses for development
- LocalStorage caching
- JWT token authentication

---

**Last Updated**: December 16, 2025
**Version**: 2.0.0
**Author**: 4EX Development Team
