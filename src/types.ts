export type Currency = 'USD' | 'EUR';
export type GroupColor = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'cyan';

export interface CostItem {
  id: string;
  label: string;
  amount: number;
  currency: Currency;
  includeInLanded: boolean;
  note?: string;
}

export interface CostGroup {
  id: string;
  label: string;
  color: GroupColor;
  /** null = fall back to global USD/EUR rate */
  exchangeRate: number | null;
  items: CostItem[];
}
