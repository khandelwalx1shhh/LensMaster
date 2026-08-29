/**
 * Paytm checksum utilities (server-only).
 *
 * Implements Paytm's documented signature scheme:
 *   hash      = sha256(payload + "|" + salt) + salt
 *   signature = base64(aes-128-cbc(hash, merchantKey, iv="@@@@&&&&####$$$$"))
 *
 * Never import this from client code — it reads the merchant key.
 */
import crypto from "node:crypto";

const IV = "@@@@&&&&####$$$$";

export type PaytmEnv = "staging" | "production";

export interface PaytmConfig {
  mid: string;
  key: string;
  website: string;
  industryType: string;
  channelId: string;
  env: PaytmEnv;
  host: string;
}

/** Reads Paytm config from env. MUST be called inside a request handler. */
export function getPaytmConfig(): PaytmConfig {
  const mid = process.env.PAYTM_MID;
  const key = process.env.PAYTM_MERCHANT_KEY;
  if (!mid || !key) throw new Error("PAYTM_NOT_CONFIGURED");

  const env: PaytmEnv = process.env.PAYTM_ENV === "production" ? "production" : "staging";
  return {
    mid,
    key,
    website: process.env.PAYTM_WEBSITE || (env === "production" ? "DEFAULT" : "WEBSTAGING"),
    industryType: process.env.PAYTM_INDUSTRY_TYPE || "Retail",
    channelId: process.env.PAYTM_CHANNEL_ID || "WEB",
    env,
    host: env === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in",
  };
}

function encrypt(input: string, key: string): string {
  const cipher = crypto.createCipheriv("aes-128-cbc", key, IV);
  return Buffer.concat([cipher.update(input, "binary"), cipher.final()]).toString("base64");
}

function decrypt(input: string, key: string): string {
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, IV);
  return Buffer.concat([decipher.update(input, "base64"), decipher.final()]).toString("binary");
}

function hashWithSalt(payload: string, salt: string): string {
  return crypto.createHash("sha256").update(payload + "|" + salt).digest("hex") + salt;
}

/** Deterministic "|"-joined string of a flat param map, keys sorted. */
export function paramsToString(params: Record<string, unknown>): string {
  return Object.keys(params)
    .filter((k) => k !== "CHECKSUMHASH")
    .sort()
    .map((k) => {
      const v = params[k];
      return v === null || v === undefined || v === "null" ? "" : String(v);
    })
    .join("|");
}

export function generateSignature(payload: string, key: string): string {
  const salt = crypto.randomBytes(4).toString("hex").slice(0, 4);
  return encrypt(hashWithSalt(payload, salt), key);
}

export function verifySignature(payload: string, key: string, signature: string): boolean {
  try {
    const decrypted = decrypt(signature, key);
    const salt = decrypted.slice(-4);
    const expected = hashWithSalt(payload, salt);
    const a = Buffer.from(decrypted);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
