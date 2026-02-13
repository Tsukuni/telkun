import { NextRequest, NextResponse } from "next/server";
import { deleteReservation } from "@/lib/data/sections";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteReservation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: "予約の削除に失敗しました" },
      { status: 500 }
    );
  }
}
