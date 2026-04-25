export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  spent: number;
  color: string;
}
