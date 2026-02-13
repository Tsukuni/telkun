/**
 * ElevenLabs リアルタイム音声合成（TTS）統合
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { convertToTwilioFormat } from "../audio/mulaw";

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
}

/**
 * ElevenLabs TTS クライアント
 */
export class ElevenLabsTTS {
  private client: ElevenLabsClient;
  private voiceId: string;
  private modelId: string;

  constructor(options?: TTSOptions) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }

    this.client = new ElevenLabsClient({ apiKey });
    this.voiceId =
      options?.voiceId ||
      process.env.ELEVENLABS_VOICE_ID ||
      "21m00Tcm4TlvDq8ikWAM"; // デフォルト: Rachel
    this.modelId = options?.modelId || "eleven_flash_v2_5";
  }

  /**
   * テキストを音声に変換（ストリーミング）
   * @param text 変換するテキスト
   * @param onAudio 音声チャンク受信時のコールバック（μ-law形式）
   */
  async synthesizeStream(
    text: string,
    onAudio: (chunk: Buffer) => void
  ): Promise<void> {
    try {
      const stream = await this.client.textToSpeech.stream(this.voiceId, {
        text,
        modelId: this.modelId,
        outputFormat: "pcm_24000",
      });

      // PCMデータを収集
      const chunks: Uint8Array[] = [];
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
        }
      }

      // 全データを結合してμ-lawに変換
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const fullPcm = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        fullPcm.set(chunk, offset);
        offset += chunk.length;
      }

      const mulawAudio = convertToTwilioFormat(Buffer.from(fullPcm), 24000);

      // チャンク単位で送信（約20ms分のデータ = 160バイト @ 8kHz）
      const chunkSize = 160;
      for (let i = 0; i < mulawAudio.length; i += chunkSize) {
        const chunk = mulawAudio.subarray(
          i,
          Math.min(i + chunkSize, mulawAudio.length)
        );
        onAudio(chunk);
      }
    } catch (error) {
      console.error("[ElevenLabs] TTS error:", error);
      throw error;
    }
  }

  /**
   * テキストを音声に変換（一括）
   * @param text 変換するテキスト
   * @returns μ-law形式の音声バッファ
   */
  async synthesize(text: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    await this.synthesizeStream(text, (chunk) => {
      chunks.push(chunk);
    });
    return Buffer.concat(chunks);
  }

  /**
   * 利用可能な音声一覧を取得
   */
  async listVoices() {
    const response = await this.client.voices.getAll();
    return response.voices?.map((v) => ({
      id: v.voiceId,
      name: v.name,
      category: v.category,
    }));
  }
}

/**
 * シングルトンインスタンス
 */
let ttsInstance: ElevenLabsTTS | null = null;

export function getTTSClient(): ElevenLabsTTS {
  if (!ttsInstance) {
    ttsInstance = new ElevenLabsTTS();
  }
  return ttsInstance;
}
