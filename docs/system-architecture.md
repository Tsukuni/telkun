# Telkun システム構成

## 概要

Telkunは、商業施設「つくにんモール渋谷」のテナント区画について、電話で問い合わせできるAI音声案内システムです。

お客様が電話をかけると、AIオペレーターが音声で応答し、空き区画の案内・条件確認・問い合わせ受付を自動で行います。

---

## 通話の流れ

```
お客様の電話機                    Twilio                         自社サーバー
     │                            │                                │
     │  ① 電話をかける            │                                │
     │ ─────────────────────────> │                                │
     │                            │  ② Webhook (POST /api/twilio/stream)
     │                            │ ─────────────────────────────> │
     │                            │                                │
     │                            │  ③ TwiML応答 (<Connect><Stream>)
     │                            │ <───────────────────────────── │
     │                            │                                │
     │                            │  ④ WebSocket接続 (/api/media-stream)
     │                            │ <=============================> │
     │                            │    双方向リアルタイム音声       │
     │                            │                                │
     │  ⑤ 「空いてる区画は？」     │                                │
     │ ─────────────────────────> │  ⑥ 音声データ（μ-law）         │
     │                            │ ==============================> │
     │                            │                         ┌──────┴──────┐
     │                            │                         │  Deepgram   │
     │                            │                         │  (STT)      │
     │                            │                         │  音声→テキスト│
     │                            │                         └──────┬──────┘
     │                            │                         ┌──────┴──────┐
     │                            │                         │  Claude AI  │
     │                            │                         │  テキスト処理 │
     │                            │                         │  + DB検索    │
     │                            │                         └──────┬──────┘
     │                            │                         ┌──────┴──────┐
     │                            │                         │ ElevenLabs  │
     │                            │                         │  (TTS)      │
     │                            │                         │ テキスト→音声│
     │                            │                         └──────┬──────┘
     │                            │  ⑦ 音声データ（μ-law）         │
     │                            │ <============================== │
     │  ⑧ 「1階のA区画が...」     │                                │
     │ <───────────────────────── │                                │
```

---

## 各サービスの役割

### Twilio — 電話回線

**役割**: 電話網とインターネットの橋渡し

Twilioは「電話番号を持ったクラウド電話交換機」です。お客様が電話をかけると、Twilioがその電話を受け取り、設定されたWebhook URLにHTTPリクエストを送ります。

このシステムでは **Media Streams** 機能を使っています。通常のTwilio通話では「音声をテキストに変換してHTTPで送る」のですが、Media Streamsは**生の音声データをリアルタイムにWebSocketで双方向転送**します。これにより、自前のSTT/TTSサービスを使った低遅延の対話が実現できます。

```
お客様の声 → [電話回線] → Twilio → [WebSocket] → サーバー
                                                      ↓
お客様の耳 ← [電話回線] ← Twilio ← [WebSocket] ← サーバー
```

**このプロジェクトでの使い方**:
- 日本の電話番号を提供（+81...）
- 着信を受けてWebhookでサーバーに通知
- WebSocketで音声データを双方向転送（μ-law 8kHz形式）

**関連コード**:
- `app/api/twilio/stream/route.ts` — 着信時にTwiMLを返す
- `server.ts` — WebSocketサーバー（`/api/media-stream`）

---

### Deepgram — 音声認識（STT: Speech-to-Text）

**役割**: お客様の声をテキストに変換

Deepgramは「耳」の役割です。電話越しに届くお客様の音声データ（波形）を受け取り、日本語のテキストに変換します。

```
「空いてる区画はありますか」（音声波形） → Deepgram → "空いてる区画はありますか"（テキスト）
```

**なぜ必要か**: Claude AIはテキストしか処理できません。お客様の声をClaude AIに渡すには、まず音声をテキストに変換する必要があります。

**このプロジェクトでの動作**:
1. Twilioから届くμ-law 8kHz音声データをDeepgramのWebSocket APIにリアルタイム送信
2. Deepgramが音声を認識し、途中経過（interim）と確定結果（final）を返す
3. 確定テキストをClaude AIに渡す

**使用モデル**: Nova-2（日本語対応、リアルタイムストリーミング）

**特徴的な設定**:
- `utterance_end_ms: 1000` — 1秒の沈黙で発話終了と判定
- `vad_events: true` — 音声区間検出（話し始め/終わりを検知）
- `interim_results: true` — 認識途中の結果も取得（応答性向上）

**関連コード**:
- `lib/stt/deepgram.ts` — Deepgramクライアント

---

### ElevenLabs — 音声合成（TTS: Text-to-Speech）

**役割**: AIの回答テキストを音声に変換

ElevenLabsは「口」の役割です。Claude AIが生成したテキスト応答を、自然な日本語音声に変換します。

```
"1階のA区画が空いています"（テキスト） → ElevenLabs → 「1階のA区画が空いています」（音声波形）
```

**なぜ必要か**: 電話のお客様にテキストを見せることはできません。AIの回答を音声に変換して電話越しに再生する必要があります。

**このプロジェクトでの動作**:
1. Claude AIの応答テキストをElevenLabs APIに送信
2. PCM 24kHz音声データをストリーミングで受信
3. Twilio向けにμ-law 8kHzに変換（リサンプリング + エンコード）
4. WebSocket経由でTwilioに送信 → お客様の電話に音声が流れる

