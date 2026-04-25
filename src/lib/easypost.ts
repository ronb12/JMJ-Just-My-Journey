import EasyPost from "@easypost/api";
import { getSql } from "./db";
import { decryptSecret } from "./encryption";

type SettingsRow = {
  use_custom_easypost: boolean;
  encrypted_api_key: string | null;
  from_name: string | null;
  from_street1: string | null;
  from_street2: string | null;
  from_city: string | null;
  from_state: string | null;
  from_zip: string | null;
  from_country: string | null;
  from_phone: string | null;
  from_email: string | null;
};

let rowCache: { data: SettingsRow | null; t: number } = { data: null, t: 0 };
const CACHE_MS = 60_000;

function isMissingTable(e: unknown) {
  return (e as { code?: string })?.code === "42P01";
}

export function clearEasyPostConfigCache() {
  rowCache = { data: null, t: 0 };
}

async function getSettingsRow(): Promise<SettingsRow | null> {
  if (!process.env.DATABASE_URL) return null;
  const n = Date.now();
  if (rowCache.t > 0 && n - rowCache.t < CACHE_MS) {
    return rowCache.data;
  }
  try {
    const sql = getSql();
    const r = (await sql`
      SELECT
        use_custom_easypost,
        encrypted_api_key,
        from_name,
        from_street1,
        from_street2,
        from_city,
        from_state,
        from_zip,
        from_country,
        from_phone,
        from_email
      FROM easypost_settings
      LIMIT 1
    `) as SettingsRow[];
    const data = r[0] || null;
    rowCache = { data, t: n };
    return data;
  } catch (e) {
    if (isMissingTable(e)) {
      rowCache = { data: null, t: n };
      return null;
    }
    throw e;
  }
}

function hasCompleteShipFromInDb(r: SettingsRow) {
  return (
    Boolean(r.from_name?.trim()) &&
    Boolean(r.from_street1?.trim()) &&
    Boolean(r.from_city?.trim()) &&
    Boolean(r.from_state?.trim()) &&
    Boolean(r.from_zip?.trim())
  );
}

function getFromEnv(): EasyPostFromAddress {
  const name = process.env.EASYPOST_FROM_NAME || "";
  const street1 = process.env.EASYPOST_FROM_STREET1 || "";
  const city = process.env.EASYPOST_FROM_CITY || "";
  const state = process.env.EASYPOST_FROM_STATE || "";
  const zip = process.env.EASYPOST_FROM_ZIP || "";
  const country = process.env.EASYPOST_FROM_COUNTRY || "US";
  if (!name || !street1 || !city || !state || !zip) {
    throw new Error(
      "EasyPost ship-from address: set it in Admin → Settings (EasyPost & shipping) or set EASYPOST_FROM_NAME, EASYPOST_FROM_STREET1, EASYPOST_FROM_CITY, EASYPOST_FROM_STATE, EASYPOST_FROM_ZIP in the environment."
    );
  }
  return {
    name,
    street1,
    street2: process.env.EASYPOST_FROM_STREET2 || null,
    city,
    state,
    zip,
    country,
    phone: process.env.EASYPOST_FROM_PHONE || null,
    email: process.env.EASYPOST_FROM_EMAIL || null,
  };
}

export type EasyPostFromAddress = {
  name: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
  email?: string | null;
};

export async function getEasyPostApiKey(): Promise<string> {
  const row = await getSettingsRow();
  if (row?.use_custom_easypost && row?.encrypted_api_key) {
    return decryptSecret(row.encrypted_api_key);
  }
  const env = process.env.EASYPOST_API_KEY;
  if (env) return env;
  if (row?.use_custom_easypost) {
    throw new Error(
      "EasyPost custom mode is on, but no API key is stored. Add it in Admin → Settings (EasyPost & shipping) or set EASYPOST_API_KEY in the environment."
    );
  }
  throw new Error(
    "EASYPOST_API_KEY is not set. Add it in Admin → Settings (EasyPost & shipping) or set EASYPOST_API_KEY in the environment (e.g. Vercel project env vars)."
  );
}

export async function getEasyPostFromAddress(): Promise<EasyPostFromAddress> {
  const row = await getSettingsRow();
  if (row && hasCompleteShipFromInDb(row)) {
    return {
      name: row.from_name!.trim(),
      street1: row.from_street1!.trim(),
      street2: row.from_street2?.trim() || null,
      city: row.from_city!.trim(),
      state: row.from_state!.trim(),
      zip: row.from_zip!.trim(),
      country: (row.from_country && row.from_country.trim()) || "US",
      phone: row.from_phone?.trim() || null,
      email: row.from_email?.trim() || null,
    };
  }
  return getFromEnv();
}

export async function getEasyPostClient() {
  const key = await getEasyPostApiKey();
  return new EasyPost(key);
}
