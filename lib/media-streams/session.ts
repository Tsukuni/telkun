/**
 * 通話セッション管理
 * 会話履歴とコンテキストを保持
 */

import type Anthropic from "@anthropic-ai/sdk";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SessionState {
  streamSid: string;
  callSid: string;
  accountSid: string;
  startTime: Date;
  messages: Anthropic.MessageParam[];
  isProcessing: boolean;
  lastActivity: Date;
}

/**
 * セッションマネージャー
 */
class SessionManager {
  private sessions: Map<string, SessionState> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxSessionAge = 30 * 60 * 1000; // 30分

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * 新しいセッションを作成
   */
  create(streamSid: string, callSid: string, accountSid: string): SessionState {
    const session: SessionState = {
      streamSid,
      callSid,
      accountSid,
      startTime: new Date(),
      messages: [],
      isProcessing: false,
      lastActivity: new Date(),
    };

    this.sessions.set(streamSid, session);
    console.log(`[Session] Created: ${streamSid}`);
    return session;
  }

  /**
   * セッションを取得
   */
  get(streamSid: string): SessionState | undefined {
    return this.sessions.get(streamSid);
  }

  /**
   * セッションを更新
   */
  update(streamSid: string, updates: Partial<SessionState>): void {
    const session = this.sessions.get(streamSid);
    if (session) {
      Object.assign(session, updates, { lastActivity: new Date() });
    }
  }

  /**
   * メッセージを追加
   */
  addMessage(
    streamSid: string,
    role: "user" | "assistant",
    content: string
  ): void {
    const session = this.sessions.get(streamSid);
    if (session) {
      session.messages.push({ role, content });
      session.lastActivity = new Date();
    }
  }

  /**
   * 会話履歴を取得
   */
  getMessages(streamSid: string): Anthropic.MessageParam[] {
    return this.sessions.get(streamSid)?.messages || [];
  }

  /**
   * セッションを削除
   */
  delete(streamSid: string): void {
    this.sessions.delete(streamSid);
    console.log(`[Session] Deleted: ${streamSid}`);
  }

  /**
   * 古いセッションをクリーンアップ
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [streamSid, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > this.maxSessionAge) {
        this.delete(streamSid);
      }
    }
  }

  /**
   * クリーンアップタイマーを開始
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5分ごと
  }

  /**
   * シャットダウン
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

// シングルトンインスタンス
export const sessionManager = new SessionManager();
