import { createHmac, timingSafeEqual } from "node:crypto";

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = toBuffer(a);
  const bBuf = toBuffer(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function normalizePayload(payload: string | Buffer): string {
  return typeof payload === "string" ? payload : payload.toString("utf8");
}

export function verifyMetaWebhookSignature(params: {
  payload: string | Buffer;
  signatureHeader?: string;
  appSecret: string;
}): boolean {
  if (!params.signatureHeader || !params.appSecret) {
    return false;
  }
  const payload = normalizePayload(params.payload);
  const digest = createHmac("sha256", params.appSecret)
    .update(payload)
    .digest("hex");
  const expected = `sha256=${digest}`;
  return safeCompare(expected, params.signatureHeader.trim());
}

export function verifyXWebhookSignature(params: {
  payload: string | Buffer;
  signatureHeader?: string;
  consumerSecret: string;
}): boolean {
  if (!params.signatureHeader || !params.consumerSecret) {
    return false;
  }
  const payload = normalizePayload(params.payload);
  const digest = createHmac("sha256", params.consumerSecret)
    .update(payload)
    .digest("base64");
  const header = params.signatureHeader.trim().replace(/^sha256=/i, "");
  return safeCompare(digest, header);
}
