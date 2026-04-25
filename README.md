# JMJ — Just My Journey

**Repository:** [github.com/ronb12/JMJ-Just-My-Journey](https://github.com/ronb12/JMJ-Just-My-Journey)

Premium **luxury wellness, spa booking, and wellness e‑commerce** platform. Blue glassmorphism UI, Stripe Checkout (server-only), Neon PostgreSQL, and role-based customer/admin areas.

## Features

- **Public:** landing, services, booking flow, packages, memberships, store (search & category filters), product detail, cart, checkout success/cancel, about, contact.
- **Customer:** dashboard (appointments, orders, messages, notifications, profile) — JWT session via NextAuth.
- **Admin:** bookings, customers, services, products/inventory, orders/fulfillment, messages, notifications, Stripe settings (optional encrypted custom keys).
- **Payments:** Stripe Checkout for spa bookings, store orders, one-time packages, and monthly memberships (subscription mode for memberships). Webhook updates `payment_status`, inventory, and in-app notifications.
- **PWA:** `public/manifest.json` and theme color. Add `public/icons/icon-192.png` & `icon-512.png` for install hints if desired.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Neon** serverless (`@neondatabase/serverless`)
- **NextAuth** (credentials) — `next-auth@4` with `legacy-peer-deps` for Next 16 (see `.npmrc`)
- **Stripe** (Checkout + webhooks; secret keys only on the server)
- Vercel-ready; GitHub for source control

## Project layout

- `migrations/001_init.sql` — run against Neon to create all tables
- `src/app` — App Router pages and `api/` route handlers
- `src/components/ui` — reusable glass UI (GlassCard, PaymentSummarySheet, etc.)
- `src/lib` — `db`, `auth`, `stripe-config`, `encryption` (admin Stripe secret)
- `src/scripts/seed.ts` — optional sample data + admin user

## Local development

**Prerequisites:** Node 20+, a Neon `DATABASE_URL`, and (for payments) Stripe test keys.

1. **Install (use project-local npm cache if your home disk is full):**

   ```bash
   cd jmj-app
   npm install
   ```

2. **Environment:** copy `.env.example` to `.env.local` and set:

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | Neon connection string |
   | `NEXTAUTH_SECRET` | Random string for JWT signing |
   | `NEXTAUTH_URL` | e.g. `http://localhost:3000` |
   | `NEXT_PUBLIC_APP_URL` | Same as public URL (used in Stripe redirects) |
   | `STRIPE_SECRET_KEY` | `sk_test_...` (platform) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
   | `STRIPE_WEBHOOK_SECRET` | From `stripe listen` or dashboard |
   | `ENCRYPTION_KEY` | Long random string; required to save **custom** Stripe secret in admin |

3. **Database:** in Neon SQL editor, run the contents of `migrations/001_init.sql`.

4. **Seed (optional):** set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `.env.local`, then:

   ```bash
   npm run db:seed
   ```

5. **Run:**

   ```bash
   npm run dev
   ```

6. **Build:** `npm run build` (confirm passes before deploying)

## Neon setup

1. Create a project and database in [Neon](https://neon.tech).
2. Copy the connection string to `DATABASE_URL` (pooled or direct, as you prefer; serverless works with `@neondatabase/serverless`).

## Vercel deployment

1. Push the repo to GitHub and import the `jmj-app` folder in Vercel (or the repo root if you moved files).
2. Set all environment variables from `.env.example` in the Vercel project settings (Production/Preview/Development as needed).
3. After deploy, set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL.
4. Add a **Stripe webhook endpoint** pointing to `https://<your-domain>/api/stripe/webhook` and paste the signing secret to `STRIPE_WEBHOOK_SECRET`.

## Stripe

- **Test mode:** use test keys; run `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally.
- **Checkout** is always created on the server; amounts come from the database, not the client.
- **Admin "custom keys":** the secret is encrypted with `ENCRYPTION_KEY` and never returned to the browser. Publishable is stored; masked feedback is shown in the admin UI.
- **Webhook events handled:** `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`.

## Webhook setup (summary)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint → `https://yourdomain.com/api/stripe/webhook`
2. Select the events above; copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET`.

## Admin

- Seeded or manually promoted users with `users.role = 'admin'` can open `/admin`.
- Configure Stripe in **Admin → Settings** (platform env vs custom keys).

## Repository

Initialize Git inside `jmj-app` (if not already):

```bash
cd jmj-app
git init
git add .
git commit -m "Initial JMJ — Just My Journey application"
```

---

*JMJ — blue wellness theme, glassmorphism, calm motion, and `prefers-reduced-motion` respected where Framer Motion is used.*
