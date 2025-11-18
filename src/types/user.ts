export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  telegram?: string;
  createdAt: number;
  emailVerified: boolean;
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycLevel?: number; // 0, 1, 2, 3
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface UserProfile extends User {
  totalOrders: number;
  totalVolume: number;
  favoriteCount: number;
  registeredDays: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}
