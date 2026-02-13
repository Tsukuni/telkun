import { NextRequest, NextResponse } from "next/server";
import {
  getAllSections,
  createSection,
  parseFeatures,
  getFacility,
} from "@/lib/data/sections";

export async function GET() {
  const sections = await getAllSections();

  return NextResponse.json({
    sections: sections.map((section) => ({
      id: section.id,
      name: section.name,
      floor: section.floor,
      area: section.area,
      rentPrice: section.rentPrice,
      category: section.category,
      status: section.status,
      features: parseFeatures(section),
      description: section.description,
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, floor, area, rentPrice, category, features, description } = body;

    if (!name || !floor || !area || !rentPrice || !category) {
      return NextResponse.json(
        { error: "name, floor, area, rentPrice, category は必須です" },
        { status: 400 }
      );
    }

    const facility = await getFacility();
    if (!facility) {
      return NextResponse.json(
        { error: "施設が見つかりません" },
        { status: 404 }
      );
    }

    const section = await createSection({
      facilityId: facility.id,
      name,
      floor: Number(floor),
      area: Number(area),
      rentPrice: Number(rentPrice),
      category,
      features: features || [],
      description: description || "",
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
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "区画の作成に失敗しました" },
      { status: 500 }
    );
  }
}
