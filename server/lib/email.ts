import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config.ts';

let transporter: Transporter | null = null;
const smtpConfigured = Boolean(config.smtp.host && config.smtp.user);

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });
} else {
  console.warn('[email] SMTP not configured — emails will be logged to the console');
}

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[email:console] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}

function layout(title: string, body: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #6366f1;">${title}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">С уважением,<br/>Команда ${config.smtp.fromName}</p>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin:20px 0;">${label}</a>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${config.appUrl}/user/verify-email?token=${token}`;
  const text = `Здравствуйте, ${name}!\n\nПодтвердите ваш email: ${link}\n\nСсылка действительна 24 часа.`;
  const html = layout('Подтверждение email', `
    <p>Здравствуйте, ${name}!</p>
    <p>Спасибо за регистрацию. Подтвердите ваш email адрес:</p>
    ${button(link, 'Подтвердить email')}
    <p style="color:#666;font-size:12px;word-break:break-all;">${link}</p>
    <p style="color:#666;font-size:14px;">Ссылка действительна 24 часа.</p>`);
  await send(to, 'Подтверждение email — ExchangeKit', text, html);
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${config.appUrl}/user/reset-password?token=${token}`;
  const text = `Здравствуйте, ${name}!\n\nДля сброса пароля перейдите по ссылке: ${link}\n\nСсылка действительна 24 часа. Если вы не запрашивали сброс — проигнорируйте письмо.`;
  const html = layout('Восстановление пароля', `
    <p>Здравствуйте, ${name}!</p>
    <p>Вы запросили сброс пароля. Нажмите кнопку ниже:</p>
    ${button(link, 'Сбросить пароль')}
    <p style="color:#666;font-size:12px;word-break:break-all;">${link}</p>
    <p style="color:#666;font-size:14px;">Ссылка действительна 24 часа.</p>
    <p style="color:#999;font-size:12px;">Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>`);
  await send(to, 'Восстановление пароля — ExchangeKit', text, html);
}
