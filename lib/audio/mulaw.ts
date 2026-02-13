/**
 * μ-law (G.711) 音声変換ユーティリティ
 * Twilio Media Streams は μ-law 8kHz 8bit を使用
 */

// μ-law エンコード用テーブル
const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;
const MULAW_ENCODE_TABLE = [
  0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
];

// μ-law デコード用テーブル
const MULAW_DECODE_TABLE = [
  -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956, -23932,
  -22908, -21884, -20860, -19836, -18812, -17788, -16764, -15996, -15484,
  -14972, -14460, -13948, -13436, -12924, -12412, -11900, -11388, -10876,
  -10364, -9852, -9340, -8828, -8316, -7932, -7676, -7420, -7164, -6908, -6652,
  -6396, -6140, -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092, -3900,
  -3772, -3644, -3516, -3388, -3260, -3132, -3004, -2876, -2748, -2620, -2492,
  -2364, -2236, -2108, -1980, -1884, -1820, -1756, -1692, -1628, -1564, -1500,
  -1436, -1372, -1308, -1244, -1180, -1116, -1052, -988, -924, -876, -844, -812,
  -780, -748, -716, -684, -652, -620, -588, -556, -524, -492, -460, -428, -396,
  -372, -356, -340, -324, -308, -292, -276, -260, -244, -228, -212, -196, -180,
  -164, -148, -132, -120, -112, -104, -96, -88, -80, -72, -64, -56, -48, -40,
  -32, -24, -16, -8, 0, 32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
  23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764, 15996, 15484, 14972,
  14460, 13948, 13436, 12924, 12412, 11900, 11388, 10876, 10364, 9852, 9340,
  8828, 8316, 7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140, 5884, 5628, 5372,
  5116, 4860, 4604, 4348, 4092, 3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
  2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980, 1884, 1820, 1756, 1692, 1628,
  1564, 1500, 1436, 1372, 1308, 1244, 1180, 1116, 1052, 988, 924, 876, 844, 812,
  780, 748, 716, 684, 652, 620, 588, 556, 524, 492, 460, 428, 396, 372, 356,
  340, 324, 308, 292, 276, 260, 244, 228, 212, 196, 180, 164, 148, 132, 120,
  112, 104, 96, 88, 80, 72, 64, 56, 48, 40, 32, 24, 16, 8, 0,
];

/**
 * PCM 16bit サンプルを μ-law にエンコード
 */
function encodeSample(sample: number): number {
  const sign = (sample >> 8) & 0x80;
  if (sign !== 0) {
    sample = -sample;
  }
  if (sample > MULAW_CLIP) {
    sample = MULAW_CLIP;
  }
  sample = sample + MULAW_BIAS;
  const exponent = MULAW_ENCODE_TABLE[(sample >> 7) & 0xff];
  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

/**
 * μ-law サンプルを PCM 16bit にデコード
 */
function decodeSample(mulaw: number): number {
  return MULAW_DECODE_TABLE[mulaw];
}

/**
 * PCM 16bit バッファを μ-law バッファに変換
 * @param pcmBuffer - PCM 16bit signed little-endian
 * @returns μ-law encoded buffer
 */
export function pcmToMulaw(pcmBuffer: Buffer): Buffer {
  const numSamples = pcmBuffer.length / 2;
  const mulawBuffer = Buffer.alloc(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    mulawBuffer[i] = encodeSample(sample);
  }

  return mulawBuffer;
}

/**
 * μ-law バッファを PCM 16bit バッファに変換
 * @param mulawBuffer - μ-law encoded buffer
 * @returns PCM 16bit signed little-endian
 */
export function mulawToPcm(mulawBuffer: Buffer): Buffer {
  const pcmBuffer = Buffer.alloc(mulawBuffer.length * 2);

  for (let i = 0; i < mulawBuffer.length; i++) {
    const sample = decodeSample(mulawBuffer[i]);
    pcmBuffer.writeInt16LE(sample, i * 2);
  }

  return pcmBuffer;
}

/**
 * サンプルレート変換（リサンプリング）
 * 線形補間による簡易実装
 */
export function resample(
  pcmBuffer: Buffer,
  fromRate: number,
  toRate: number
): Buffer {
  if (fromRate === toRate) {
    return pcmBuffer;
  }

  const ratio = fromRate / toRate;
  const inputSamples = pcmBuffer.length / 2;
  const outputSamples = Math.floor(inputSamples / ratio);
  const outputBuffer = Buffer.alloc(outputSamples * 2);

  for (let i = 0; i < outputSamples; i++) {
    const srcIndex = i * ratio;
    const srcIndexInt = Math.floor(srcIndex);
    const frac = srcIndex - srcIndexInt;

    const sample1 = pcmBuffer.readInt16LE(
      Math.min(srcIndexInt * 2, pcmBuffer.length - 2)
    );
    const sample2 = pcmBuffer.readInt16LE(
      Math.min((srcIndexInt + 1) * 2, pcmBuffer.length - 2)
    );

    const interpolated = Math.round(sample1 * (1 - frac) + sample2 * frac);
    outputBuffer.writeInt16LE(interpolated, i * 2);
  }

  return outputBuffer;
}

/**
 * 高サンプルレートのPCMをTwilio用μ-law 8kHzに変換
 */
export function convertToTwilioFormat(
  pcmBuffer: Buffer,
  sampleRate: number = 24000
): Buffer {
  // 8kHzにリサンプリング
  const resampled = resample(pcmBuffer, sampleRate, 8000);
  // μ-lawにエンコード
  return pcmToMulaw(resampled);
}
