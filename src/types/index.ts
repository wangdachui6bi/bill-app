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

export interface BillTemplate {
  id: string;
  name: string;
  amount: number;
  type: BillType;
  categoryId: string;
  note: string;
}

export type RecurringCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringBill {
  id: string;
  amount: number;
  type: BillType;
  categoryId: string;
  note: string;
  cycle: RecurringCycle;
  dayOfMonth?: number;   // 1-31, for monthly/yearly
  dayOfWeek?: number;    // 0(Sun)-6(Sat), for weekly
  monthOfYear?: number;  // 0-11, for yearly
  startDate: string;     // ISO date
  lastGenerated?: string; // ISO date of last generated bill
  enabled: boolean;
}
