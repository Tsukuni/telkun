"use client";

import { useState } from "react";
import SectionRow from "./SectionRow";
import InquiryPopover from "./InquiryPopover";
import type { CalendarSection } from "./SectionRow";
import type { CalendarInquiry } from "./InquiryPopover";

interface ResourceCalendarProps {
  sections: CalendarSection[];
  year: number;
  month: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function ResourceCalendar({
  sections,
  year,
  month,
}: ResourceCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : -1;

  const [popover, setPopover] = useState<{
    inquiry: CalendarInquiry;
    sectionId: string;
    rect: DOMRect;
  } | null>(null);

  const handleInquiryClick = (
    inquiry: CalendarInquiry,
    sectionId: string,
    rect: DOMRect
  ) => {
    setPopover({ inquiry, sectionId, rect });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="inline-flex min-w-full flex-col">
        {/* Header row */}
        <div className="flex">
          {/* Corner cell */}
          <div className="sticky left-0 z-30 flex w-[200px] min-w-[200px] items-end border-b border-r border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              区画
            </span>
          </div>

          {/* Day headers */}
          <div className="flex">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dow = new Date(year, month - 1, day).getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isToday = day === todayDay;

              let headerBg = "bg-zinc-50 dark:bg-zinc-800";
              if (isToday) headerBg = "bg-amber-50 dark:bg-amber-900/10";
              else if (isWeekend) headerBg = "bg-zinc-100/50 dark:bg-zinc-800/80";

              return (
                <div
                  key={day}
                  className={`flex w-11 min-w-[44px] flex-col items-center border-b border-r border-zinc-200 py-1 dark:border-zinc-700 ${headerBg}`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white"
                        : dow === 0
                          ? "text-red-500"
                          : dow === 6
                            ? "text-blue-500"
                            : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {day}
                  </span>
                  <span
                    className={`text-[10px] ${
                      dow === 0
                        ? "text-red-400"
                        : dow === 6
                          ? "text-blue-400"
                          : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {weekdayLabels[dow]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section rows */}
        {sections.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-zinc-400">
            区画データがありません
          </div>
        ) : (
          sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              year={year}
              month={month}
              daysInMonth={daysInMonth}
              onInquiryClick={handleInquiryClick}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="sticky left-0 flex flex-wrap gap-4 border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded-sm bg-blue-500/80" />
          予約
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-red-300"
            style={{
              background:
                "repeating-linear-gradient(135deg, transparent, transparent 2px, #ef4444 2px, #ef4444 3px)",
              opacity: 0.4,
            }}
          />
          貸出不可
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          問い合わせ(新規)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
          問い合わせ(対応済み)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
          問い合わせ(クローズ)
        </div>
      </div>

      {/* Inquiry popover */}
      {popover && (
        <InquiryPopover
          inquiry={popover.inquiry}
          sectionId={popover.sectionId}
          anchorRect={popover.rect}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
