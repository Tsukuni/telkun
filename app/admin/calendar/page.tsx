"use client";

import { useState, useEffect, useCallback } from "react";
import ResourceCalendar from "./ResourceCalendar";
import type { CalendarSection } from "./SectionRow";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sections, setSections] = useState<CalendarSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/calendar?year=${year}&month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setSections(data.sections);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
  };

  return (
    <div className="-mx-4 px-4 max-w-none">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          カレンダー
        </h1>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            ← 前月
          </button>
          <button
            onClick={goToday}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            今日
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            翌月 →
          </button>
          <span className="ml-2 text-lg font-semibold text-zinc-900 dark:text-white">
            {year}年{month}月
          </span>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          読み込み中...
        </div>
      ) : (
        <ResourceCalendar sections={sections} year={year} month={month} />
      )}
    </div>
  );
}
