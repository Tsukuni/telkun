import { NextRequest, NextResponse } from "next/server";
import { createGreetingResponse, validateTwilioRequest } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!validateTwilioRequest(request, body)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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
