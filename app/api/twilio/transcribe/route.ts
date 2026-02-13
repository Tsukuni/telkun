import { NextRequest, NextResponse } from "next/server";
import { createSpeechResponse, createErrorResponse } from "@/lib/twilio";
import { processUserQuery } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Twilioからの音声認識結果を取得
    const speechResult = formData.get("SpeechResult") as string | null;

    if (!speechResult) {
      console.log("No speech result received");
      const twiml = createSpeechResponse(
        "音声が聞き取れませんでした。もう一度お話しください。"
      );
      return new NextResponse(twiml, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    console.log("Received speech:", speechResult);

    // Claude AIで処理
    const aiResponse = await processUserQuery(speechResult);

    console.log("AI response:", aiResponse);

    // TwiMLで応答
    const twiml = createSpeechResponse(aiResponse);

    return new NextResponse(twiml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    console.error("Error processing transcription:", error);

    const twiml = createErrorResponse();
    return new NextResponse(twiml, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "twilio/transcribe" });
}
