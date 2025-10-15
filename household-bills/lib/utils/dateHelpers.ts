import { addDays, isBefore, differenceInDays, formatDistanceToNow, format } from 'date-fns';

/**
 * Check if a task is due soon (within 7 days but not overdue)
 */
export function isDueSoon(dueDate: Date): boolean {
  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);
  return isBefore(dueDate, sevenDaysFromNow) && !isOverdue(dueDate);
}

/**
 * Check if a task is overdue (due date has passed)
 */
export function isOverdue(dueDate: Date): boolean {
  const now = new Date();
  return isBefore(dueDate, now);
}

/**
 * Get the number of days a task is overdue
 * Returns 0 if not overdue
 */
export function getDaysOverdue(dueDate: Date): number {
  if (!isOverdue(dueDate)) return 0;

  const now = new Date();
  return differenceInDays(now, dueDate);
}

/**
 * Format a date relative to now (e.g., "in 2 days", "3 days ago")
 */
export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date in absolute format (e.g., "Oct 15, 2025")
 */
export function formatAbsoluteDate(date: Date, formatStr = 'MMM dd, yyyy'): string {
  return format(date, formatStr);
}

/**
 * Format a date in short format (e.g., "Oct 15")
 */
export function formatShortDate(date: Date): string {
  return format(date, 'MMM dd');
}
