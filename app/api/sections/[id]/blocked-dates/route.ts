import { NextRequest, NextResponse } from "next/server";
import {
  getBlockedDatesBySection,
  toggleBlockedDate,
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

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const blockedDates = await getBlockedDatesBySection(id, from, to);

  return NextResponse.json({
    sectionId: id,
    year,
    month,
    blockedDates: blockedDates.map((bd) => ({
      id: bd.id,
      date: bd.date.toISOString().split("T")[0],
      reason: bd.reason,
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
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json(
        { error: "日付は必須です" },
        { status: 400 }
      );
    }

    const utcDate = new Date(date + "T00:00:00.000Z");
    const result = await toggleBlockedDate(id, utcDate, reason);

    return NextResponse.json(result, {
      status: result.action === "created" ? 201 : 200,
    });
  } catch (error) {
    console.error("Error toggling blocked date:", error);
    return NextResponse.json(
      { error: "貸し出し不可日の更新に失敗しました" },
      { status: 500 }
    );
  }
}
