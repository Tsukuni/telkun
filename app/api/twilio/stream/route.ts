/**
 * Twilio Media Stream 開始エンドポイント
 * <Connect><Stream> TwiMLを返す
 */

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { validateTwilioRequest } from "@/lib/twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    // Twilioリクエスト署名を検証
    const body = await request.text();
    if (!validateTwilioRequest(request, body)) {
      console.error("[Stream] Invalid Twilio signature");
      return new NextResponse("Forbidden", { status: 403 });
    }

    // リクエストホストからWebSocket URLを構築
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "ws" : "wss";
    const wsUrl = `${protocol}://${host}/api/media-stream`;

    console.log(`[Stream] Creating TwiML with WebSocket URL: ${wsUrl}`);

    const response = new VoiceResponse();

    // Bidirectional Media Stream を開始
    const connect = response.connect();
    connect.stream({
      url: wsUrl,
    });

    const twiml = response.toString();
    console.log("[Stream] TwiML:", twiml);

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("[Stream] Error creating TwiML:", error);

    // エラー時のフォールバック
    const response = new VoiceResponse();
    response.say(
      {
        language: "ja-JP",
        voice: "Google.ja-JP-Neural2-B",
      },
      "申し訳ございません。システムエラーが発生しました。"
    );
    response.hangup();

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "twilio/stream",
    description: "POST to this endpoint to start a Media Stream",
  });
}
