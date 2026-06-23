// Static/marketing content types (testimonials, FAQ, supported cities)

export interface Testimonial {
  id: string;
  userName: string;
  rating: number;
  text: string;
  exchangeType: string;
  date: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface City {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  isActive: boolean;
}
