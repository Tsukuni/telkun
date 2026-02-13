import { NextResponse } from "next/server";
import { createGreetingResponse } from "@/lib/twilio";

export async function POST() {
  const twiml = createGreetingResponse();

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

// Twilioはテストでhealthcheckを行う場合があるため、GETもサポート
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "twilio/voice" });
}
