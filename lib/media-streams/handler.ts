/**
 * Twilio Media Streams WebSocket ハンドラー
 * リアルタイム音声会話を処理
 */

import type { WebSocket } from "ws";
import Anthropic from "@anthropic-ai/sdk";
import { DeepgramSTT } from "../stt/deepgram";
import { getTTSClient } from "../tts/elevenlabs";
import { FillerManager } from "./filler";
import { sessionManager } from "./session";
import {
  getAllSections,
  getSectionByName,
  getActiveSections,
  createInquiry,
  parseFeatures,
  formatRentPrice,
  getStatusLabel,
  getFacility,
  isSectionAvailable,
} from "../data/sections";

const anthropic = new Anthropic();

// Twilio Media Streams メッセージ型
interface TwilioMediaMessage {
  event: "connected" | "start" | "media" | "stop" | "mark" | "dtmf";
  sequenceNumber?: string;
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
  };
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string;
  };
  stop?: {
    accountSid: string;
    callSid: string;
  };
  mark?: {
    name: string;
  };
  dtmf?: {
    track: string;
    digit: string;
  };
}

// ツール定義
const tools: Anthropic.Tool[] = [
  {
    name: "list_sections",
    description:
      "施設内の区画一覧を取得します。カテゴリ（物販・飲食・サービス・オフィス）でフィルタや、利用可能な区画のみ表示できます",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "カテゴリでフィルタ（物販、飲食、サービス、オフィス）。指定しない場合は全区画を返します",
        },
        active_only: {
          type: "boolean",
          description: "trueの場合、利用可能な区画のみを返します",
        },
      },
      required: [],
    },
  },
  {
    name: "get_section_info",
    description: "特定の区画の詳細情報を取得します",
    input_schema: {
      type: "object" as const,
      properties: {
        section_name: {
          type: "string",
          description: "区画の名前（例：1F-A、2F-B、3F-C）",
        },
      },
      required: ["section_name"],
    },
  },
  {
    name: "check_section_availability",
    description:
      "区画の指定期間の空き状況を確認します。日付を指定して予約可能かどうかを判定します",
    input_schema: {
      type: "object" as const,
      properties: {
        section_name: {
          type: "string",
          description: "区画の名前（例：1F-A）",
        },
        start_date: {
          type: "string",
          description: "利用開始日（YYYY-MM-DD形式）",
        },
        end_date: {
          type: "string",
          description: "利用終了日（YYYY-MM-DD形式、この日を含む）",
        },
        category: {
          type: "string",
          description:
            "section_nameを指定しない場合、カテゴリでフィルタして利用可能な区画を探します",
        },
      },
      required: [],
    },
  },
  {
    name: "create_inquiry",
    description:
      "区画についての問い合わせを記録します。お客様の名前、電話番号、問い合わせ内容を記録します",
    input_schema: {
      type: "object" as const,
      properties: {
        section_name: {
          type: "string",
          description: "問い合わせ対象の区画名",
        },
        caller_name: {
          type: "string",
          description: "お客様のお名前",
        },
        caller_phone: {
          type: "string",
          description: "お客様の電話番号",
        },
        inquiry_type: {
          type: "string",
          description: "問い合わせ種別（内見希望、賃料交渉、条件確認、その他）",
        },
        message: {
          type: "string",
          description: "問い合わせ内容の要約",
        },
      },
      required: [
        "section_name",
        "caller_name",
        "caller_phone",
        "inquiry_type",
        "message",
      ],
    },
  },
];

/**
 * ツール実行
 */
