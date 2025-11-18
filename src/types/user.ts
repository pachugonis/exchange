export interface Testimonial {
  id: string;
  userName: string;
  rating: number; // 1-5
  text: string;
  exchangeType: string; // e.g., "BTC → Payeer USD"
  date: string;
  adminResponse?: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  relatedQuestions?: string[];
}

export interface City {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  isActive: boolean;
}
