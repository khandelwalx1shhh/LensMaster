import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-8 sm:mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="grid gap-x-6 gap-y-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-base sm:text-xl font-semibold">LENS</span>
              <span className="font-display text-base sm:text-xl font-light tracking-[0.18em] text-background/60">
                MASTER
              </span>
            </div>
            <p className="mt-2 max-w-xs text-[11px] sm:text-xs text-background/60 leading-relaxed">
              Premium frames. Precision lenses. Jaipur's flagship luxury optical store since 2023.
            </p>
            <div className="mt-3 space-y-1.5 text-[11px] sm:text-xs text-background/70">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-background/50" />
                <div>B-51, Lal Kothi Shopping Centre, Jaipur 302015</div>
              </div>
              <a
                href="tel:+919829230548"
                className="flex items-center gap-1.5 hover:text-background transition"
              >
                <Phone className="h-3.5 w-3.5 text-background/50" /> +91 98292 30548
              </a>
              <a
                href="tel:+911414112904"
                className="flex items-center gap-1.5 hover:text-background transition"
              >
                <Phone className="h-3.5 w-3.5 text-background/50" /> 0141-4112904
              </a>
              <a
                href="mailto:support@lensmaster.in"
                className="flex items-center gap-1.5 hover:text-background transition break-all"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-background/50" /> support@lensmaster.in
              </a>
            </div>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: "All Frames", to: "/shop" },
              { label: "Sunglasses", to: "/shop?category=sunglasses" },
              { label: "Blue Light", to: "/shop?category=blue-light" },
              { label: "Contact Lenses", to: "/shop?category=contacts" },
              { label: "Kids Collection", to: "/shop?category=kids" },
            ]}
          />

          <FooterCol
            title="Company"
            links={[
              { label: "About Lens Master", to: "/about" },
              { label: "Our Store Locations", to: "/stores" },
              { label: "Featured Brands", to: "/brands" },
            ]}
          />

          <FooterCol
            title="Support & Legal"
            links={[
              { label: "Contact & Consultation", to: "/stores" },
              { label: "Privacy Policy", to: "/privacy-policy" },
              { label: "Terms & Conditions", to: "/terms-and-conditions" },
              { label: "Order Status Lookup", to: "/order-status" },
            ]}
          />
        </div>

        {/* Bottom Bar with Copyright, Legal Links, and Social Icons */}
        <div className="mt-8 sm:mt-12 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[11px] sm:text-xs text-background/50">
            <p>© {new Date().getFullYear()} Lens Master by The Swadesh. All rights reserved.</p>
            <span className="hidden sm:inline">·</span>
            <Link
              to="/privacy-policy"
              className="text-background/60 hover:text-background transition underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <span>·</span>
            <Link
              to="/terms-and-conditions"
              className="text-background/60 hover:text-background transition underline-offset-4 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </div>

          <div className="flex items-center gap-3 text-background/60">
            <a
              href="https://www.instagram.com/theswadeshopticals/"
              target="_blank"
              rel="noopener noreferrer external"
              aria-label="Lens Master on Instagram"
              className="p-1.5 rounded-full hover:bg-background/10 hover:text-background transition"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/LensMasterbyTheSwadesh/"
              target="_blank"
              rel="noopener noreferrer external"
              aria-label="Lens Master on Facebook"
              className="p-1.5 rounded-full hover:bg-background/10 hover:text-background transition"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h4 className="font-display text-xs sm:text-sm font-medium tracking-wider uppercase text-background/90">
        {title}
      </h4>
      <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-xs sm:text-[13px] text-background/60 hover:text-background transition"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
