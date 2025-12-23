/**
 * Two-Factor Authentication utilities
 * Implements TOTP (Time-based One-Time Password)
 */

// Generate a random secret (32 characters, base32)
export function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Generate QR code URL for Google Authenticator
export function generateQRCodeURL(email: string, secret: string, issuer: string = 'ExchangeKit'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  const otpauthURL = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`;
  // Using Google Charts API for QR code generation
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthURL)}`;
}

// Simple TOTP implementation for demo purposes
// In production, use a proper library like otplib
function base32Decode(secret: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits: number[] = [];
  
  for (let i = 0; i < secret.length; i++) {
    const val = alphabet.indexOf(secret[i].toUpperCase());
    if (val === -1) continue;
    
    for (let j = 4; j >= 0; j--) {
      bits.push((val >> j) & 1);
    }
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  
  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

function dynamicTruncate(hmacResult: Uint8Array): number {
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);
  
  return binary % 1000000;
}

// Generate TOTP code
export async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  const secretBytes = base32Decode(secret);
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter >>> 8;
  }
  
  const hmac = await hmacSha1(secretBytes, counterBytes);
  const code = dynamicTruncate(hmac);
  
  return code.toString().padStart(6, '0');
}

// Verify TOTP code (checks current time window and ±1 window for clock skew)
export async function verifyTOTP(secret: string, token: string, timeStep: number = 30): Promise<boolean> {
  const epoch = Math.floor(Date.now() / 1000);
  
  // Check current, previous, and next time windows (allows 30s clock skew)
  for (let i = -1; i <= 1; i++) {
    const adjustedEpoch = epoch + (i * timeStep);
    const counter = Math.floor(adjustedEpoch / timeStep);
    
    const secretBytes = base32Decode(secret);
    const counterBytes = new Uint8Array(8);
    let tempCounter = counter;
    for (let j = 7; j >= 0; j--) {
      counterBytes[j] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }
    
    const hmac = await hmacSha1(secretBytes, counterBytes);
    const code = dynamicTruncate(hmac);
    const generatedToken = code.toString().padStart(6, '0');
    
    if (generatedToken === token) {
      return true;
    }
  }
  
  return false;
}

// Format secret for display (groups of 4 characters)
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}
