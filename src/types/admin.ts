export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator';
  createdAt: number;
}

export interface AdminSettings {
  commission: number; // 0.02 = 2%
  minCommission: number;
  maxCommission: number;
  paymentAddresses: {
    [currencyCode: string]: string; // BTC: "bc1q...", ETH: "0x..."
  };
  autoConfirmThreshold: number; // Auto-confirm orders below this amount
  maintenanceMode: boolean;
  supportEmail: string;
  supportTelegram: string;
  // SMTP Settings
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
}

export interface AdminStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalVolume: number;
  todayVolume: number;
  activeUsers: number;
}

export interface Announcement {
  id: string;
  message: string;
  publishDate: number;
  endDate?: number; // Optional end date for announcement
  createdAt: number;
  isActive: boolean;
}
