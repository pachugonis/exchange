export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type KYCLevel = 0 | 1 | 2 | 3;

export interface KYCDocument {
  id: string;
  type: 'passport' | 'id_card' | 'driver_license' | 'selfie' | 'address_proof';
  fileName: string;
  fileUrl: string;
  uploadedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface KYCData {
  userId: string;
  level: KYCLevel;
  status: KYCStatus;
  
  // Level 1 - Basic
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  
  // Level 2 - Advanced
  address?: string;
  city?: string;
  postalCode?: string;
  documentType?: 'passport' | 'id_card' | 'driver_license';
  documentNumber?: string;
  documents?: KYCDocument[];
  
  // Level 3 - Premium
  phoneVerified?: boolean;
  addressVerified?: boolean;
  
  // Metadata
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
  
  // Limits
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface KYCLevelInfo {
  level: KYCLevel;
  name: string;
  description: string;
  dailyLimit: number;
  monthlyLimit: number;
  requirements: string[];
  icon: string;
}