async function processToolCall(
  toolName: string,
  toolInput: Record<string, string | boolean>
): Promise<string> {
  switch (toolName) {
    case "list_sections": {
      let sections;
      if (toolInput.active_only) {
        sections = await getActiveSections();
      } else {
        sections = await getAllSections();
      }

      if (toolInput.category) {
        sections = sections.filter((s) => s.category === toolInput.category);
      }

      return JSON.stringify({
        sections: sections.map((s) => ({
          name: s.name,
          floor: `${s.floor}F`,
          area: `${s.area}㎡`,
          rent_daily: formatRentPrice(s.rentPrice),
          category: s.category,
          status: getStatusLabel(s.status),
          features: parseFeatures(s),
        })),
      });
    }

    case "get_section_info": {
      const section = await getSectionByName(toolInput.section_name as string);
      if (!section) {
        return JSON.stringify({
          error: `「${toolInput.section_name}」という区画は見つかりませんでした`,
        });
      }
      return JSON.stringify({
        name: section.name,
        floor: `${section.floor}F`,
        area: `${section.area}㎡`,
        rent_daily: formatRentPrice(section.rentPrice),
        category: section.category,
        status: getStatusLabel(section.status),
        features: parseFeatures(section),
      });
    }

    case "check_section_availability": {
      const startDateStr = toolInput.start_date as string | undefined;
      const endDateStr = toolInput.end_date as string | undefined;
      const sectionName = toolInput.section_name as string | undefined;

      if (sectionName && startDateStr && endDateStr) {
        const section = await getSectionByName(sectionName);
        if (!section) {
          return JSON.stringify({
            error: `「${sectionName}」という区画は見つかりませんでした`,
          });
        }
        if (section.status !== "active") {
          return JSON.stringify({
            section_name: section.name,
            available: false,
            reason: "この区画は現在利用停止中です",
          });
        }
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const available = await isSectionAvailable(
          section.id,
          startDate,
          endDate
        );
        return JSON.stringify({
          section_name: section.name,
          start_date: startDateStr,
          end_date: endDateStr,
          available,
          rent_daily: formatRentPrice(section.rentPrice),
        });
      }

      let sections = await getActiveSections();
      if (toolInput.category) {
        sections = sections.filter((s) => s.category === toolInput.category);
      }

      return JSON.stringify({
        total_active: sections.length,
        active_sections: sections.map((s) => ({
          name: s.name,
          floor: `${s.floor}F`,
          area: `${s.area}㎡`,
          rent_daily: formatRentPrice(s.rentPrice),
          category: s.category,
          features: parseFeatures(s),
        })),
      });
    }

    case "create_inquiry": {
      const section = await getSectionByName(toolInput.section_name as string);
      if (!section) {
        return JSON.stringify({
          error: `「${toolInput.section_name}」という区画は見つかりませんでした`,
        });
      }

      const inquiry = await createInquiry({
        sectionId: section.id,
        callerName: toolInput.caller_name as string,
        callerPhone: toolInput.caller_phone as string,
        inquiryType: toolInput.inquiry_type as string,
        message: toolInput.message as string,
      });

      return JSON.stringify({
        success: true,
        inquiry_id: inquiry.id,
        message:
          "問い合わせを受け付けました。担当者より折り返しご連絡いたします。",
      });
    }

    default:
      return JSON.stringify({ error: "不明なツール" });
  }
}

/**
 * Media Stream ハンドラー
 */
