export type BillType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: BillType;
  parentId?: string;
}

export interface Bill {
  id: string;
  amount: number;
  type: BillType;
  categoryId: string;
  note: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Budget {
  month: string; // YYYY-MM
  amount: number;
}

export interface MonthlyStats {
  month: string;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  categoryBreakdown: { categoryId: string; amount: number }[];
}
