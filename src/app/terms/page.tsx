import { FloatingCard } from "@/components/ui/FloatingCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — JMJ Just My Journey",
  description: "Terms and conditions governing use of the JMJ platform.",
};

export default function TermsPage() {
  return (
    <div className="jmj-container py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600/90">Legal</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#1E3A8A]">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 25, 2025</p>

        <div className="mt-10 space-y-6">
          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">1. Acceptance of Terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              By accessing or using the JMJ — Just My Journey platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. These terms apply to all visitors, users, and customers.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">2. Use of the Service</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of others. You must not:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Use the Service for any fraudulent or illegal purpose</li>
                <li>Attempt to gain unauthorized access to any part of the platform</li>
                <li>Submit false or misleading information</li>
                <li>Harass, threaten, or harm other users or staff</li>
                <li>Scrape, copy, or redistribute content without permission</li>
              </ul>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">3. Accounts</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">4. Bookings & Appointments</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>When you book a service:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Bookings are confirmed upon successful payment</li>
                <li>Cancellations must be made at least 24 hours in advance for a full refund</li>
                <li>Late cancellations (under 24 hours) may be subject to a cancellation fee</li>
                <li>No-shows forfeit the full booking amount</li>
                <li>We reserve the right to reschedule appointments due to staff availability or unforeseen circumstances</li>
              </ul>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">5. Store Orders & Returns</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <ul className="ml-4 list-disc space-y-1">
                <li>All store orders are processed and shipped within 3–5 business days</li>
                <li>Returns are accepted within 14 days of delivery for unopened, undamaged items</li>
                <li>Final sale items and gift cards are non-refundable</li>
                <li>Shipping costs are non-refundable unless the return is due to our error</li>
              </ul>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">6. Memberships & Packages</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <ul className="ml-4 list-disc space-y-1">
                <li>Memberships are billed on a recurring monthly basis</li>
                <li>You may cancel your membership at any time; access continues until the end of the current billing period</li>
                <li>Packages are non-refundable once any session or benefit has been redeemed</li>
                <li>Unused package sessions expire 12 months from the date of purchase</li>
              </ul>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">7. Payments</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              All payments are processed securely through Stripe. By completing a purchase you authorize us to charge the payment method provided. Prices are displayed in USD and are subject to change. We are not responsible for any fees charged by your bank or card issuer.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">8. Intellectual Property</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              All content on this platform — including text, images, logos, and design — is the property of JMJ — Just My Journey and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">9. Disclaimer of Warranties</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or free of harmful components. Wellness services are not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">10. Limitation of Liability</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              To the fullest extent permitted by law, JMJ shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability to you for any claim shall not exceed the amount you paid us in the 90 days preceding the claim.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">11. Changes to Terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We reserve the right to update these Terms of Service at any time. We will notify you of material changes by posting the updated terms on this page. Continued use of the Service after changes are posted constitutes your acceptance of the new terms.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">12. Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Questions about these Terms of Service? Please reach out through our{" "}
              <a href="/contact" className="text-[#2563EB] underline underline-offset-2">Contact page</a>.
            </p>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
}