export async function handleMediaStream(ws: WebSocket): Promise<void> {
  let streamSid = "";
  let stt: DeepgramSTT | null = null;
  let fillerManager: FillerManager | null = null;
  let isProcessing = false;
  let markCounter = 0;

  /**
   * Twilioに音声を送信
   */
  const sendAudio = (audioChunk: Buffer) => {
    if (ws.readyState === ws.OPEN && streamSid) {
      ws.send(
        JSON.stringify({
          event: "media",
          streamSid,
          media: {
            payload: audioChunk.toString("base64"),
          },
        })
      );
    }
  };

  /**
   * マーク送信（音声再生完了追跡用）
   */
  const sendMark = (name: string) => {
    if (ws.readyState === ws.OPEN && streamSid) {
      ws.send(
        JSON.stringify({
          event: "mark",
          streamSid,
          mark: { name },
        })
      );
    }
  };

  /**
   * バッファをクリア（割り込み時）
   */
  const clearBuffer = () => {
    if (ws.readyState === ws.OPEN && streamSid) {
      ws.send(
        JSON.stringify({
          event: "clear",
          streamSid,
        })
      );
    }
  };

  /**
   * Claude でユーザーの発話を処理
   */
  const processUserSpeech = async (text: string) => {
    if (isProcessing || !text.trim()) return;

    isProcessing = true;
    console.log(`[Handler] Processing: "${text}"`);

    // フィラー開始
    fillerManager?.start("thinking");

    try {
      const session = sessionManager.get(streamSid);
      const facility = await getFacility();
      const facilityInfo = facility
        ? `施設名: ${facility.name}\n住所: ${facility.address}\n電話: ${facility.phone}\n営業時間: ${facility.hours}`
        : "";

      const systemPrompt = `あなたは商業施設「つくにんモール渋谷」のポップアップストア・催事スペース案内を行う電話オペレーターです。
短期利用（日単位レンタル）を検討しているお客様からの問い合わせに対して、利用可能なツールを使って情報を取得し、
簡潔で分かりやすい回答を日本語で行ってください。

${facilityInfo}

重要なルール:
- 回答は電話で読み上げられるため、簡潔にしてください（100文字以内を目安に）
- 料金は「1日あたり15,000円」のように日額で案内してください
- 面積は「45平米」のように読みやすい形式で
- 専門用語は避け、分かりやすい表現を使ってください
- 今日の日付は${new Date().toISOString().split("T")[0]}です`;

      // 会話履歴を取得
      const messages: Anthropic.MessageParam[] = session
        ? [...session.messages, { role: "user" as const, content: text }]
        : [{ role: "user" as const, content: text }];

      let response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: systemPrompt,
        tools,
        messages,
      });

      // ツール実行時はフィラーコンテキストを更新
      while (response.stop_reason === "tool_use") {
        fillerManager?.start("searching");

        const toolUseBlock = response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
        );

        if (!toolUseBlock) break;

        console.log(`[Handler] Tool call: ${toolUseBlock.name}`);
        const toolResult = await processToolCall(
          toolUseBlock.name,
          toolUseBlock.input as Record<string, string | boolean>
        );

        messages.push({
          role: "assistant",
          content: response.content,
        });

        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUseBlock.id,
              content: toolResult,
            },
          ],
        });

        response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          system: systemPrompt,
          tools,
          messages,
        });
      }

      // フィラー停止
      fillerManager?.stop();

      // 最終応答を取得
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );

      const responseText =
        textBlock?.text || "申し訳ございません。もう一度お願いできますか。";
      console.log(`[Handler] Response: "${responseText}"`);

      // 会話履歴を更新
      if (session) {
        sessionManager.addMessage(streamSid, "user", text);
        sessionManager.addMessage(streamSid, "assistant", responseText);
      }

      // 音声合成して送信
      const tts = getTTSClient();
      await tts.synthesizeStream(responseText, sendAudio);

      // 再生完了マーク
      markCounter++;
      sendMark(`response-${markCounter}`);
    } catch (error) {
      console.error("[Handler] Error processing speech:", error);
      fillerManager?.stop();

      // エラー時の応答
      const tts = getTTSClient();
      await tts.synthesizeStream(
        "申し訳ございません。もう一度お話しいただけますか。",
        sendAudio
      );
    } finally {
      isProcessing = false;
    }
  };

  // WebSocketメッセージ処理
  ws.on("message", async (data) => {
    try {
      const message: TwilioMediaMessage = JSON.parse(data.toString());

      switch (message.event) {
        case "connected":
          console.log("[Handler] WebSocket connected");
          break;

        case "start":
          if (message.start) {
            streamSid = message.start.streamSid;
            console.log(`[Handler] Stream started: ${streamSid}`);

            // セッション作成
            sessionManager.create(
              streamSid,
              message.start.callSid,
              message.start.accountSid
            );

            // フィラーマネージャー初期化
            fillerManager = new FillerManager({
              onAudio: sendAudio,
              initialDelayMs: 2000,
              repeatIntervalMs: 4000,
            });

            // STT初期化
            stt = new DeepgramSTT();
            await stt.connect({
              onTranscript: (result) => {
                if (result.isFinal && result.text.trim()) {
                  console.log(`[STT] Final: "${result.text}"`);
                  // 処理中なら割り込み
                  if (isProcessing) {
                    clearBuffer();
                    fillerManager?.stop();
                  }
                  processUserSpeech(result.text);
                } else if (result.text.trim()) {
                  console.log(`[STT] Interim: "${result.text}"`);
                }
              },
              onError: (error) => {
                console.error("[STT] Error:", error);
              },
              onClose: () => {
                console.log("[STT] Connection closed");
              },
            });

            // 挨拶を送信
            const tts = getTTSClient();
            await tts.synthesizeStream(
              "つくにんモール渋谷テナント案内です。ご用件をお話しください。",
              sendAudio
            );
          }
          break;

        case "media":
          if (message.media && stt) {
            const audioBuffer = Buffer.from(message.media.payload, "base64");
            stt.send(audioBuffer);
          }
          break;

        case "mark":
          console.log(`[Handler] Mark received: ${message.mark?.name}`);
          break;

        case "dtmf":
          console.log(`[Handler] DTMF: ${message.dtmf?.digit}`);
          break;

        case "stop":
          console.log("[Handler] Stream stopped");
          break;
      }
    } catch (error) {
      console.error("[Handler] Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("[Handler] WebSocket closed");
    stt?.close();
    fillerManager?.reset();
    if (streamSid) {
      sessionManager.delete(streamSid);
    }
  });

  ws.on("error", (error) => {
    console.error("[Handler] WebSocket error:", error);
  });
}
