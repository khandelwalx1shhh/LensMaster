import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck, ShieldAlert, Truck, RotateCcw, Scale, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Lens Master" },
      {
        name: "description",
        content:
          "Terms and conditions for purchasing prescription eyewear, sunglasses, and optical lenses from Lens Master.",
      },
      { property: "og:title", content: "Terms & Conditions — Lens Master" },
      {
        property: "og:description",
        content: "Terms of service and customer conditions for Lens Master.",
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
          Legal &amp; Policy
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-light tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: August 2026 · Lens Master by The Swadesh, Jaipur, India
        </p>
      </div>

      <div className="mt-10 space-y-10 text-muted-foreground text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <FileCheck className="h-5 w-5 text-gold" strokeWidth={1.5} />
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or purchasing from <strong>Lens Master</strong> (operated by The Swadesh,
            Jaipur), you agree to be bound by these Terms and Conditions and our Privacy Policy. If
            you do not agree with any part of these terms, please do not use our website or services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-gold" strokeWidth={1.5} />
            2. Prescription Eyewear &amp; Accuracy
          </h2>
          <p>
            When ordering prescription glasses, contact lenses, or specialized lenses:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              You certify that the prescription details entered or uploaded are accurate and issued
              by a certified optometrist or ophthalmologist.
            </li>
            <li>
              Lens Master is not responsible for visual discomfort or incorrect power resulting from
              inaccurate prescription numbers provided by the customer.
            </li>
            <li>
              Our optical team reserves the right to contact you via phone or WhatsApp to verify
              Pupillary Distance (PD) or high-power prescriptions before cutting custom lenses.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-gold" strokeWidth={1.5} />
            3. Pricing, Orders &amp; Payments
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All prices are listed in Indian Rupees (INR ₹) inclusive of applicable taxes.</li>
            <li>
              Online payments are processed securely through <strong>Razorpay</strong> via UPI,
              credit/debit cards, net banking, and verified wallets.
            </li>
            <li>
              An order is considered confirmed once payment authorization is successfully received.
            </li>
            <li>
              We reserve the right to decline or cancel any order in case of pricing errors, product
              discontinuation, or stock unavailability.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <Truck className="h-5 w-5 text-gold" strokeWidth={1.5} />
            4. Shipping &amp; Delivery
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We ship across all serviceable pin codes in India with flat delivery pricing.</li>
            <li>
              Ready-to-wear frames and sunglasses typically dispatch within 24–48 hours. Custom
              prescription power lenses require 2–4 business days for precision cutting and fitting.
            </li>
            <li>
              Estimated delivery time is 4–7 business days depending on destination location.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal flex items-center gap-2.5">
            <RotateCcw className="h-5 w-5 text-gold" strokeWidth={1.5} />
            5. Returns, Replacements &amp; Cancellations
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Non-Prescription Frames &amp; Sunglasses:</strong> Eligible for return or exchange
              within 7 days of delivery in unused, original condition with all tags and protective
              cases intact.
            </li>
            <li>
              <strong>Custom Prescription Lenses:</strong> Because prescription lenses are custom-cut
              specifically for your optical parameters and frame, lens costs cannot be refunded once
              crafted, except in cases of manufacturing defects or fitting discrepancies caused by us.
            </li>
            <li>
              <strong>Transit Damage:</strong> In the unlikely event an item arrives damaged, please
              contact us within 48 hours with unboxing photos for an immediate replacement.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal">
            6. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of
            India. Any disputes arising in connection with these terms shall be subject to the
            exclusive jurisdiction of the courts in <strong>Jaipur, Rajasthan, India</strong>.
          </p>
        </section>

        <section className="space-y-3 border-t pt-8">
          <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal">
            7. Contact Information
          </h2>
          <p>For any inquiries regarding these terms, please get in touch with our team:</p>
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
            <p className="text-muted-foreground">Phone / WhatsApp: +91 98292 30548 | 0141-4112904</p>
          </div>
        </section>
      </div>
    </div>
  );
}
