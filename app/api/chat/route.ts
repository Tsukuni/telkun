import { NextRequest, NextResponse } from "next/server";
import { processChatMessage } from "@/lib/ai";
import type Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history?: Anthropic.MessageParam[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const result = await processChatMessage(message, history ?? []);

    return NextResponse.json({
      text: result.text,
      messages: result.messages,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: "内部エラーが発生しました" },
      { status: 500 }
    );
  }
}
