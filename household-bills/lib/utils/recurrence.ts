import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isSameDay,
  lastDayOfMonth,
  setDate,
  setMonth,
  format,
} from "date-fns";

export interface RecurrenceSettings {
  type: "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  dayOfWeek?: number; // 0-6 (0=Sunday)
  dayOfMonth?: number; // 1-31
  monthOfYear?: number; // 1-12 (1=January)
  endDate?: string;
}

export function calculateNextRecurrenceDate(
  recurrence: RecurrenceSettings,
  lastDate: Date
): Date {
  const { type, interval, dayOfWeek, dayOfMonth, monthOfYear } = recurrence;

  switch (type) {
    case "WEEKLY":
      // Add weeks and adjust to specific day of week
      let nextWeekly = addWeeks(lastDate, interval);
      if (dayOfWeek !== undefined) {
        // Adjust to the specified day of week
        const currentDay = nextWeekly.getDay();
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        nextWeekly = addDays(nextWeekly, daysToAdd);
      }
      return nextWeekly;

    case "MONTHLY":
      // Add months and adjust to specific day of month
      let nextMonthly = addMonths(lastDate, interval);
      if (dayOfMonth !== undefined) {
        try {
          nextMonthly = setDate(nextMonthly, dayOfMonth);
        } catch {
          // Day doesn't exist in month (e.g., Feb 31) → use last day
          nextMonthly = lastDayOfMonth(nextMonthly);
        }
      }
      return nextMonthly;

    case "YEARLY":
      // Add years and adjust to specific month and day
      let nextYearly = addYears(lastDate, interval);
      if (monthOfYear !== undefined) {
        nextYearly = setMonth(nextYearly, monthOfYear - 1); // setMonth uses 0-11
      }
      if (dayOfMonth !== undefined) {
        try {
          nextYearly = setDate(nextYearly, dayOfMonth);
        } catch {
          nextYearly = lastDayOfMonth(nextYearly);
        }
      }
      return nextYearly;

    default:
      throw new Error("Invalid recurrence type");
  }
}

export function shouldCreateToday(nextDate: Date): boolean {
  const today = new Date();
  return isSameDay(today, nextDate);
}

export function formatRecurrencePreview(
  recurrence: RecurrenceSettings,
  currentDate: Date
): string {
  const nextDate = calculateNextRecurrenceDate(recurrence, currentDate);
  const formatted = format(nextDate, "EEEE, MMMM d, yyyy");

  return `Next bill will be created on: ${formatted}`;
}
