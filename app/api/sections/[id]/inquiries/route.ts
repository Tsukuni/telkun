import { NextRequest, NextResponse } from "next/server";
import {
  getInquiriesBySection,
  createInquiry,
  getSectionById,
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

  const inquiries = await getInquiriesBySection(id);

  return NextResponse.json({ inquiries });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { callerName, callerPhone, inquiryType, message } = body;

    if (!callerName || !callerPhone || !inquiryType || !message) {
      return NextResponse.json(
        { error: "callerName, callerPhone, inquiryType, message は必須です" },
        { status: 400 }
      );
    }

    const section = await getSectionById(id);
    if (!section) {
      return NextResponse.json(
        { error: "区画が見つかりません" },
        { status: 404 }
      );
    }

    const inquiry = await createInquiry({
      sectionId: id,
      callerName,
      callerPhone,
      inquiryType,
      message,
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "問い合わせの作成に失敗しました" },
      { status: 500 }
    );
  }
}
