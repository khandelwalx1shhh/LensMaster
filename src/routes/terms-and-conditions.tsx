import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileCheck,
  ShieldAlert,
  Truck,
  Ban,
  Scale,
  ArrowLeft,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Lens Master" },
      {
        name: "description",
        content:
          "Terms and conditions for purchasing eyewear, frames, and optical lenses from Lens Master.",
      },
      { property: "og:title", content: "Terms & Conditions — Lens Master" },
      {
        property: "og:description",
        content: "Store terms of service, payment, and policy for Lens Master.",
      },
      { property: "og:url", content: "/terms-and-conditions" },
    ],
    links: [{ rel: "canonical", href: "/terms-and-conditions" }],
  }),
  component: TermsAndConditions,
});

function TermsAndConditions() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 pb-16 sm:pb-24">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Back to Home
      </Link>

      <div className="border-b pb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Legal &amp; Store Policies
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-light tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: August 2026 · Lens Master by The Swadesh, Jaipur, India
        </p>
      </div>

      <div className="mt-10 space-y-10 text-muted-foreground text-sm sm:text-base leading-relaxed">
        {/* Section 1: Agreement */}
        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <FileCheck className="h-5 w-5 text-gold" strokeWidth={1.5} />
            1. Agreement to Terms
          </h2>
          <p>
            By accessing, browsing, or purchasing from <strong>Lens Master</strong> (operated by The
            Swadesh, Jaipur, Rajasthan), you agree to be legally bound by these Terms and Conditions
            and our Privacy Policy. If you do not agree with any part of these terms, please do not
            use our website or place an order.
          </p>
        </section>

        {/* Section 2: No Return, No Refund, No Exchange Banner & Policy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <Ban className="h-5 w-5 text-rose-500" strokeWidth={1.5} />
            2. Strict No Return, No Refund &amp; No Exchange Policy
          </h2>

          <div className="rounded-2xl border-2 border-rose-500/20 bg-rose-500/5 p-5 text-foreground space-y-2">
            <p className="font-semibold text-sm sm:text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              All Sales Are Final — No Returns, No Refunds, No Exchanges
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Lens Master maintains a strict <strong>No Return, No Refund, and No Exchange</strong>{" "}
              policy across all product categories. Once an order is placed and confirmed, it cannot
              be returned, refunded, or exchanged under any ordinary circumstances.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
            <li>
              <strong>All Optical Products:</strong> All frames, sunglasses, blue-light glasses,
              custom-cut prescription lenses, and contact lenses are non-returnable and
              non-exchangeable.
            </li>
            <li>
              <strong>Custom Craftsmanship:</strong> Prescription lenses are individually crafted,
              precision-cut, and customized to your specific optical prescription numbers and frame
              geometry; therefore, cancellations or refunds cannot be processed once the order is
              initiated.
            </li>
            <li>
              <strong>Damage During Transit Exception:</strong> In the rare event an item arrives
              physically damaged during transit, you must notify our customer support on WhatsApp
              or email within <strong>24 hours of delivery</strong> with a mandatory, continuous,
              uncut <strong>unboxing video proof</strong> from package seal opening to inspection.
            </li>
          </ul>
        </section>

        {/* Section 3: No COD Policy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-gold" strokeWidth={1.5} />
            3. Payment Policy — 100% Prepaid (No Cash on Delivery / No COD)
          </h2>

          <div className="rounded-2xl border border-border bg-surface/50 p-4 text-foreground">
            <p className="font-medium text-sm text-foreground flex items-center gap-2">
              🚫 No Cash on Delivery (COD) Available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We operate exclusively on a <strong>100% prepaid basis</strong>. We do not provide
              Cash on Delivery (COD) services for any orders across India.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base">
            <li>
              All orders must be prepaid online during checkout through our authorized payment
              gateway partner, <strong>Razorpay</strong>.
            </li>
            <li>
              We accept all major secure payment methods: <strong>UPI (GPay, PhonePe, Paytm, BHIM)</strong>,
              Credit Cards, Debit Cards, Net Banking, and verified Mobile Wallets.
            </li>
            <li>
              Orders will only be scheduled for prescription fitting and dispatched once payment
              verification is received and confirmed.
            </li>
          </ul>
        </section>

        {/* Section 4: Prescription Eyewear & Accuracy */}
        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-gold" strokeWidth={1.5} />
            4. Prescription Eyewear Accuracy
          </h2>
          <p>When providing optical power details:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              You certify that all prescription parameters (SPH, CYL, AXIS, ADD, PD) entered or
              uploaded are accurate and derived from a certified optical prescription.
            </li>
            <li>
              Lens Master is not responsible for optical strain or visual discomfort resulting from
              incorrect power numbers supplied by the customer.
            </li>
            <li>
              Our optical team may contact you via WhatsApp or phone to verify unclear prescriptions
              before lens fabrication.
            </li>
          </ul>
        </section>

        {/* Section 5: Shipping & Delivery */}
        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <Truck className="h-5 w-5 text-gold" strokeWidth={1.5} />
            5. Shipping &amp; Delivery
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              We deliver across all serviceable PIN codes throughout India via express courier
              partners.
            </li>
            <li>
              Standard ready-to-wear frames dispatch within 24–48 business hours. Prescription power
              glasses require 2–4 business days for custom lens cutting and fitting.
            </li>
            <li>Estimated pan-India transit time is 4–7 business days.</li>
          </ul>
        </section>

        {/* Section 6: Governing Law */}
        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-gold" strokeWidth={1.5} />
            6. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms &amp; Conditions are governed by the laws of India. Any legal proceedings or
            disputes arising out of these terms shall be subject exclusively to the jurisdiction of
            the courts in <strong>Jaipur, Rajasthan, India</strong>.
          </p>
        </section>

        {/* Section 7: Contact */}
        <section className="space-y-3 border-t pt-8">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal">
            7. Contact &amp; Optical Support
          </h2>
          <p>For any questions or order assistance, please reach out to our team:</p>
          <div className="bg-card p-5 rounded-2xl border space-y-1.5 text-sm text-foreground">
            <p className="font-semibold">Lens Master by The Swadesh</p>
            <p className="text-muted-foreground">
              B-51, Lal Kothi Shopping Centre, Jaipur, Rajasthan 302015
            </p>
            <p className="text-muted-foreground">
              Email:{" "}
              <a href="mailto:support@lensmaster.in" className="text-foreground underline">
                support@lensmaster.in
              </a>
            </p>
            <p className="text-muted-foreground">
              Phone / WhatsApp: +91 98292 30548 | 0141-4112904
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
