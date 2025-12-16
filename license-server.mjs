import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.license-server' });

const app = express();
const PORT = process.env.LICENSE_SERVER_PORT || 3001;
const JWT_SECRET = process.env.LICENSE_JWT_SECRET || 'your-secret-key-change-in-production';
const DB_FILE = 'license-database.json';

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// Database Functions (JSON-based)
// ============================================================================

let database = {
  licenses: [],
  domainBindings: [],
  validationLogs: [],
  nextId: {
    license: 1,
    binding: 1,
    log: 1
  }
};

// Load database from file
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    database = JSON.parse(data);
    console.log('✅ Database loaded from file');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('ℹ️  Creating new database file');
      await saveDatabase();
    } else {
      console.error('Error loading database:', error);
    }
  }
}

// Save database to file
async function saveDatabase() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize database
await loadDatabase();

// ============================================================================
// Helper Functions
// ============================================================================

function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `LIC-${segments.join('-')}`;
}

function generateToken(licenseKey, customerId) {
  return jwt.sign({ licenseKey, customerId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getLicenseByKey(licenseKey) {
  return database.licenses.find(l => l.licenseKey === licenseKey);
}

function getDomainBindings(licenseId) {
  return database.domainBindings.filter(b => b.licenseId === licenseId && b.isActive);
}

function logValidation(licenseId, domain, success, ipAddress, userAgent, errorMessage = null) {
  database.validationLogs.push({
    id: database.nextId.log++,
    licenseId,
    domain,
    success,
    ipAddress,
    userAgent,
    errorMessage,
    validatedAt: Date.now()
  });
  saveDatabase();
}

function isDomainMatch(bindings, domain) {
  for (const binding of bindings) {
    if (binding.domain === domain) return true;
    if (binding.domain.startsWith('*.')) {
      const baseDomain = binding.domain.substring(2);
      if (domain.endsWith(`.${baseDomain}`) || domain === baseDomain) return true;
    }
    if ((binding.domain === 'localhost' || binding.domain === '127.0.0.1') &&
        (domain === 'localhost' || domain === '127.0.0.1')) return true;
  }
  return false;
}

// ============================================================================
// Authentication Middleware
// ============================================================================

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// ============================================================================
// API Endpoints
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '2.0.0',
    totalLicenses: database.licenses.length,
    activeLicenses: database.licenses.filter(l => l.status === 'active').length
  });
});

app.post('/api/admin/licenses', async (req, res) => {
  const adminPassword = req.headers['x-admin-password'];
  
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid admin password' });
  }

  const {
    licenseType = 'standard',
    customerEmail,
    customerId = crypto.randomBytes(8).toString('hex'),
    duration = licenseType === 'professional' ? null : 365,
  } = req.body;

  if (!customerEmail) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Customer email is required' });
  }

  if (!['standard', 'professional'].includes(licenseType)) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Invalid license type' });
  }

  const maxDomains = 1;
  const canChangeDomain = licenseType === 'professional';
  
  const features = {
    crypto: true,
    telegram: true,
    kyc: true,
    customBranding: licenseType === 'professional',
    prioritySupport: licenseType === 'professional',
    api: true,
    multiCurrency: true,
    analytics: true,
  };

  const licenseKey = generateLicenseKey();
  const now = Date.now();
  const expiresAt = duration ? now + (duration * 24 * 60 * 60 * 1000) : null;

  const license = {
    id: database.nextId.license++,
    licenseKey,
    licenseType,
    status: 'active',
    customerId,
    customerEmail,
    issuedAt: now,
    expiresAt,
    maxDomains,
    canChangeDomain,
    features,
    validationCount: 0,
    lastValidated: null
  };

  database.licenses.push(license);
  await saveDatabase();

  res.json({
    success: true,
    license: {
      ...license,
      price: licenseType === 'standard' ? '70,000 ₽' : '800,000 ₽'
    },
    message: 'License created successfully',
  });
});

