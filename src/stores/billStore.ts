import localforage from 'localforage';
import type { Bill, Budget, BillTemplate, RecurringBill } from '../types';

const BILLS_KEY = 'bills';
const BUDGETS_KEY = 'budgets';
const TEMPLATES_KEY = 'bill_templates';
const RECURRING_KEY = 'recurring_bills';

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

export async function getTemplates(): Promise<BillTemplate[]> {
  return (await localforage.getItem<BillTemplate[]>(TEMPLATES_KEY)) || [];
}

export async function addTemplate(t: BillTemplate): Promise<void> {
  const list = await getTemplates();
  list.unshift(t);
  await localforage.setItem(TEMPLATES_KEY, list);
}

export async function deleteTemplate(id: string): Promise<void> {
  const list = await getTemplates();
  await localforage.setItem(TEMPLATES_KEY, list.filter(t => t.id !== id));
}

// --- Recurring Bills ---

export async function getRecurringBills(): Promise<RecurringBill[]> {
  return (await localforage.getItem<RecurringBill[]>(RECURRING_KEY)) || [];
}

export async function addRecurringBill(r: RecurringBill): Promise<void> {
  const list = await getRecurringBills();
  list.unshift(r);
  await localforage.setItem(RECURRING_KEY, list);
}

export async function updateRecurringBill(r: RecurringBill): Promise<void> {
  const list = await getRecurringBills();
  const idx = list.findIndex(x => x.id === r.id);
  if (idx !== -1) { list[idx] = r; await localforage.setItem(RECURRING_KEY, list); }
}

export async function deleteRecurringBill(id: string): Promise<void> {
  const list = await getRecurringBills();
  await localforage.setItem(RECURRING_KEY, list.filter(x => x.id !== id));
}

/**
 * Check all enabled recurring bills and auto-generate any that are due.
 * Returns number of bills generated.
 */
export async function processRecurringBills(): Promise<number> {
  const recurring = await getRecurringBills();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let count = 0;

  for (const r of recurring) {
    if (!r.enabled) continue;

    const start = new Date(r.startDate);
    start.setHours(0, 0, 0, 0);
    if (start > today) continue;

    const lastGen = r.lastGenerated ? new Date(r.lastGenerated) : null;
    if (lastGen) lastGen.setHours(0, 0, 0, 0);

    const datesToGenerate: Date[] = [];
    const cursor = new Date(lastGen ? lastGen.getTime() + 86400000 : start.getTime());

    const MAX_ITER = 366;
    let iter = 0;
    while (cursor <= today && iter++ < MAX_ITER) {
      let shouldGenerate = false;

      if (r.cycle === 'daily') {
        shouldGenerate = true;
      } else if (r.cycle === 'weekly') {
        shouldGenerate = cursor.getDay() === (r.dayOfWeek ?? 1);
      } else if (r.cycle === 'monthly') {
        const dom = r.dayOfMonth ?? 1;
        const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        shouldGenerate = cursor.getDate() === Math.min(dom, lastDay);
      } else if (r.cycle === 'yearly') {
        const dom = r.dayOfMonth ?? 1;
        const moy = r.monthOfYear ?? 0;
        shouldGenerate = cursor.getMonth() === moy && cursor.getDate() === dom;
      }

      if (shouldGenerate) {
        datesToGenerate.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (datesToGenerate.length > 0) {
      for (const d of datesToGenerate) {
        d.setHours(9, 0, 0, 0);
        const bill: Bill = {
          id: generateId(),
          amount: r.amount,
          type: r.type,
          categoryId: r.categoryId,
          note: r.note ? `${r.note}（自动）` : '周期自动记账',
          date: d.toISOString(),
          createdAt: new Date().toISOString(),
        };
        await addBill(bill);
        count++;
      }
      r.lastGenerated = today.toISOString();
      await updateRecurringBill(r);
    }
  }

  return count;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
