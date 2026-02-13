import { NextResponse } from "next/server";
import { getFacility } from "@/lib/data/sections";

export async function GET() {
  const facility = await getFacility();

  if (!facility) {
    return NextResponse.json(
      { error: "施設が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: facility.id,
    name: facility.name,
    address: facility.address,
    phone: facility.phone,
    hours: facility.hours,
    sectionCount: facility.sections.length,
    vacantCount: facility.sections.filter((s) => s.status === "vacant").length,
  });
}