app.post('/api/license/activate', async (req, res) => {
  const { licenseKey, customerEmail, domain, protocol = 'https', termsAgreed } = req.body;

  if (!licenseKey || !customerEmail || !domain) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: 'License key, email, and domain are required',
    });
  }

  if (!termsAgreed) {
    return res.status(400).json({
      success: false,
      error: 'TERMS_NOT_AGREED',
      message: 'You must agree to the license terms',
    });
  }

  const license = getLicenseByKey(licenseKey);

  if (!license) {
    return res.status(404).json({
      success: false,
      error: 'INVALID_KEY',
      message: 'License key not found',
    });
  }

  if (license.customerEmail !== customerEmail) {
    return res.status(403).json({
      success: false,
      error: 'EMAIL_MISMATCH',
      message: 'Email does not match license records',
    });
  }

  if (license.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: 'LICENSE_INACTIVE',
      message: `License is ${license.status}`,
    });
  }

  if (license.expiresAt && license.expiresAt < Date.now()) {
    license.status = 'expired';
    await saveDatabase();
    return res.status(403).json({
      success: false,
      error: 'EXPIRED',
      message: 'License has expired',
    });
  }

  const bindings = getDomainBindings(license.id);
  const existingBinding = bindings.find(b => b.domain === domain);
  
  if (!existingBinding && bindings.length >= license.maxDomains) {
    return res.status(403).json({
      success: false,
      error: 'DOMAIN_LIMIT_REACHED',
      message: `Maximum ${license.maxDomains} domain allowed`,
    });
  }

  const now = Date.now();

  if (existingBinding) {
    existingBinding.protocol = protocol;
    existingBinding.lastValidated = now;
    existingBinding.isActive = true;
  } else {
    database.domainBindings.push({
      id: database.nextId.binding++,
      licenseId: license.id,
      domain,
      protocol,
      boundAt: now,
      lastValidated: now,
      validationCount: 0,
      isActive: true
    });
  }

  license.lastValidated = now;
  license.validationCount++;
  
  await saveDatabase();
  logValidation(license.id, domain, true, req.ip, req.get('user-agent'));

  const updatedBindings = getDomainBindings(license.id);
  const token = generateToken(licenseKey, license.customerId);

  res.json({
    success: true,
    license: {
      ...license,
      boundDomains: updatedBindings
    },
    token,
    message: 'License activated successfully',
  });
});

app.post('/api/license/validate', (req, res) => {
  const { licenseKey, domain, protocol = 'https' } = req.body;

  if (!licenseKey || !domain) {
    return res.status(400).json({
      valid: false,
      error: 'INVALID_REQUEST',
      message: 'License key and domain are required',
    });
  }

  const license = getLicenseByKey(licenseKey);

  if (!license) {
    logValidation(0, domain, false, req.ip, req.get('user-agent'), 'License not found');
    return res.status(404).json({
      valid: false,
      error: 'INVALID_KEY',
      message: 'License key not found',
    });
  }

  if (license.status === 'suspended') {
    logValidation(license.id, domain, false, req.ip, req.get('user-agent'), 'License suspended');
    return res.json({
      valid: false,
      licenseKey: license.licenseKey,
      licenseType: license.licenseType,
      status: 'suspended',
      error: 'SUSPENDED',
      message: 'License has been suspended',
    });
  }

  if (license.status === 'revoked') {
    logValidation(license.id, domain, false, req.ip, req.get('user-agent'), 'License revoked');
    return res.json({
      valid: false,
      licenseKey: license.licenseKey,
      licenseType: license.licenseType,
      status: 'revoked',
      error: 'REVOKED',
      message: 'License has been revoked',
    });
  }

  const now = Date.now();
  
  if (license.expiresAt && license.expiresAt < now) {
    license.status = 'expired';
    saveDatabase();
    logValidation(license.id, domain, false, req.ip, req.get('user-agent'), 'License expired');
    return res.json({
      valid: false,
      licenseKey: license.licenseKey,
      licenseType: license.licenseType,
      status: 'expired',
      expiresAt: license.expiresAt,
      error: 'EXPIRED',
      message: 'License has expired',
    });
  }

  const bindings = getDomainBindings(license.id);
  const domainMatch = isDomainMatch(bindings, domain);

  if (!domainMatch) {
    logValidation(license.id, domain, false, req.ip, req.get('user-agent'), 'Domain mismatch');
    return res.json({
      valid: false,
      licenseKey: license.licenseKey,
      licenseType: license.licenseType,
      status: license.status,
      domainMatch: false,
      boundDomains: bindings.map(b => b.domain),
      canChangeDomain: license.canChangeDomain,
      error: 'DOMAIN_MISMATCH',
      message: 'Domain not authorized',
    });
  }

  license.lastValidated = now;
  license.validationCount++;
  
  const binding = bindings.find(b => b.domain === domain);
  if (binding) {
    binding.lastValidated = now;
    binding.validationCount++;
  }
  
  saveDatabase();
  logValidation(license.id, domain, true, req.ip, req.get('user-agent'));

  const daysRemaining = license.expiresAt 
    ? Math.ceil((license.expiresAt - now) / (24 * 60 * 60 * 1000))
    : null;

  res.json({
    valid: true,
    licenseKey: license.licenseKey,
    licenseType: license.licenseType,
    status: 'active',
    expiresAt: license.expiresAt,
    daysRemaining,
    features: license.features,
    domainMatch: true,
    canChangeDomain: license.canChangeDomain,
    message: 'License is valid',
    nextCheck: 86400,
    boundDomains: bindings.map(b => b.domain),
    maxDomains: license.maxDomains,
  });
});

