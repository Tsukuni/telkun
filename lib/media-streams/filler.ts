/**
 * フィラー発言管理
 * 応答遅延時に自然なフィラー（「確認しています」など）を挿入
 */

import { getTTSClient } from "../tts/elevenlabs";

export type FillerContext = "thinking" | "searching" | "processing" | "waiting";

const FILLERS: Record<FillerContext, string[]> = {
  thinking: ["かしこまりました", "そうですね", "ありがとうございます"],
  searching: ["お調べしています", "確認しています", "ただいま検索中です"],
  processing: ["処理しています", "準備しています"],
  waiting: [
    "もう少々お待ちください",
    "申し訳ございません、お待たせしています",
  ],
};

export interface FillerManagerOptions {
  onAudio: (chunk: Buffer) => void;
  initialDelayMs?: number;
  repeatIntervalMs?: number;
}

/**
 * フィラー発言管理クラス
 */
export class FillerManager {
  private options: FillerManagerOptions;
  private initialDelayMs: number;
  private repeatIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private isPlaying = false;
  private usedFillers: Set<string> = new Set();
  private currentContext: FillerContext = "thinking";

  constructor(options: FillerManagerOptions) {
    this.options = options;
    this.initialDelayMs = options.initialDelayMs ?? 2000;
    this.repeatIntervalMs = options.repeatIntervalMs ?? 4000;
  }

  /**
   * フィラー再生をスケジュール
   */
  start(context: FillerContext = "thinking"): void {
    this.currentContext = context;
    this.stop(); // 既存のタイマーをクリア

    this.timer = setTimeout(async () => {
      await this.playFiller();
      this.scheduleRepeat();
    }, this.initialDelayMs);
  }

  /**
   * 繰り返しフィラーをスケジュール
   */
  private scheduleRepeat(): void {
    if (this.isPlaying) return;

    this.timer = setTimeout(async () => {
      this.currentContext = "waiting";
      await this.playFiller();
      this.scheduleRepeat();
    }, this.repeatIntervalMs);
  }

  /**
   * フィラーを再生
   */
  private async playFiller(): Promise<void> {
    if (this.isPlaying) return;

    const filler = this.selectFiller(this.currentContext);
    if (!filler) return;

    this.isPlaying = true;
    console.log(`[Filler] Playing: "${filler}"`);

    try {
      const tts = getTTSClient();
      await tts.synthesizeStream(filler, this.options.onAudio);
    } catch (error) {
      console.error("[Filler] TTS error:", error);
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * コンテキストに応じたフィラーを選択
   */
  private selectFiller(context: FillerContext): string | null {
    const candidates = FILLERS[context];
    const available = candidates.filter((f) => !this.usedFillers.has(f));

    if (available.length === 0) {
      // すべて使用済みならリセット
      this.usedFillers.clear();
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    this.usedFillers.add(selected);
    return selected;
  }

  /**
   * フィラー再生を停止
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isPlaying = false;
  }

  /**
   * 即座にフィラーを再生（待機なし）
   */
  async playImmediate(context: FillerContext = "thinking"): Promise<void> {
    this.currentContext = context;
    await this.playFiller();
  }

  /**
   * リセット
   */
  reset(): void {
    this.stop();
    this.usedFillers.clear();
    this.currentContext = "thinking";
  }
}
