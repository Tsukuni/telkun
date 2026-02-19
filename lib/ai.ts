import Anthropic from "@anthropic-ai/sdk";
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
} from "./data/sections";

const anthropic = new Anthropic();

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
          description:
            "問い合わせ種別（内見希望、賃料交渉、条件確認、その他）",
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
        sections = sections.filter(
          (s) => s.category === toolInput.category
        );
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

      // 特定の区画 + 日付指定の場合
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

      // カテゴリ指定で利用可能な区画を探す
      let sections = await getActiveSections();
      if (toolInput.category) {
        sections = sections.filter(
          (s) => s.category === toolInput.category
        );
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

async function buildSystemPrompt(): Promise<string> {
  const facility = await getFacility();
  const facilityInfo = facility
    ? `施設名: ${facility.name}\n住所: ${facility.address}\n電話: ${facility.phone}\n営業時間: ${facility.hours}`
    : "";

  return `あなたは商業施設「つくにんモール渋谷」のポップアップストア・催事スペース案内を行う電話オペレーターです。
短期利用（日単位レンタル）を検討しているお客様からの問い合わせに対して、利用可能なツールを使って情報を取得し、
簡潔で分かりやすい回答を日本語で行ってください。

${facilityInfo}

重要なルール:
- 回答は電話で読み上げられるため、簡潔にしてください
- 料金は「1日あたり15,000円」のように日額で案内してください
- 面積は「45平米」のように読みやすい形式で
- 専門用語は避け、分かりやすい表現を使ってください
- お客様が興味を持った区画について、お名前と電話番号を確認し問い合わせを記録してください
- 情報が不足している場合は、確認のための質問をしてください
- 区画のステータスは「利用可能」「利用停止中」の2種類です
- 空き日程の確認には、利用希望日を確認してからcheck_section_availabilityツールを使ってください
- 今日の日付は${new Date().toISOString().split("T")[0]}です`;
}

/**
 * ツール呼び出しを含むメッセージループを実行し、最終テキスト応答を返す
 */
async function runAgentLoop(
  systemPrompt: string,
  messages: Anthropic.MessageParam[]
): Promise<{ text: string; messages: Anthropic.MessageParam[] }> {
  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUseBlock) break;

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
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  // 最終応答をメッセージ履歴に追加
  messages.push({
    role: "assistant",
    content: response.content,
  });

  return {
    text: textBlock?.text || "申し訳ございません。回答を生成できませんでした。",
    messages,
  };
}

/**
 * 単発クエリ処理（電話用・後方互換）
 */
export async function processUserQuery(userMessage: string): Promise<string> {
  const systemPrompt = await buildSystemPrompt();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];
  const result = await runAgentLoop(systemPrompt, messages);
  return result.text;
}

/**
 * 会話履歴付きチャット処理
 * クライアントから受け取った履歴を継続して対話する
 */
export async function processChatMessage(
  userMessage: string,
  history: Anthropic.MessageParam[]
): Promise<{ text: string; messages: Anthropic.MessageParam[] }> {
  const systemPrompt = await buildSystemPrompt();
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ];
  return runAgentLoop(systemPrompt, messages);
}
