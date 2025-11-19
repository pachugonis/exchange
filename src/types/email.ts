export interface EmailTemplate {
  subject: string;
  body: string;
  html?: string;
}

export interface VerificationToken {
  token: string;
  email: string;
  expiresAt: number;
  type: 'email_verification' | 'password_reset';
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: number;
  isActive: boolean;
  tags?: string[];
}

export interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  body: string;
  html?: string;
  sentAt?: number;
  recipientsCount: number;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: number;
}

export interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  type: 'verification' | 'password_reset' | 'newsletter' | 'notification';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: number;
  error?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  type: 'verification' | 'password_reset' | 'newsletter' | 'notification';
}
