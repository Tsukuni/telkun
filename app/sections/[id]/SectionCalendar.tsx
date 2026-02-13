"use client";

import { useState, useEffect, useCallback } from "react";

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  tenantName: string;
  purpose: string;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function SectionCalendar({ sectionId }: { sectionId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/sections/${sectionId}/reservations?year=${year}&month=${month}`
    );
    const data = await res.json();
    setReservations(data.reservations);
    setLoading(false);
  }, [sectionId, year, month]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

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

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  function getReservationForDay(day: number): Reservation | undefined {
    const date = new Date(year, month - 1, day);
    return reservations.find((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }

  function isPast(day: number): boolean {
    const date = new Date(year, month - 1, day);
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return date < todayStart;
  }

  function isToday(day: number): boolean {
    return `${year}-${month}-${day}` === todayStr;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          予約カレンダー
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            ←
          </button>
          <span className="min-w-[120px] text-center font-medium text-zinc-900 dark:text-white">
            {year}年{month}月
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 py-12 text-center text-zinc-500">
          読み込み中...
        </div>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  i === 0
                    ? "text-red-500"
                    : i === 6
                      ? "text-blue-500"
                      : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const reservation = getReservationForDay(day);
              const past = isPast(day);
              const todayFlag = isToday(day);
              const dayOfWeek = (firstDayOfWeek + i) % 7;

              return (
                <div
                  key={day}
                  className={`relative h-16 rounded-lg border p-1 ${
                    reservation
                      ? "border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700"
                      : past
                        ? "border-zinc-100 bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-800/50"
                        : "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10"
                  } ${todayFlag ? "ring-2 ring-blue-500" : ""}`}
                >
                  <span
                    className={`text-xs font-medium ${
                      past
                        ? "text-zinc-400 dark:text-zinc-500"
                        : dayOfWeek === 0
                          ? "text-red-600 dark:text-red-400"
                          : dayOfWeek === 6
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {day}
                  </span>
                  {reservation && !past && (
                    <div className="mt-0.5 truncate text-[10px] leading-tight text-zinc-600 dark:text-zinc-400">
                      {reservation.purpose}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10" />
              空き
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700" />
              予約済み
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-zinc-100 bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-800/50" />
              過去
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded ring-2 ring-blue-500" />
              今日
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