**使用モデル**: `eleven_flash_v2_5`（低遅延モデル）

**音声変換の流れ**:
```
ElevenLabs出力          変換処理               Twilio送信
PCM 24kHz 16bit  →  リサンプリング(8kHz)  →  μ-law 8kHz 8bit
(高音質)             →  μ-lawエンコード        (電話音声規格)
```

**関連コード**:
- `lib/tts/elevenlabs.ts` — ElevenLabsクライアント
- `lib/audio/mulaw.ts` — μ-law変換（PCM→Twilio形式）

---

### Claude AI（Anthropic） — 対話エンジン

**役割**: 質問を理解し、適切な回答を生成

Claude AIは「頭脳」の役割です。テキスト化されたお客様の質問を理解し、必要に応じてデータベースを検索し、自然な日本語で回答を生成します。

**使用モデル**: Claude Sonnet 4.5

**使えるツール（4つ）**:

| ツール | 機能 | 例 |
|--------|------|-----|
| `list_sections` | 区画一覧を取得 | 「飲食の区画を教えて」 |
| `get_section_info` | 区画の詳細情報 | 「1F-Aの賃料は？」 |
| `check_section_availability` | 空き状況の確認 | 「3月に空いてる区画は？」 |
| `create_inquiry` | 問い合わせ記録 | 「内見を申し込みたい」 |

**対話の流れ**:
```
ユーザー: 「来月空いてる飲食の区画はありますか」
    ↓
Claude: (ツール呼び出し) check_section_availability(category="飲食", start_date=..., end_date=...)
    ↓
DB検索結果: [{name: "1F-C", rent: 20000, ...}, ...]
    ↓
Claude: 「来月は1階のC区画が空いています。1日あたり2万円で、45平米の飲食向けスペースです。」
```

**関連コード**:
- `lib/media-streams/handler.ts` — ストリーミング通話でのAI処理
- `lib/ai.ts` — 非ストリーミング版AI処理

---

### フィラー音声（つなぎ言葉）

AI処理には数秒かかるため、無音が続くと電話が切れたように感じます。そこで処理中に「確認しています」「お調べしています」などのフィラー音声を自動挿入します。

```
ユーザー発話 → 2秒後「かしこまりました」→ 4秒後「お調べしています」→ AI応答
```

フィラーもElevenLabsで音声合成されます。

**関連コード**: `lib/media-streams/filler.ts`

---

## コンポーネント一覧

```
telkun/
├── server.ts                          # Express + WebSocketサーバー
├── app/
│   └── api/twilio/
│       ├── stream/route.ts            # 着信 → Media Stream TwiML返却
│       ├── voice/route.ts             # 着信 → 従来型TwiML返却（未使用）
│       └── transcribe/route.ts        # 従来型音声認識結果処理（未使用）
├── lib/
│   ├── ai.ts                          # Claude AI（非ストリーミング版）
│   ├── twilio.ts                      # TwiMLヘルパー + 署名検証
│   ├── data/sections.ts               # DB操作（Prisma）
│   ├── stt/
│   │   └── deepgram.ts                # 音声認識（STT）
│   ├── tts/
│   │   └── elevenlabs.ts              # 音声合成（TTS）
│   ├── audio/
│   │   └── mulaw.ts                   # μ-law音声フォーマット変換
│   └── media-streams/
│       ├── handler.ts                 # WebSocketメッセージ処理（メイン）
│       ├── session.ts                 # 通話セッション管理
│       └── filler.ts                  # フィラー音声管理
```

---

## 環境変数

| 変数名 | サービス | 用途 |
|--------|---------|------|
| `TWILIO_ACCOUNT_SID` | Twilio | アカウント識別子 |
| `TWILIO_AUTH_TOKEN` | Twilio | API認証 + Webhook署名検証 |
| `TWILIO_PHONE_NUMBER` | Twilio | 購入した電話番号 |
| `ANTHROPIC_API_KEY` | Anthropic | Claude API認証 |
| `DEEPGRAM_API_KEY` | Deepgram | 音声認識API認証 |
| `ELEVENLABS_API_KEY` | ElevenLabs | 音声合成API認証 |
| `ELEVENLABS_VOICE_ID` | ElevenLabs | 使用する音声（省略可） |

---

## 2つの通話モード

このシステムには2つのモードがあります。**現在はストリーミングモードを使用**しています。

### ストリーミングモード（推奨・現在使用中）

```
Twilio → WebSocket → Deepgram(STT) → Claude → ElevenLabs(TTS) → WebSocket → Twilio
```

- 低遅延のリアルタイム対話
- 割り込み（バージイン）対応
- フィラー音声あり
- エンドポイント: `/api/twilio/stream` → `/api/media-stream`(WS)

### 従来モード（バックアップ）

```
Twilio(内蔵STT) → HTTP POST → Claude → Twilio(内蔵TTS) → HTTP応答
```

- Twilio内蔵のSTT/TTSを使用
- 外部APIキー不要（Deepgram/ElevenLabs不要）
- 遅延が大きい、音声品質が低い
- エンドポイント: `/api/twilio/voice` → `/api/twilio/transcribe`
