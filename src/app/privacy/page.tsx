import { FloatingCard } from "@/components/ui/FloatingCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — JMJ Just My Journey",
  description: "How JMJ collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="jmj-container py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600/90">Legal</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#1E3A8A]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 25, 2025</p>

        <div className="mt-10 space-y-6">
          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">1. Information We Collect</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>We collect information you provide directly, including:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Name, email address, and password when you create an account</li>
                <li>Phone number and address when provided in your profile</li>
                <li>Booking details including service selections, dates, and therapist preferences</li>
                <li>Order and payment information processed securely through Stripe</li>
                <li>Messages and communications sent through our platform</li>
              </ul>
              <p className="mt-2">We also collect usage data automatically, such as pages visited, browser type, IP address, and device information to improve our services.</p>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">2. How We Use Your Information</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>We use the information we collect to:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Create and manage your account</li>
                <li>Process bookings, orders, and payments</li>
                <li>Send appointment confirmations and reminders</li>
                <li>Respond to your messages and support requests</li>
                <li>Send updates about your membership or package</li>
                <li>Improve our website, services, and customer experience</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mt-2">We do not sell your personal information to third parties.</p>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">3. Payment Information</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              All payment processing is handled by Stripe, a PCI-DSS compliant payment processor. JMJ does not store your full card number, CVV, or billing details on our servers. By making a purchase you agree to{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline underline-offset-2">
                Stripe&apos;s Privacy Policy
              </a>.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">4. Sharing Your Information</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>We may share your information with:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Service providers</strong> — third-party vendors who assist in operating our platform (e.g., hosting, email delivery, payment processing)</li>
                <li><strong>Therapists and staff</strong> — to fulfill your bookings</li>
                <li><strong>Legal authorities</strong> — when required by law or to protect our rights</li>
              </ul>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">5. Data Retention</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. Some information may be retained longer where required by law or for legitimate business purposes such as dispute resolution.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">6. Your Rights</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>You have the right to:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications at any time</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, please contact us via the Contact page.</p>
            </div>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">7. Cookies</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We use essential cookies to keep you signed in and maintain your session. We do not use third-party advertising cookies. You can control cookie settings in your browser, though disabling essential cookies may affect your ability to use the platform.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">8. Security</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and encrypted storage of sensitive credentials. While we work hard to protect your data, no method of transmission over the internet is 100% secure.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">9. Changes to This Policy</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date. Continued use of our services after changes constitutes acceptance of the revised policy.
            </p>
          </FloatingCard>

          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">10. Contact Us</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              If you have questions or concerns about this Privacy Policy, please reach out through our{" "}
              <a href="/contact" className="text-[#2563EB] underline underline-offset-2">Contact page</a>.
            </p>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
}
