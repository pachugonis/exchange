export interface RateHistoryPoint {
  timestamp: number;
  rate: number;
  date: string;
}

export interface RateHistory {
  fromCurrency: string;
  toCurrency: string;
  points: RateHistoryPoint[];
  period: '1h' | '24h' | '7d' | '30d';
}
