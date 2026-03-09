import localforage from 'localforage';
import type { Bill, Budget } from '../types';

const BILLS_KEY = 'bills';
const BUDGETS_KEY = 'budgets';

localforage.config({
  name: 'bill-app',
  storeName: 'bill_data',
});

export async function getAllBills(): Promise<Bill[]> {
  const bills = await localforage.getItem<Bill[]>(BILLS_KEY);
  return bills || [];
}

export async function addBill(bill: Bill): Promise<void> {
  const bills = await getAllBills();
  bills.unshift(bill);
  await localforage.setItem(BILLS_KEY, bills);
}

export async function updateBill(bill: Bill): Promise<void> {
  const bills = await getAllBills();
  const index = bills.findIndex(b => b.id === bill.id);
  if (index !== -1) {
    bills[index] = bill;
    await localforage.setItem(BILLS_KEY, bills);
  }
}

export async function deleteBill(id: string): Promise<void> {
  const bills = await getAllBills();
  const filtered = bills.filter(b => b.id !== id);
  await localforage.setItem(BILLS_KEY, filtered);
}

export async function getBillsByMonth(year: number, month: number): Promise<Bill[]> {
  const bills = await getAllBills();
  return bills.filter(b => {
    const d = new Date(b.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export async function getBudget(month: string): Promise<Budget | null> {
  const budgets = await localforage.getItem<Budget[]>(BUDGETS_KEY);
  return budgets?.find(b => b.month === month) || null;
}

export async function setBudget(budget: Budget): Promise<void> {
  const budgets = (await localforage.getItem<Budget[]>(BUDGETS_KEY)) || [];
  const index = budgets.findIndex(b => b.month === budget.month);
  if (index !== -1) {
    budgets[index] = budget;
  } else {
    budgets.push(budget);
  }
  await localforage.setItem(BUDGETS_KEY, budgets);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
