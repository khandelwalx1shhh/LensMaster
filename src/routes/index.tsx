import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Star } from "lucide-react";
import heroImage from "@/assets/hero-eyewear-desktop.jpg";
import prescriptionImg from "@/assets/collections/prescription.jpg";
import sunglassesImg from "@/assets/collections/sunglasses.jpg";
import bluelightImg from "@/assets/collections/bluelight.jpg";
import contactsImg from "@/assets/collections/contacts.jpg";
import kidsImg from "@/assets/collections/kids.jpg";
import sportsImg from "@/assets/collections/sports.jpg";
import { ProductGrid } from "@/components/site/ProductGrid";
import { MAPS_DIRECTIONS_URL, MAPS_EMBED_SRC } from "@/lib/maps";
import {
  BLUE_CUT_SINGLE_PRICE,
  BLUE_CUT_BUNDLE_PRICE,
  BLUE_CUT_HIGH_POWER_SINGLE_PRICE,
  BLUE_CUT_HIGH_POWER_BUNDLE_PRICE,
  BLUE_CUT_HIGH_POWER_THRESHOLD,
  formatPrice,
} from "@/lib/shopify";

import { absoluteUrl, generateBreadcrumbSchema } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const canonical = absoluteUrl("/");
    return {
      meta: [
        { title: "Lens Master — Jaipur's #1 Luxury Optical Store & Eyewear Destination" },
        {
          name: "description",
          content:
            "Shop premium designer frames, eyeglasses, sunglasses, and blue cut glasses in Jaipur from Ray-Ban, Gucci, Oakley, Prada. Computerized eye testing & precision lens fitting in Lalkothi.",
        },
        { property: "og:title", content: "Lens Master — Premium Eyewear & Optical Store in Jaipur" },
        {
          property: "og:description",
          content: "Ray-Ban, Gucci, Oakley, Prada, Blue Cut glasses & precision lenses fitted in-store. 4.9★ on Google.",
        },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(generateBreadcrumbSchema([{ name: "Home", path: "/" }])),
        },
      ],
    };
  },
  component: Home,
});

const collections: Array<{ title: string; tag: string; image: string; category: "prescription" | "sunglasses" | "blue-light" | "contacts" | "kids" | "sports" }> = [
  { title: "Prescription", tag: "Everyday clarity", image: prescriptionImg, category: "prescription" },
  { title: "Sunglasses", tag: "UV & polarized", image: sunglassesImg, category: "sunglasses" },
  { title: "Blue Light", tag: "Screen relief", image: bluelightImg, category: "blue-light" },
  { title: "Contact Lenses", tag: "Daily & monthly", image: contactsImg, category: "contacts" },
  { title: "Kids", tag: "Made to play", image: kidsImg, category: "kids" },
  { title: "Sports", tag: "Performance", image: sportsImg, category: "sports" },
];


const brands: Array<{ name: string; domain: string }> = [
  { name: "Ray-Ban", domain: "ray-ban.com" },
  { name: "Gucci", domain: "gucci.com" },
  { name: "Oakley", domain: "oakley.com" },
  { name: "Tom Ford", domain: "tomford.com" },
  { name: "Vogue", domain: "vogue-eyewear.com" },
  { name: "Carrera", domain: "carreraworld.com" },
  { name: "Calvin Klein", domain: "calvinklein.com" },
  { name: "Prada", domain: "prada.com" },
  { name: "Armani", domain: "armani.com" },
  { name: "Burberry", domain: "burberry.com" },
  { name: "Michael Kors", domain: "michaelkors.com" },
  { name: "Dolce & Gabbana", domain: "dolcegabbana.com" },
];

