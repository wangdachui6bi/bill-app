import dayjs from 'dayjs';

export function formatAmount(amount: number, type?: 'expense' | 'income'): string {
  const formatted = amount.toFixed(2);
  if (type === 'expense') return `-${formatted}`;
  if (type === 'income') return `+${formatted}`;
  return formatted;
}

export function formatDate(date: string, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatMonth(date: string): string {
  return dayjs(date).format('YYYY年M月');
}

export function getMonthKey(date: Date | string): string {
  return dayjs(date).format('YYYY-MM');
}

export function getDaysInMonth(year: number, month: number): number {
  return dayjs(`${year}-${month}`).daysInMonth();
}

export function isToday(date: string): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function getRelativeDate(date: string): string {
  const d = dayjs(date);
  const now = dayjs();
  if (d.isSame(now, 'day')) return '今天';
  if (d.isSame(now.subtract(1, 'day'), 'day')) return '昨天';
  if (d.isSame(now.subtract(2, 'day'), 'day')) return '前天';
  return d.format('M月D日');
}
