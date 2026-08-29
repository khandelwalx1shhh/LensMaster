import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { MAPS_DIRECTIONS_URL, MAPS_EMBED_SRC } from "@/lib/maps";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Visit Our Jaipur Store — Lens Master by The Swadesh" },
      { name: "description", content: "Lens Master flagship optical store — B-51 Lal Kothi Shopping Centre, Jaipur. Rated 4.9★ on Google. Try premium frames in-store today." },
      { property: "og:title", content: "Visit Our Jaipur Store — Lens Master" },
      { property: "og:description", content: "B-51 Lal Kothi Shopping Centre, Jaipur. Open 10:30 AM daily. Rated 4.9★ on Google." },
      { property: "og:url", content: "/stores" },
    ],
    links: [{ rel: "canonical", href: "/stores" }],
  }),
  component: Stores,
});

const hours = [
  ["Monday", "10:30 AM – 9:00 PM"],
  ["Tuesday", "10:30 AM – 9:00 PM"],
  ["Wednesday", "10:30 AM – 9:00 PM"],
  ["Thursday", "10:30 AM – 9:00 PM"],
  ["Friday", "10:30 AM – 9:00 PM"],
  ["Saturday", "10:30 AM – 9:00 PM"],
  ["Sunday", "10:30 AM – 7:00 PM"],
];

function Stores() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 pb-14 sm:pb-20">
      <div className="max-w-2xl">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Store</p>
        <h1 className="mt-3 sm:mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">
          Jaipur flagship.
        </h1>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
          Try on any frame, meet our opticians, and take home lenses cut to your exact prescription.
        </p>
      </div>

      <div className="mt-10 sm:mt-16 grid lg:grid-cols-2 gap-8 sm:gap-10">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-surface aspect-[4/3] sm:aspect-square">
          <iframe
            title="Lens Master Jaipur"
            src={MAPS_EMBED_SRC}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl">Lens Master by The Swadesh</h2>
            <p className="mt-2 text-sm text-muted-foreground">Premium optical store · ⭐ 4.9 (700+ Google reviews)</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                B-51, Lal Kothi Shopping Centre,<br />
                Laxmi Colony, Lalkothi,<br />
                Jaipur, Rajasthan 302015, India
              </div>
            </div>
            <a href="tel:+919829230548" className="flex gap-3 hover:text-foreground text-muted-foreground">
              <Phone className="h-4 w-4 mt-0.5" /> +91 98292 30548
            </a>
            <a href="tel:+911414112904" className="flex gap-3 hover:text-foreground text-muted-foreground">
              <Phone className="h-4 w-4 mt-0.5" /> 0141-4112904
            </a>
            <a href="mailto:support@lensmaster.in" className="flex gap-3 hover:text-foreground text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5" /> support@lensmaster.in
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Opening hours
            </div>
            <div className="mt-4 divide-y divide-border rounded-2xl border border-border overflow-hidden">
              {hours.map(([d, h]) => (
                <div key={d} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{d}</span>
                  <span className="tabular-nums">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer external"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition"
            >
              Get directions <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+919829230548"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition"
            >
              Call the store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
