import { getSql, hasDatabase } from "../db";

function safeQuery<T>(fn: () => Promise<T>): Promise<T> {
  if (!hasDatabase()) {
    return Promise.resolve([] as unknown as T);
  }
  return fn().catch(() => [] as unknown as T);
}

export async function getServices() {
  return safeQuery(async () => {
  const sql = getSql();
  return (await sql`SELECT * FROM services WHERE is_active = true ORDER BY name`) as {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number | null;
    price: string | null;
  }[];
  });
}

export async function getProducts(filters?: { q?: string; category?: string }) {
  return safeQuery(async () => {
  const sql = getSql();
  if (filters?.q && filters?.category) {
    return (await sql`
      SELECT * FROM products
      WHERE is_active = true AND category = ${filters.category}
        AND (name ILIKE ${`%${filters.q}%`} OR description ILIKE ${`%${filters.q}%`})
      ORDER BY name LIMIT 200
    `) as Record<string, unknown>[];
  }
  if (filters?.q) {
    const like = `%${filters.q}%`;
    return (await sql`
      SELECT * FROM products
      WHERE is_active = true AND (name ILIKE ${like} OR description ILIKE ${like})
      ORDER BY name LIMIT 200
    `) as Record<string, unknown>[];
  }
  if (filters?.category) {
    return (await sql`
      SELECT * FROM products
      WHERE is_active = true AND category = ${filters.category}
      ORDER BY name LIMIT 200
    `) as Record<string, unknown>[];
  }
  return (await sql`SELECT * FROM products WHERE is_active = true ORDER BY name LIMIT 200`) as Record<
    string,
    unknown
  >[];
  });
}

export async function getProduct(id: string): Promise<Record<string, unknown> | null> {
  if (!hasDatabase()) return null;
  try {
    const sql = getSql();
    const r = (await sql`SELECT * FROM products WHERE id = ${id}::uuid AND is_active = true LIMIT 1`) as
      | Record<string, unknown>[]
      | [];
    return r[0] ?? null;
  } catch {
    return null;
  }
}

export async function getProviders() {
  return safeQuery(async () => {
  const sql = getSql();
  return (await sql`SELECT * FROM providers WHERE is_active = true ORDER BY name`) as {
    id: string;
    name: string | null;
  }[];
  });
}

export async function getPackages() {
  return safeQuery(async () => {
  const sql = getSql();
  return (await sql`SELECT * FROM packages WHERE is_active = true ORDER BY name`) as {
    id: string;
    name: string;
    price: string | null;
    description?: string | null;
    includes?: string | null;
  }[];
  });
}

export async function getMemberships() {
  return safeQuery(async () => {
  const sql = getSql();
  return (await sql`SELECT * FROM memberships WHERE is_active = true ORDER BY name`) as {
    id: string;
    name: string;
    monthly_price: string | null;
    description?: string | null;
    benefits?: string | null;
    includes?: string | null;
  }[];
  });
}

export async function getCategories() {
  if (!hasDatabase()) return [] as string[];
  try {
    const sql = getSql();
    const rows = (await sql`SELECT distinct category FROM products WHERE is_active = true AND category is not null`) as {
      category: string;
    }[];
    return rows.map((r) => r.category);
  } catch {
    return [] as string[];
  }
}
