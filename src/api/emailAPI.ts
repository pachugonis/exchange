import type { SendEmailRequest, EmailLog, VerificationToken } from '../types/email';
import { generateId } from '../utils/generators';

/**
 * Email API Service
 * In production, this would connect to a real email service like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Nodemailer with SMTP
 * 
 * For development, this simulates email sending and stores logs locally.
 * SMTP settings can be configured in admin panel.
 */

const EMAIL_LOGS_KEY = 'email-logs';
const VERIFICATION_TOKENS_KEY = 'verification-tokens';

// Load email logs from localStorage
const loadEmailLogs = (): EmailLog[] => {
  try {
    const stored = localStorage.getItem(EMAIL_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading email logs:', error);
    return [];
  }
};

// Save email logs to localStorage
const saveEmailLogs = (logs: EmailLog[]) => {
  try {
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving email logs:', error);
  }
};

// Load verification tokens
const loadTokens = (): VerificationToken[] => {
  try {
    const stored = localStorage.getItem(VERIFICATION_TOKENS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading tokens:', error);
    return [];
  }
};

// Save verification tokens
const saveTokens = (tokens: VerificationToken[]) => {
  try {
    localStorage.setItem(VERIFICATION_TOKENS_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

/**
 * Get SMTP settings from admin store
 */
const getSmtpSettings = () => {
  try {
    const adminStorage = localStorage.getItem('admin-storage');
    if (adminStorage) {
      const { state } = JSON.parse(adminStorage);
      return state.settings;
    }
  } catch (error) {
    console.error('Error loading SMTP settings:', error);
  }
  return null;
};

/**
 * Send an email (mock implementation)
 * In production, this would use the configured SMTP server
 */
export const sendEmail = async (request: SendEmailRequest): Promise<{ success: boolean; error?: string }> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const smtpSettings = getSmtpSettings();
    
    // Log email configuration
    if (smtpSettings?.smtpEnabled) {
      console.log('📧 SMTP Enabled - Would send via:', {
        host: smtpSettings.smtpHost,
        port: smtpSettings.smtpPort,
        secure: smtpSettings.smtpSecure,
        from: `${smtpSettings.smtpFromName} <${smtpSettings.smtpFromEmail}>`,
        to: request.to,
        subject: request.subject,
      });
      
      // In production, here you would use nodemailer or similar:
      // const transporter = nodemailer.createTransport({
      //   host: smtpSettings.smtpHost,
      //   port: smtpSettings.smtpPort,
      //   secure: smtpSettings.smtpSecure,
      //   auth: {
      //     user: smtpSettings.smtpUser,
      //     pass: smtpSettings.smtpPassword,
      //   },
      // });
      // await transporter.sendMail({
      //   from: `${smtpSettings.smtpFromName} <${smtpSettings.smtpFromEmail}>`,
      //   to: request.to,
      //   subject: request.subject,
      //   text: request.body,
      //   html: request.html,
      // });
    } else {
      console.log('📧 SMTP Disabled - Mock email (console only):', {
        to: request.to,
        subject: request.subject,
        body: request.body,
      });
    }

    // Create email log
    const emailLog: EmailLog = {
      id: generateId('EMAIL'),
      to: request.to,
      from: smtpSettings?.smtpEnabled 
        ? `${smtpSettings.smtpFromName} <${smtpSettings.smtpFromEmail}>`
        : 'noreply@4ex.com',
      subject: request.subject,
      type: request.type,
      status: 'sent',
      sentAt: Date.now(),
    };

    // Save log
    const logs = loadEmailLogs();
    logs.push(emailLog);
    saveEmailLogs(logs);

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
};

/**
 * Generate verification token
 */
export const generateVerificationToken = (
  email: string,
  type: 'email_verification' | 'password_reset'
): string => {
  const token = generateId('TOKEN') + '_' + Date.now();
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  const tokens = loadTokens();
  
  // Remove old tokens for this email and type
  const filteredTokens = tokens.filter(
    t => !(t.email === email && t.type === type)
  );

  // Add new token
  filteredTokens.push({
    token,
    email,
    expiresAt,
    type,
  });

  saveTokens(filteredTokens);
  return token;
};

/**
 * Verify token
 */
export const verifyToken = (
  token: string,
  type: 'email_verification' | 'password_reset'
): { valid: boolean; email?: string; error?: string } => {
  const tokens = loadTokens();
  const tokenData = tokens.find(t => t.token === token && t.type === type);

  if (!tokenData) {
    return { valid: false, error: 'Invalid token' };
  }

  if (tokenData.expiresAt < Date.now()) {
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, email: tokenData.email };
};

/**
 * Delete used token
 */
export const deleteToken = (token: string) => {
  const tokens = loadTokens();
  const filteredTokens = tokens.filter(t => t.token !== token);
  saveTokens(filteredTokens);
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (email: string, name: string): Promise<{ success: boolean; error?: string }> => {
  const token = generateVerificationToken(email, 'email_verification');
  const verificationLink = `${window.location.origin}/user/verify-email?token=${token}`;

  const subject = 'Подтверждение email - 4EX';
  const body = `
Здравствуйте, ${name}!

Спасибо за регистрацию на 4EX!

Пожалуйста, подтвердите ваш email адрес, перейдя по ссылке:
${verificationLink}

Ссылка действительна в течение 24 часов.

Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.

С уважением,
Команда 4EX
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Подтверждение email</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Спасибо за регистрацию на <strong>4EX</strong>!</p>
      <p>Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
      <a href="${verificationLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Подтвердить email
      </a>
      <p style="color: #666; font-size: 14px;">Или скопируйте эту ссылку в браузер:</p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationLink}</p>
      <p style="color: #666; font-size: 14px;">Ссылка действительна в течение 24 часов.</p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">
        Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">С уважением,<br/>Команда 4EX</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    body,
    html,
    type: 'verification',
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, name: string): Promise<{ success: boolean; error?: string }> => {
  const token = generateVerificationToken(email, 'password_reset');
  const resetLink = `${window.location.origin}/user/reset-password?token=${token}`;

  const subject = 'Восстановление пароля - 4EX';
  const body = `
Здравствуйте, ${name}!

Вы запросили восстановление пароля для вашего аккаунта на 4EX.

Для сброса пароля перейдите по ссылке:
${resetLink}

Ссылка действительна в течение 24 часов.

Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.

С уважением,
Команда 4EX
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Восстановление пароля</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Вы запросили восстановление пароля для вашего аккаунта на <strong>4EX</strong>.</p>
      <p>Для сброса пароля нажмите на кнопку ниже:</p>
      <a href="${resetLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Сбросить пароль
      </a>
      <p style="color: #666; font-size: 14px;">Или скопируйте эту ссылку в браузер:</p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
      <p style="color: #666; font-size: 14px;">Ссылка действительна в течение 24 часов.</p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">
        Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">С уважением,<br/>Команда 4EX</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    body,
    html,
    type: 'password_reset',
  });
};

/**
 * Get email logs (for admin panel)
 */
export const getEmailLogs = (): EmailLog[] => {
  return loadEmailLogs();
};
