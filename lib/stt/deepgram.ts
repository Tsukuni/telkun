/**
 * Deepgram リアルタイム音声認識（STT）統合
 */

import {
  createClient,
  LiveTranscriptionEvents,
  type LiveClient,
} from "@deepgram/sdk";

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export interface DeepgramStreamOptions {
  onTranscript: (result: TranscriptResult) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * Deepgram リアルタイムSTTクライアント
 */
export class DeepgramSTT {
  private client: ReturnType<typeof createClient>;
  private connection: LiveClient | null = null;
  private isConnected = false;

  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY is not set");
    }
    this.client = createClient(apiKey);
  }

  /**
   * リアルタイムストリーム接続を開始
   */
  async connect(options: DeepgramStreamOptions): Promise<void> {
    try {
      this.connection = this.client.listen.live({
        model: "nova-2",
        language: "ja",
        encoding: "mulaw",
        sample_rate: 8000,
        channels: 1,
        interim_results: true,
        utterance_end_ms: 1000,
        vad_events: true,
        smart_format: true,
      });

      this.connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("[Deepgram] Connection opened");
        this.isConnected = true;
      });

      this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0];
        if (transcript && transcript.transcript) {
          options.onTranscript({
            text: transcript.transcript,
            isFinal: data.is_final || false,
            confidence: transcript.confidence || 0,
          });
        }
      });

      this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        console.log("[Deepgram] Utterance end detected");
      });

      this.connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error("[Deepgram] Error:", error);
        options.onError?.(error instanceof Error ? error : new Error(String(error)));
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("[Deepgram] Connection closed");
        this.isConnected = false;
        options.onClose?.();
      });

      // 接続完了を待機
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Deepgram connection timeout"));
        }, 10000);

        const checkConnection = () => {
          if (this.isConnected) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    } catch (error) {
      console.error("[Deepgram] Failed to connect:", error);
      throw error;
    }
  }

  /**
   * 音声データを送信
   * @param audioData μ-law encoded audio buffer
   */
  send(audioData: Buffer): void {
    if (this.connection && this.isConnected) {
      // BufferをArrayBufferに変換して送信
      const arrayBuffer = audioData.buffer.slice(
        audioData.byteOffset,
        audioData.byteOffset + audioData.byteLength
      );
      this.connection.send(arrayBuffer);
    }
  }

  /**
   * 接続を終了
   */
  close(): void {
    if (this.connection) {
      this.connection.requestClose();
      this.connection = null;
      this.isConnected = false;
    }
  }

  /**
   * 接続状態を取得
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
