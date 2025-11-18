export interface PromoCode {
  code: string;
  discount: number; // Percentage discount
  type: 'commission' | 'bonus'; // commission reduction or bonus amount
  bonusAmount?: number; // Fixed bonus in currency
  minAmount?: number; // Minimum exchange amount
  maxUses?: number; // Max total uses
  usesCount?: number; // Current uses
  expiresAt?: number; // Timestamp
  isActive: boolean;
  createdAt: number;
}

export interface AppliedPromo {
  code: string;
  discount: number;
  type: 'commission' | 'bonus';
  bonusAmount?: number;
}