const logoDevToken = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY;

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[78svh] sm:min-h-[620px] sm:h-[72svh] lg:min-h-[620px] lg:h-[74svh] lg:max-h-[740px] w-full overflow-hidden bg-black">
        <img
          src={heroImage}
          alt="Premium eyewear"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%] lg:object-[60%_25%]"
        />

        {/* Gradients: mobile bottom-to-top, desktop left-to-right for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent lg:bg-gradient-to-r lg:from-black/70 lg:via-black/20 lg:to-transparent" />

        <div className="relative z-10 flex h-full min-h-[78svh] sm:min-h-0 items-end pb-8 sm:pb-14 lg:items-center lg:pb-0">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
            <div className="max-w-xl lg:max-w-2xl text-white animate-in fade-in duration-1000">
              <h1 className="font-display text-[40px] leading-[1.02] sm:text-5xl md:text-[64px] lg:text-[76px] font-light tracking-tight animate-in slide-in-from-bottom-3 duration-700 delay-100">
                Premium Eyewear &amp; Optical Store<br />
                <span className="italic font-extralight text-white/95">in Jaipur</span>
              </h1>
              <p className="mt-5 sm:mt-7 max-w-md text-[15px] sm:text-base md:text-lg leading-relaxed text-white/70 animate-in slide-in-from-bottom-3 duration-700 delay-200">
                See better. Look better. Precision-crafted optics, designer frames and prescription lenses from Jaipur's premier eyewear destination.
              </p>


              <Link
                to="/shop"
                search={{ offer: "blue-cut" }}
                className="mt-5 sm:mt-6 inline-flex w-full sm:w-fit animate-in slide-in-from-bottom-3 duration-700 delay-250 group"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-white backdrop-blur-sm transition group-hover:bg-black/60 group-hover:border-white/30">
                  <span className="inline-flex shrink-0 items-center rounded-full bg-gold/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-black uppercase">Offer</span>
                  <p className="text-xs sm:text-sm font-medium leading-snug">
                    2 glasses with Blue Cut lenses @ {formatPrice(BLUE_CUT_BUNDLE_PRICE)}
                  </p>
                </div>
              </Link>
              <p className="mt-1.5 text-[10px] leading-relaxed text-white/50">
                1 @ {formatPrice(BLUE_CUT_SINGLE_PRICE)} · Power above ±{BLUE_CUT_HIGH_POWER_THRESHOLD}.00: 1 @ {formatPrice(BLUE_CUT_HIGH_POWER_SINGLE_PRICE)} (2 @ {formatPrice(BLUE_CUT_HIGH_POWER_BUNDLE_PRICE)}) · T&C apply
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                <Link
                  to="/shop"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-8 py-4 text-sm font-semibold transition-all active:scale-[0.98] hover:bg-white/90"
                >
                  Explore Collection
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <div className="flex items-center gap-2.5 sm:pl-2">
                  <div className="flex items-center gap-0.5 text-gold">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <p className="text-[12px] font-medium text-white/80">4.9 · 700+ Google Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        <div className="flex items-end justify-between mb-6 sm:mb-10 gap-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Shop</p>
            <h2 className="mt-2 sm:mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">Collections</h2>
          </div>
          <Link to="/shop" className="shrink-0 inline-flex items-center gap-1 text-sm hover:underline">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {collections.map((c, idx) => {
            const isLarge = idx === 0;
            return (
              <Link
                key={c.title}
                to="/shop"
                search={{ category: c.category }}
                className={`group relative overflow-hidden rounded-2xl bg-muted aspect-[4/5] flex flex-col justify-end p-4 sm:p-6 md:p-8 transition hover:-translate-y-1 ${
                  isLarge ? "md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[600px]" : ""
                }`}
              >

                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="relative z-10 text-white">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70">{c.tag}</p>
                  <h3 className="mt-1.5 sm:mt-2 font-display text-lg sm:text-2xl md:text-3xl font-light">{c.title}</h3>
                  <div className="mt-2 sm:mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-medium">
                    Shop now <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 py-10 sm:py-14 md:py-20">
        <div className="flex items-end justify-between mb-6 sm:mb-10 gap-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured</p>
            <h2 className="mt-2 sm:mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">New this season</h2>
          </div>
          <Link to="/shop" className="shrink-0 inline-flex items-center gap-1 text-sm hover:underline">
            All <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductGrid first={8} />
      </section>

      {/* OFFER BANNER */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 py-10 sm:py-14">
        <div className="rounded-2xl sm:rounded-3xl bg-foreground text-background px-6 py-12 sm:px-8 sm:py-16 md:px-16 md:py-20 text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-background/60">Featured Offer</p>
          <h2 className="mt-3 sm:mt-5 font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-tight">
            Pay for the higher.<br />
            <span className="italic">Get the other free.</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-background/70">
            On every frame + lens combination. Two pieces, one price. Ends this month.
          </p>
          <Link
            to="/shop"
            className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-full bg-background text-foreground px-7 py-3.5 text-sm font-medium hover:bg-background/90 transition"
          >
            Shop the offer <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* BRANDS */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 py-10 sm:py-14 md:py-20">
        <p className="text-center text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">The houses we carry</p>
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {brands.map((b) => (
            <Link
              key={b.name}
              to="/shop"
              search={{ brand: b.name }}
              className="group flex min-h-[108px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background px-3 py-5 text-center transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm sm:min-h-[126px]"
            >
              {logoDevToken ? (
                <span className="flex h-10 w-full max-w-[130px] items-center justify-center sm:h-12">
                  <img
                    src={`https://img.logo.dev/${b.domain}?token=${logoDevToken}&size=200&format=png&retina=true&fallback=404`}
                    alt={`${b.name} logo`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </span>
              ) : null}
              <span className="font-display text-sm font-light tracking-wide text-muted-foreground transition group-hover:text-foreground sm:text-base">
                {b.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* STORE VISIT */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">The Store</p>
            <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
              Visit us in Jaipur.
            </h2>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Try on any frame and take home lenses cut to your prescription — all in one visit.
              Rated 4.9 by 700+ happy customers.
            </p>
            <div className="mt-6 sm:mt-8 space-y-2 text-sm">
              <p className="font-medium">B-51, Lal Kothi Shopping Centre</p>
              <p className="text-muted-foreground">Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015</p>
              <p className="text-muted-foreground">Mon–Sat 10:30 AM – 9:00 PM · Sun 10:30 AM – 7:00 PM</p>
            </div>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
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
                +91 98292 30548
              </a>
              <a
                href="tel:+911414112904"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition"
              >
                0141-4112904
              </a>
            </div>
          </div>
          <div className="aspect-[4/3] sm:aspect-square md:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-surface">
            <iframe
              title="Lens Master Jaipur"
              src={MAPS_EMBED_SRC}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </section>
    </>
  );
}