app.post('/api/license/unbind-domain', authenticate, async (req, res) => {
  const { licenseKey, domainId } = req.body;

  if (!licenseKey || !domainId) {
    return res.status(400).json({ 
      success: false, 
      error: 'INVALID_REQUEST',
      message: 'License key and domain ID are required' 
    });
  }

  const license = getLicenseByKey(licenseKey);

  if (!license) {
    return res.status(404).json({ 
      success: false, 
      error: 'NOT_FOUND',
      message: 'License not found' 
    });
  }

  if (!license.canChangeDomain) {
    return res.status(403).json({
      success: false,
      error: 'DOMAIN_CHANGE_NOT_ALLOWED',
      message: 'This license type does not allow domain changes. Upgrade to Professional license.',
    });
  }

  const binding = database.domainBindings.find(b => b.id === parseInt(domainId) && b.licenseId === license.id);
  
  if (binding) {
    binding.isActive = false;
    await saveDatabase();
  }

  res.json({
    success: true,
    message: 'Domain unbound successfully. You can now bind a new domain.',
  });
});

app.post('/api/license/heartbeat', authenticate, async (req, res) => {
  const { licenseKey, domain } = req.body;

  const license = getLicenseByKey(licenseKey);

  if (!license) {
    return res.status(404).json({
      acknowledged: false,
      error: 'INVALID_KEY',
      message: 'License not found',
    });
  }

  const now = Date.now();
  license.lastValidated = now;

  if (domain) {
    const binding = database.domainBindings.find(b => b.licenseId === license.id && b.domain === domain);
    if (binding) {
      binding.lastValidated = now;
    }
  }

  await saveDatabase();

  res.json({
    acknowledged: true,
    nextCheckIn: 21600,
    message: 'Heartbeat received',
  });
});

app.get('/api/license/status', authenticate, (req, res) => {
  const licenseKey = req.get('X-License-Key');

  if (!licenseKey) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'License key required' });
  }

  const license = getLicenseByKey(licenseKey);

  if (!license) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'License not found' });
  }

  const bindings = getDomainBindings(license.id);
  const now = Date.now();
  const daysRemaining = license.expiresAt 
    ? Math.ceil((license.expiresAt - now) / (24 * 60 * 60 * 1000))
    : null;

  res.json({
    valid: license.status === 'active' && (!license.expiresAt || license.expiresAt > now),
    licenseKey: license.licenseKey,
    licenseType: license.licenseType,
    status: license.status,
    expiresAt: license.expiresAt,
    daysRemaining,
    features: license.features,
    boundDomains: bindings.map(b => b.domain),
    maxDomains: license.maxDomains,
    canChangeDomain: license.canChangeDomain,
    message: 'License status retrieved',
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log('  🔐 License Server v2.0.0');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  ✅ Server running on port ${PORT}`);
  console.log(`  🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`  💾 Database: ${DB_FILE}`);
  console.log('');
  console.log('  Available License Types:');
  console.log('    • Standard: 1 year, 70,000 ₽');
  console.log('    • Professional: Lifetime, 800,000 ₽');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
  console.log('════════════════════════════════════════════════════════');
});
