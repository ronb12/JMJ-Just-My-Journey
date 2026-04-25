import { getSql } from "./db";
import { decryptSecret } from "./encryption";

type StripeConfig = { publishableKey: string; secretKey: string };

let cached: StripeConfig | null = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

export function clearStripeConfigCache() {
  cached = null;
  cachedAt = 0;
}

export async function getStripeConfig(): Promise<StripeConfig> {
  const fromEnv: StripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
  };
  if (!fromEnv.secretKey) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY)");
  }
  if (!fromEnv.publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }
  if (!process.env.DATABASE_URL) {
    return fromEnv;
  }
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) {
    return cached;
  }
  const sql = getSql();
  const row = (await sql`
    SELECT use_custom_keys, publishable_key, encrypted_secret_key
    FROM stripe_settings
    LIMIT 1
  `) as { use_custom_keys: boolean; publishable_key: string | null; encrypted_secret_key: string | null }[];
  const s = row[0];
  if (s?.use_custom_keys && s?.encrypted_secret_key && s?.publishable_key) {
    const secretKey = decryptSecret(s.encrypted_secret_key);
    cached = { publishableKey: s.publishable_key, secretKey };
  } else {
    cached = fromEnv;
  }
  cachedAt = now;
  return cached;
}

export async function getStripeClient(): Promise<import("stripe").default> {
  const StripeMod = (await import("stripe")).default;
  const { secretKey } = await getStripeConfig();
  return new StripeMod(secretKey);
}

export function getPublishableKeyForClient(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}
