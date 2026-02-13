"use client";

import { useState, useEffect, useCallback } from "react";

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  tenantName: string;
  purpose: string;
}

interface BlockedDateEntry {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
}

interface SectionCalendarProps {
  sectionId: string;
  reservations: Reservation[];
  onDataChange: () => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day
  );
}

export default function SectionCalendar({
  sectionId,
  reservations,
  onDataChange,
}: SectionCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlockedDates = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/sections/${sectionId}/blocked-dates?year=${year}&month=${month}`
    );
    if (res.ok) {
      const data = await res.json();
      setBlockedDates(data.blockedDates);
    }
    setLoading(false);
  }, [sectionId, year, month]);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

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

  // Build lookup maps
  const blockedMap = new Map<string, BlockedDateEntry>();
  for (const bd of blockedDates) {
    blockedMap.set(bd.date, bd);
  }

  const reservationMap = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = formatDate(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth() + 1,
        cursor.getUTCDate()
      );
      if (!reservationMap.has(key)) {
        reservationMap.set(key, []);
      }
      reservationMap.get(key)!.push(r);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const handleDayClick = async (dateStr: string) => {
    const blocked = blockedMap.get(dateStr);
    const reserved = reservationMap.get(dateStr);

    // Reserved days are read-only
    if (reserved && reserved.length > 0) return;

    if (blocked) {
      if (!confirm(`${dateStr} の貸し出し不可を解除しますか？\n理由: ${blocked.reason || "(なし)"}`)) {
        return;
      }
      await fetch(`/api/sections/${sectionId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
    } else {
      const reason = prompt(`${dateStr} を貸し出し不可にします。理由を入力してください:`, "");
      if (reason === null) return; // cancelled
      await fetch(`/api/sections/${sectionId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, reason }),
      });
    }

    fetchBlockedDates();
    onDataChange();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
        カレンダー / 貸し出し不可日管理
      </h2>

      {/* Month navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
        >
          ← 前月
        </button>
        <span className="text-base font-medium text-zinc-900 dark:text-white">
          {year}年{month}月
        </span>
        <button
          onClick={nextMonth}
          className="rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
        >
          翌月 →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-800">
          {weekdays.map((wd, i) => (
            <div
              key={wd}
              className={`py-2 text-center text-xs font-medium ${
                i === 0
                  ? "text-red-500"
                  : i === 6
                    ? "text-blue-500"
                    : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-16 border-t border-zinc-100 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50"
                />
              );
            }

            const dateStr = formatDate(year, month, day);
            const blocked = blockedMap.get(dateStr);
            const reserved = reservationMap.get(dateStr);
            const today = isToday(year, month, day);
            const dayOfWeek = (firstDay + day - 1) % 7;

            let cellClass =
              "h-16 border-t border-zinc-100 dark:border-zinc-700 relative cursor-pointer transition-colors ";

            if (blocked) {
              cellClass +=
                "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 ";
            } else if (reserved && reserved.length > 0) {
              cellClass +=
                "bg-blue-50 dark:bg-blue-900/20 cursor-default ";
            } else {
              cellClass +=
                "bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 ";
            }

            const tooltipText = reserved?.length
              ? reserved.map((r) => `${r.tenantName} (${r.purpose})`).join(", ")
              : blocked
                ? `不可: ${blocked.reason || "(理由なし)"}`
                : undefined;

            return (
              <div
                key={day}
                className={cellClass}
                onClick={() => handleDayClick(dateStr)}
                title={tooltipText}
              >
                <span
                  className={`absolute left-1.5 top-1 text-xs font-medium ${
                    today
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white"
                      : dayOfWeek === 0
                        ? "text-red-500"
                        : dayOfWeek === 6
                          ? "text-blue-500"
                          : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {day}
                </span>
                {blocked && (
                  <span className="absolute bottom-1 left-1.5 text-[10px] leading-tight text-red-600 dark:text-red-400">
                    {blocked.reason
                      ? blocked.reason.length > 6
                        ? blocked.reason.slice(0, 6) + "…"
                        : blocked.reason
                      : "不可"}
                  </span>
                )}
                {reserved && reserved.length > 0 && (
                  <span className="absolute bottom-1 left-1.5 text-[10px] leading-tight text-blue-600 dark:text-blue-400">
                    {reserved[0].tenantName.length > 6
                      ? reserved[0].tenantName.slice(0, 6) + "…"
                      : reserved[0].tenantName}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-100 border border-red-300 dark:bg-red-900/30 dark:border-red-700" />
          貸し出し不可日（クリックで解除）
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-100 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-700" />
          予約あり（読み取り専用）
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-amber-500" />
          今日
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-white border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600" />
          空き（クリックで不可設定）
        </div>
      </div>

      {loading && (
        <p className="mt-2 text-xs text-zinc-400">読み込み中...</p>
      )}
    </div>
  );
}
