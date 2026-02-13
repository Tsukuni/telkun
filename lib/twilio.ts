import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export function createGreetingResponse(): string {
  const response = new VoiceResponse();

  response.say(
    {
      language: "ja-JP",
      voice: "Google.ja-JP-Neural2-B",
    },
    "つくにんモール渋谷テナント案内です。ご用件をお話しください。"
  );

  // 音声入力を待機し、transcribeエンドポイントに送信
  response.gather({
    input: ["speech"],
    language: "ja-JP",
    speechTimeout: "auto",
    action: "/api/twilio/transcribe",
    method: "POST",
  });

  // タイムアウト時の応答
  response.say(
    {
      language: "ja-JP",
      voice: "Google.ja-JP-Neural2-B",
    },
    "音声が聞き取れませんでした。もう一度お試しください。"
  );

  return response.toString();
}

export function createSpeechResponse(text: string, listenAgain = true): string {
  const response = new VoiceResponse();

  response.say(
    {
      language: "ja-JP",
      voice: "Google.ja-JP-Neural2-B",
    },
    text
  );

  if (listenAgain) {
    // 続けて質問を受け付ける
    response.gather({
      input: ["speech"],
      language: "ja-JP",
      speechTimeout: "auto",
      action: "/api/twilio/transcribe",
      method: "POST",
    });

    response.say(
      {
        language: "ja-JP",
        voice: "Google.ja-JP-Neural2-B",
      },
      "他にご質問がなければ、電話をお切りください。"
    );
  }

  return response.toString();
}

export function createErrorResponse(): string {
  const response = new VoiceResponse();

  response.say(
    {
      language: "ja-JP",
      voice: "Google.ja-JP-Neural2-B",
    },
    "申し訳ございません。システムエラーが発生しました。しばらくしてからもう一度お試しください。"
  );

  return response.toString();
}

export function createEndCallResponse(text: string): string {
  const response = new VoiceResponse();

  response.say(
    {
      language: "ja-JP",
      voice: "Google.ja-JP-Neural2-B",
    },
    text
  );

  response.hangup();

  return response.toString();
}
