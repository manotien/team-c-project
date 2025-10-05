"use client";

import { useState, useEffect, useMemo } from "react";
import { formatRecurrencePreview } from "@/lib/utils/recurrence";
import type { RecurrenceSettings } from "@/lib/utils/recurrence";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface RecurrenceSelectorProps {
  value: RecurrenceSettings | null;
  onChange: (value: RecurrenceSettings | null) => void;
}

export function RecurrenceSelector({
  value,
  onChange,
}: RecurrenceSelectorProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">(
    value?.type || "MONTHLY"
  );
  const [interval, setInterval] = useState(value?.interval || 1);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(
    value?.dayOfWeek
  );
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(
    value?.dayOfMonth
  );
  const [monthOfYear, setMonthOfYear] = useState<number | undefined>(
    value?.monthOfYear
  );
  const [endDate, setEndDate] = useState<string | undefined>(value?.endDate);

  // Update parent when values change
  useEffect(() => {
    if (!enabled) {
      onChange(null);
      return;
    }

    const settings: RecurrenceSettings = {
      type: frequency,
      interval,
      dayOfWeek: frequency === "WEEKLY" ? dayOfWeek : undefined,
      dayOfMonth: frequency !== "WEEKLY" ? dayOfMonth : undefined,
      monthOfYear: frequency === "YEARLY" ? monthOfYear : undefined,
      endDate,
    };
    onChange(settings);
  }, [
    enabled,
    frequency,
    interval,
    dayOfWeek,
    dayOfMonth,
    monthOfYear,
    endDate,
    onChange,
  ]);

  // Initialize day/month values when frequency changes
  useEffect(() => {
    const today = new Date();
    if (frequency === "WEEKLY" && dayOfWeek === undefined) {
      setDayOfWeek(today.getDay());
    }
    if (frequency === "MONTHLY" && dayOfMonth === undefined) {
      setDayOfMonth(today.getDate());
    }
    if (frequency === "YEARLY") {
      if (monthOfYear === undefined) {
        setMonthOfYear(today.getMonth() + 1);
      }
      if (dayOfMonth === undefined) {
        setDayOfMonth(today.getDate());
      }
    }
  }, [frequency, dayOfWeek, dayOfMonth, monthOfYear]);

  // Preview calculation
  const preview = useMemo(() => {
    if (!enabled || !value) return "";
    try {
      return formatRecurrencePreview(value, new Date());
    } catch {
      return "";
    }
  }, [enabled, value]);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded"
        />
        <span className="font-medium">Set as Recurring</span>
      </label>

      {enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
          {/* Frequency and Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as "WEEKLY" | "MONTHLY" | "YEARLY")
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Every (interval)
              </label>
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Conditional Fields */}
          {frequency === "WEEKLY" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {frequency === "MONTHLY" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}

          {frequency === "YEARLY" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <select
                  value={monthOfYear}
                  onChange={(e) => setMonthOfYear(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* End Date (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value || undefined)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {preview}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
