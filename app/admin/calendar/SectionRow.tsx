"use client";

import Link from "next/link";
import type { CalendarInquiry } from "./InquiryPopover";

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  tenantName: string;
  purpose: string;
  note: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

export interface CalendarSection {
  id: string;
  name: string;
  floor: number;
  category: string;
  status: string;
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  inquiries: CalendarInquiry[];
}

interface SectionRowProps {
  section: CalendarSection;
  year: number;
  month: number;
  daysInMonth: number;
  onInquiryClick: (inquiry: CalendarInquiry, sectionId: string, rect: DOMRect) => void;
}

function dayOfMonth(dateStr: string): number {
  // dateStr is either ISO "2026-02-15T00:00:00.000Z" or "2026-02-15"
  const d = new Date(dateStr);
  return d.getUTCDate();
}

function monthOf(dateStr: string): number {
  return new Date(dateStr).getUTCMonth() + 1;
}

function yearOf(dateStr: string): number {
  return new Date(dateStr).getUTCFullYear();
}

const inquiryDotColors: Record<string, string> = {
  new: "bg-orange-500",
  contacted: "bg-blue-400",
  closed: "bg-zinc-400",
};

export default function SectionRow({
  section,
  year,
  month,
  daysInMonth,
  onInquiryClick,
}: SectionRowProps) {
  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : -1;

  // Build blocked date set
  const blockedSet = new Set<number>();
  for (const bd of section.blockedDates) {
    const parts = bd.date.split("-");
    blockedSet.add(Number(parts[2]));
  }

  // Build inquiry map: day -> inquiries
  const inquiryMap = new Map<number, CalendarInquiry[]>();
  for (const inq of section.inquiries) {
    const d = new Date(inq.createdAt);
    const day =
      d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month
        ? d.getUTCDate()
        : -1;
    if (day > 0) {
      if (!inquiryMap.has(day)) inquiryMap.set(day, []);
      inquiryMap.get(day)!.push(inq);
    }
  }

  // Compute reservation bars with lane assignment for overlaps
  type ReservationBar = {
    reservation: Reservation;
    startCol: number; // 1-based day
    endCol: number; // 1-based day (inclusive)
    lane: number;
  };

  const bars: ReservationBar[] = [];
  for (const r of section.reservations) {
    const rStartYear = yearOf(r.startDate);
    const rStartMonth = monthOf(r.startDate);
    const rEndYear = yearOf(r.endDate);
    const rEndMonth = monthOf(r.endDate);

    const startCol =
      rStartYear === year && rStartMonth === month ? dayOfMonth(r.startDate) : 1;
    const endCol =
      rEndYear === year && rEndMonth === month ? dayOfMonth(r.endDate) : daysInMonth;

    bars.push({ reservation: r, startCol, endCol, lane: 0 });
  }

  // Assign lanes (greedy)
  bars.sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);
  for (let i = 0; i < bars.length; i++) {
    const usedLanes = new Set<number>();
    for (let j = 0; j < i; j++) {
      if (bars[j].endCol >= bars[i].startCol && bars[j].startCol <= bars[i].endCol) {
        usedLanes.add(bars[j].lane);
      }
    }
    let lane = 0;
    while (usedLanes.has(lane)) lane++;
    bars[i].lane = lane;
  }

  const maxLane = bars.reduce((m, b) => Math.max(m, b.lane), -1);
  const rowHeight = Math.max(48, 28 + (maxLane + 1) * 22);

  return (
    <div className="flex" style={{ height: rowHeight }}>
      {/* Section label - sticky left */}
      <div
        className="sticky left-0 z-20 flex w-[200px] min-w-[200px] items-center border-b border-r border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <Link
          href={`/admin/sections/${section.id}`}
          className="truncate text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
          title={`${section.floor}F ${section.name} (${section.category})`}
        >
          <span className="text-zinc-400 dark:text-zinc-500">{section.floor}F</span>{" "}
          {section.name}
          <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">
            {section.category}
          </span>
        </Link>
      </div>

      {/* Day cells */}
      <div className="relative flex">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isWeekend = new Date(year, month - 1, day).getDay() % 6 === 0;
          const isBlocked = blockedSet.has(day);
          const isToday = day === todayDay;
          const dayInquiries = inquiryMap.get(day);

          let cellBg = "";
          if (isToday) {
            cellBg = "bg-amber-50 dark:bg-amber-900/10";
          } else if (isWeekend) {
            cellBg = "bg-zinc-50/50 dark:bg-zinc-800/50";
          }

          return (
            <div
              key={day}
              className={`relative w-11 min-w-[44px] border-b border-r border-zinc-100 dark:border-zinc-800 ${cellBg}`}
              style={{ height: rowHeight }}
            >
              {/* Blocked date overlay */}
              {isBlocked && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, transparent, transparent 3px, #ef4444 3px, #ef4444 4px)",
                  }}
                />
              )}

              {/* Inquiry dots */}
              {dayInquiries && (
                <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {dayInquiries.slice(0, 3).map((inq) => (
                    <button
                      key={inq.id}
                      className={`h-2 w-2 rounded-full ${inquiryDotColors[inq.status] || "bg-zinc-400"} hover:ring-2 hover:ring-offset-1`}
                      onClick={(e) => {
                        onInquiryClick(inq, section.id, e.currentTarget.getBoundingClientRect());
                      }}
                    />
                  ))}
                  {dayInquiries.length > 3 && (
                    <span className="text-[8px] leading-none text-zinc-400">
                      +{dayInquiries.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Reservation bars overlaid */}
        {bars.map((bar) => {
          const left = (bar.startCol - 1) * 44;
          const width = (bar.endCol - bar.startCol + 1) * 44 - 4;
          const top = 4 + bar.lane * 22;

          return (
            <Link
              key={bar.reservation.id}
              href={`/admin/sections/${section.id}`}
              className="absolute z-10 flex items-center rounded px-1.5 text-[11px] font-medium text-white bg-blue-500/80 hover:bg-blue-600/90 dark:bg-blue-600/80 dark:hover:bg-blue-500/90 truncate"
              style={{ left, width: Math.max(width, 20), top, height: 18 }}
              title={`${bar.reservation.tenantName} (${bar.reservation.purpose})\n${bar.reservation.startDate.slice(0, 10)} 〜 ${bar.reservation.endDate.slice(0, 10)}`}
            >
              {bar.reservation.tenantName}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
