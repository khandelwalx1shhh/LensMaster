import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-8 sm:mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-5 sm:py-10">
        <div className="grid gap-x-5 gap-y-4 grid-cols-3 lg:grid-cols-5">
          <div className="col-span-3 lg:col-span-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-base sm:text-xl font-semibold">LENS</span>
              <span className="font-display text-base sm:text-xl font-light tracking-[0.18em] text-background/60">MASTER</span>
            </div>
            <p className="mt-1.5 max-w-xs text-[10px] sm:text-xs text-background/60 leading-snug sm:leading-relaxed">
              Premium frames. Precision lenses. Jaipur's flagship luxury optical store since 1997.
            </p>
            <div className="mt-2 space-y-1 text-[10px] sm:text-xs text-background/70">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                <div>B-51, Lal Kothi Shopping Centre, Jaipur 302015</div>
              </div>
              <a href="tel:+919829230548" className="flex items-center gap-1.5 hover:text-background transition">
                <Phone className="h-3 w-3" /> +91 98292 30548
              </a>
              <a href="tel:+911414112904" className="flex items-center gap-1.5 hover:text-background transition">
                <Phone className="h-3 w-3" /> 0141-4112904
              </a>
              <a href="mailto:support@lensmaster.in" className="flex items-center gap-1.5 hover:text-background transition break-all">
                <Mail className="h-3 w-3 shrink-0" /> support@lensmaster.in
              </a>
            </div>
          </div>

          <FooterCol title="Shop" links={[
            { label: "All Frames", to: "/shop" },
            { label: "Sunglasses", to: "/shop" },
            { label: "Blue Light", to: "/shop" },
            { label: "Kids", to: "/shop" },
          ]} />

          <FooterCol title="Company" links={[
            { label: "About", to: "/about" },
            { label: "Stores", to: "/stores" },
            { label: "Brands", to: "/brands" },
          ]} />

          <FooterCol title="Support" links={[
            { label: "Contact", to: "/stores" },
            { label: "Shipping", to: "/" },
            { label: "FAQ", to: "/" },
          ]} />
        </div>

        <div className="mt-5 sm:mt-10 pt-4 sm:pt-5 border-t border-background/10 flex flex-row items-center justify-between gap-3 sm:gap-4 pr-16 sm:pr-0 lg:pr-0">
          <p className="text-[9px] sm:text-[11px] text-background/50">© {new Date().getFullYear()} Lens Master. All rights reserved.</p>
          <div className="flex items-center gap-3 text-background/60">
            <a
              href="https://www.instagram.com/theswadeshopticals/"
              target="_blank"
              rel="noopener noreferrer external"
              aria-label="Lens Master on Instagram"
              className="hover:text-background transition"
            >
              <Instagram className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </a>
            <a
              href="https://www.facebook.com/LensMasterbyTheSwadesh/"
              target="_blank"
              rel="noopener noreferrer external"
              aria-label="Lens Master on Facebook"
              className="hover:text-background transition"
            >
              <Facebook className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </a>
            
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return (
    <div>
      <h4 className="font-display text-[10px] sm:text-sm font-medium tracking-wider uppercase text-background/90">{title}</h4>
      <ul className="mt-2 sm:mt-4 space-y-1.5 sm:space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-[10px] sm:text-sm text-background/60 hover:text-background transition">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
