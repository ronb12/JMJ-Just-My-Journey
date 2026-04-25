import EasyPost from "@easypost/api";

export function getEasyPostClient() {
  const key = process.env.EASYPOST_API_KEY;
  if (!key) {
    throw new Error("EASYPOST_API_KEY is not set");
  }
  return new EasyPost(key);
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

export function getEasyPostFromAddress(): EasyPostFromAddress {
  const name = process.env.EASYPOST_FROM_NAME || "";
  const street1 = process.env.EASYPOST_FROM_STREET1 || "";
  const city = process.env.EASYPOST_FROM_CITY || "";
  const state = process.env.EASYPOST_FROM_STATE || "";
  const zip = process.env.EASYPOST_FROM_ZIP || "";
  const country = process.env.EASYPOST_FROM_COUNTRY || "US";

  if (!name || !street1 || !city || !state || !zip) {
    throw new Error(
      "EasyPost from-address is not configured (EASYPOST_FROM_NAME/STREET1/CITY/STATE/ZIP)"
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

