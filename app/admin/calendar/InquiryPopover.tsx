"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export interface CalendarInquiry {
  id: string;
  callerName: string;
  callerPhone: string;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  new: "新規",
  contacted: "対応済み",
  closed: "クローズ",
};

const statusColors: Record<string, string> = {
  new: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

interface InquiryPopoverProps {
  inquiry: CalendarInquiry;
  sectionId: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

export default function InquiryPopover({
  inquiry,
  sectionId,
  anchorRect,
  onClose,
}: InquiryPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Position: prefer below-right, adjust if overflows
    const popW = 320;
    const popH = el.offsetHeight;
    let left = anchorRect.left + anchorRect.width / 2 - popW / 2;
    let top = anchorRect.bottom + 8;

    if (left + popW > window.innerWidth - 16) left = window.innerWidth - popW - 16;
    if (left < 16) left = 16;
    if (top + popH > window.innerHeight - 16) top = anchorRect.top - popH - 8;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [anchorRect]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
      style={{ left: 0, top: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-white">
            {inquiry.callerName}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inquiry.status] || ""}`}
          >
            {statusLabels[inquiry.status] || inquiry.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {inquiry.callerPhone} · {inquiry.inquiryType}
      </p>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
        {inquiry.message}
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        {new Date(inquiry.createdAt).toLocaleString("ja-JP")}
      </p>
      <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-700">
        <Link
          href={`/admin/sections/${sectionId}`}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          区画詳細ページへ →
        </Link>
      </div>
    </div>
  );
}
