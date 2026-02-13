import { NextRequest, NextResponse } from "next/server";
import {
  getReservationsBySection,
  isSectionAvailable,
  createReservation,
} from "@/lib/data/sections";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);

  const reservations = await getReservationsBySection(id, from, to);

  return NextResponse.json({
    sectionId: id,
    year,
    month,
    reservations: reservations.map((r) => ({
      id: r.id,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      tenantName: r.tenantName,
      purpose: r.purpose,
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { startDate, endDate, tenantName, purpose, note } = body;

    if (!startDate || !endDate || !tenantName || !purpose) {
      return NextResponse.json(
        { error: "開始日、終了日、テナント名、用途は必須です" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const available = await isSectionAvailable(id, start, end);
    if (!available) {
      return NextResponse.json(
        { error: "指定された期間には既に予約が存在します" },
        { status: 409 }
      );
    }

    const reservation = await createReservation({
      sectionId: id,
      startDate: start,
      endDate: end,
      tenantName,
      purpose,
      note,
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "予約の作成に失敗しました" },
      { status: 500 }
    );
  }
}
