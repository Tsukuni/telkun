import { NextRequest, NextResponse } from "next/server";
import {
  getSectionById,
  updateSection,
  deleteSection,
  parseFeatures,
} from "@/lib/data/sections";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const section = await getSectionById(id);

  if (!section) {
    return NextResponse.json(
      { error: "区画が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: section.id,
    name: section.name,
    floor: section.floor,
    area: section.area,
    rentPrice: section.rentPrice,
    category: section.category,
    status: section.status,
    features: parseFeatures(section),
    description: section.description,
    inquiries: section.inquiries,
    reservations: section.reservations,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const section = await updateSection(id, {
      name: body.name,
      floor: body.floor ? Number(body.floor) : undefined,
      area: body.area ? Number(body.area) : undefined,
      rentPrice: body.rentPrice ? Number(body.rentPrice) : undefined,
      category: body.category,
      status: body.status,
      features: body.features,
      description: body.description,
    });

    return NextResponse.json({
      id: section.id,
      name: section.name,
      floor: section.floor,
      area: section.area,
      rentPrice: section.rentPrice,
      category: section.category,
      status: section.status,
      features: parseFeatures(section),
      description: section.description,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "区画の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "区画の削除に失敗しました" },
      { status: 500 }
    );
  }
}
