/**
 * Run after migrations: DATABASE_URL, optional ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD
 *   npm run db:seed
 * Defaults in code are dev-only; override in .env and rotate password for any shared/production DB.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

config({ path: ".env.local" });
config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required");
  }
  const sql = neon(url);
  const email = (process.env.ADMIN_SEED_EMAIL || "ronellbradley@gmail.com").toLowerCase();
  const pass = process.env.ADMIN_SEED_PASSWORD || "password1234";
  const h = await hash(pass, 10);
  const existing = (await sql`SELECT id FROM users WHERE lower(email) = ${email}`) as { id: string }[];
  if (!existing[0]) {
    await sql`
      INSERT INTO users (id, name, email, password_hash, role, phone)
      VALUES (gen_random_uuid(), 'JMJ Admin', ${email}, ${h}, 'admin', null)
    `;
    // eslint-disable-next-line no-console
    console.log("Admin user created:", email);
  } else {
    await sql`
      UPDATE users
      SET password_hash = ${h}, role = 'admin'
      WHERE id = ${existing[0].id}::uuid
    `;
    // eslint-disable-next-line no-console
    console.log("Admin user updated (password/role):", email);
  }
  // Sample providers
  const pc = (await sql`SELECT count(*)::int AS c FROM providers`) as { c: number }[];
  if ((pc[0]?.c || 0) < 1) {
    await sql`INSERT INTO providers (name, specialty) VALUES ('Alex Rivers', 'Massage')`;
    // eslint-disable-next-line no-console
    console.log("Sample provider added");
  }
  // Services from spec
  const svc = [
    ["Swedish Massage", "Relaxing full-body massage", 60, 120],
    ["Deep Tissue Massage", "Targeted work for tension", 75, 145],
    ["Hot Stone Massage", "Heated basalt", 90, 165],
    ["Facial Treatment", "Rejuvenation facial", 60, 110],
    ["Aromatherapy Session", "Scent journey", 50, 95],
    ["Couples Spa Package", "Side-by-side ritual", 120, 350],
    ["Wellness Coaching", "Habit and mindset support", 45, 85],
    ["Sauna Therapy", "Infrared and steam", 45, 60],
    ["Body Scrub", "Exfoliation and glow", 45, 90],
    ["Relaxation Journey Package", "Our signature", 150, 420],
  ] as const;
  const sCount = (await sql`SELECT count(*)::int AS c FROM services`) as { c: number }[];
  if ((sCount[0]?.c || 0) < 1) {
    for (const [name, desc, dur, price] of svc) {
      await sql`INSERT INTO services (name, description, duration_minutes, price) VALUES (
        ${name},
        ${desc},
        ${dur},
        ${String(price)}::numeric
      )`;
    }
    // eslint-disable-next-line no-console
    console.log("Sample services added");
  }
  const pCount = (await sql`SELECT count(*)::int AS c FROM products`) as { c: number }[];
  if ((pCount[0]?.c || 0) < 1) {
    const p = [
      ["Lavender Massage Oil", "Soothing body oil", "Massage Oils", 32],
      ["Rose Hydration Facial Cream", "Dewy finish", "Skincare", 48],
      ["Eucalyptus Bath Salt", "Mineral soak", "Bath Salts", 18],
      ["Vanilla Soy Candle", "Cozy glow", "Candles", 28],
      ["Himalayan Body Scrub", "Gentle polish", "Body Scrubs", 22],
      ["Wellness Journey Journal", "Gratitude pages", "Wellness Journals", 24],
      ["Relaxation Gift Card", "Digital or physical", "Gift Cards", 100],
      ["Self-Care Spa Bundle", "Curated ritual set", "Spa Bundles", 120],
    ] as const;
    for (const [name, desc, cat, price] of p) {
      await sql`INSERT INTO products (name, description, category, price, stock_quantity) VALUES (
        ${name},
        ${desc},
        ${cat},
        ${String(price)}::numeric,
        30
      )`;
    }
    // eslint-disable-next-line no-console
    console.log("Sample products added");
  }
  const mCount = (await sql`SELECT count(*)::int AS c FROM memberships`) as { c: number }[];
  if ((mCount[0]?.c || 0) < 1) {
    await sql`INSERT INTO memberships (name, description, monthly_price, benefits) VALUES
      (
        'Calm Circle',
        'One massage credit & member pricing',
        99::numeric,
        '20% off retail, priority booking'
      ),
      (
        'Sanctuary+',
        'Unlimited infrared sauna & monthly facial',
        199::numeric,
        'All Calm benefits + guest pass'
      )`;
    // eslint-disable-next-line no-console
    console.log("Sample memberships");
  }
  const pk = (await sql`SELECT count(*)::int AS c FROM packages`) as { c: number }[];
  if ((pk[0]?.c || 0) < 1) {
    await sql`INSERT INTO packages (name, description, price) VALUES
      (
        'Weekend Reset',
        'Massage + facial mini',
        245::numeric
      ),
      (
        'Couples Soirée',
        'Side-by-side massage & champagne',
        520::numeric
      )`;
    // eslint-disable-next-line no-console
    console.log("Sample packages");
  }
  // eslint-disable-next-line no-console
  console.log("Seed done.");
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
