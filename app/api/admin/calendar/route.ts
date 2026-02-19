import { NextRequest, NextResponse } from "next/server";
import { getCalendarData } from "@/lib/data/sections";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const now = new Date();
  const year = Number(searchParams.get("year") || now.getFullYear());
  const month = Number(searchParams.get("month") || now.getMonth() + 1);

  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "month は 1〜12 で指定してください" }, { status: 400 });
  }

  const sections = await getCalendarData(year, month);

  return NextResponse.json({
    year,
    month,
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      floor: s.floor,
      category: s.category,
      status: s.status,
      reservations: s.reservations.map((r) => ({
        id: r.id,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        tenantName: r.tenantName,
        purpose: r.purpose,
        note: r.note,
      })),
      blockedDates: s.blockedDates.map((bd) => ({
        id: bd.id,
        date: bd.date.toISOString().slice(0, 10),
        reason: bd.reason,
      })),
      inquiries: s.inquiries.map((inq) => ({
        id: inq.id,
        callerName: inq.callerName,
        callerPhone: inq.callerPhone,
        inquiryType: inq.inquiryType,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString(),
      })),
    })),
  });
}
