import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Clock,
  ArrowUpRight,
  Star,
  ShieldCheck,
  Eye,
  Sparkles,
  Award,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { MAPS_DIRECTIONS_URL, MAPS_EMBED_SRC } from "@/lib/maps";
import {
  absoluteUrl,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";

const LOCAL_FAQS = [
  {
    question: "Where is Lens Master located in Jaipur?",
    answer:
      "Lens Master is centrally located at B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015. We are easily accessible from Tonk Road, C-Scheme, Malviya Nagar, and Mansarovar.",
  },
  {
    question: "Do you offer computerized eye testing in Jaipur?",
    answer:
      "Yes! We provide complimentary, comprehensive computerized eye checkups conducted by certified optometrists using state-of-the-art diagnostic equipment to ensure 100% prescription accuracy.",
  },
  {
    question: "Can I get 1-hour prescription lens fitting in Jaipur?",
    answer:
      "Yes, we have an in-house precision lens laboratory in Jaipur that cuts and fits standard single-vision and Blue Cut prescription lenses in under an hour.",
  },
  {
    question: "Are you an authorized dealer of Ray-Ban and luxury eyewear in Jaipur?",
    answer:
      "Yes, Lens Master by The Swadesh is an authorized retailer for Ray-Ban, Gucci, Oakley, Prada, Tom Ford, Carrera, Vogue, and Dolce & Gabbana with genuine manufacturer warranties.",
  },
  {
    question: "What are the prices for Blue Cut glasses in Jaipur?",
    answer:
      "We offer a popular bundle: 2 eyeglasses with anti-glare Blue Cut lenses for ₹1,199 (1 pair at ₹849). For powers above ±4.00, high-index lenses are priced at 1 @ ₹1,049 or 2 @ ₹1,599.",
  },
  {
    question: "What are your store timings in Jaipur?",
    answer:
      "Our Jaipur store is open Monday through Saturday from 10:30 AM to 9:00 PM, and on Sunday from 10:30 AM to 7:00 PM.",
  },
];

export const Route = createFileRoute("/opticians-jaipur")({
  head: () => {
    const canonical = absoluteUrl("/opticians-jaipur");
    const title = "Best Optical Store in Jaipur — Eyeglasses, Ray-Ban & Lenses | Lens Master";
    const description =
      "Jaipur's top-rated optical shop (4.9★). Shop designer eyeglasses, sunglasses & blue cut glasses from Ray-Ban, Gucci & Prada. Free eye testing & 1-hour fitting in Lalkothi, Jaipur.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content:
            "optical store in jaipur, best optical shop in jaipur, eyeglasses in jaipur, ray-ban store jaipur, prescription glasses jaipur, blue cut glasses jaipur, opticians in jaipur, spectacles shop lalkothi jaipur, sunglasses jaipur",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        { property: "og:image", content: DEFAULT_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "geo.placename", content: "Jaipur" },
        { name: "geo.region", content: "IN-RJ" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(generateLocalBusinessSchema()),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            generateBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Opticians in Jaipur", path: "/opticians-jaipur" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(generateFaqSchema(LOCAL_FAQS)),
        },
      ],
    };
  },
  component: OpticiansJaipurPage,
});

const REVIEWS = [
  {
    author: "Rohit Sharma",
    date: "Recent Google Review",
    rating: 5,
    text: "Best optical shop in Jaipur without a doubt! Huge collection of Ray-Ban and luxury frames. The computerized eye test was very thorough and lenses were fitted within 45 minutes.",
  },
  {
    author: "Priya Mathur",
    date: "Recent Google Review",
    rating: 5,
    text: "Got the 2 Blue Cut glasses offer for ₹1,199. Great build quality, super stylish, and perfect screen protection. Highly recommend Lens Master in Lalkothi.",
  },
  {
    author: "Amit Khandelwal",
    date: "Recent Google Review",
    rating: 5,
    text: "Courteous staff, genuine designer brands, and reasonable pricing. Their optometrist helped me find the exact prescription fit for my progressive lenses.",
  },
];

function OpticiansJaipurPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24">
      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground flex items-center gap-2">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Opticians in Jaipur</span>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-foreground text-background p-6 sm:p-10 md:p-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3.5 py-1 text-xs font-medium backdrop-blur-sm text-gold">
            <Award className="h-3.5 w-3.5" />
            Jaipur's #1 Rated Optical Store · 4.9★ on Google
          </div>

          <h1 className="mt-5 font-display text-3xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.08]">
            Premium Eyewear &amp; Optical Store in Jaipur
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-background/80 leading-relaxed max-w-2xl">
            Welcome to <strong>Lens Master by The Swadesh</strong> in Lalkothi, Jaipur. Discover 100% authentic designer eyeglasses, polarized sunglasses, Blue Cut computer glasses, and computerized precision eye testing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer external"
              className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-7 py-3.5 text-sm font-semibold hover:bg-background/90 transition shadow-sm"
            >
              Get Store Directions <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-background/30 px-7 py-3.5 text-sm font-medium hover:bg-background/10 transition"
            >
              Browse Online Catalog <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK HIGHLIGHTS */}
      <section className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
            <Eye className="h-5 w-5" />
          </div>
          <h2 className="font-display text-lg font-semibold">Free Eye Testing in Jaipur</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Advanced auto-refractometer checkups and expert optometrist consultations with zero wait time.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="font-display text-lg font-semibold">1-Hour Lens Fitting</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            In-house computerized edging lab. Walk in with your prescription and leave with custom glasses in 60 minutes.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="font-display text-lg font-semibold">100% Authentic Brands</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Authorized retailer for Ray-Ban, Gucci, Prada, Oakley, Tom Ford, Carrera, and Vogue eyewear.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-display text-lg font-semibold">Blue Cut Offer: 2 @ ₹1,199</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Premium anti-glare, UV420 blue-light blocking glasses engineered for screen relief.
          </p>
        </div>
      </section>

      {/* POPULAR SEARCH CATEGORIES */}
      <section className="mt-14 sm:mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Jaipur Eyewear</p>
            <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Popular Eyewear Collections in Jaipur</h2>
          </div>
          <Link to="/shop" className="text-sm font-medium hover:underline inline-flex items-center gap-1">
            View All <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/shop"
            search={{ offer: "blue-cut" }}
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Special Offer</span>
            <h3 className="mt-2 font-display text-base sm:text-lg">Blue Cut Glasses Jaipur</h3>
            <p className="mt-1 text-xs text-muted-foreground">2 for ₹1,199 with high-clarity coating.</p>
          </Link>

          <Link
            to="/shop"
            search={{ brand: "Ray-Ban" }}
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Designer</span>
            <h3 className="mt-2 font-display text-base sm:text-lg">Ray-Ban Store Jaipur</h3>
            <p className="mt-1 text-xs text-muted-foreground">Aviators, Wayfarers, Clubmasters &amp; Optics.</p>
          </Link>

          <Link
            to="/shop"
            search={{ category: "prescription" }}
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Clarity</span>
            <h3 className="mt-2 font-display text-base sm:text-lg">Prescription Glasses</h3>
            <p className="mt-1 text-xs text-muted-foreground">Single vision, bifocal &amp; progressive lenses.</p>
          </Link>

          <Link
            to="/shop"
            search={{ category: "sunglasses" }}
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UV Protection</span>
            <h3 className="mt-2 font-display text-base sm:text-lg">Sunglasses in Jaipur</h3>
            <p className="mt-1 text-xs text-muted-foreground">Polarized and 100% UV400 luxury shades.</p>
          </Link>
        </div>
      </section>

      {/* STORE LOCATION & MAP */}
      <section className="mt-14 sm:mt-20 grid lg:grid-cols-2 gap-8 sm:gap-12 items-center rounded-3xl border border-border bg-muted/20 p-6 sm:p-10">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Visit Us in Lalkothi</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Jaipur Optical Showroom</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Conveniently located near Tonk Road and Gandhi Nagar railway station. Ample parking and friendly certified opticians ready to assist you.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <div>
                <strong>B-51, Lal Kothi Shopping Centre</strong>
                <p className="text-muted-foreground">Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gold shrink-0" />
              <div>
                <span>Mon–Sat 10:30 AM – 9:00 PM · Sun 10:30 AM – 7:00 PM</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gold shrink-0" />
              <div className="flex gap-4">
                <a href="tel:+919829230548" className="hover:underline font-medium">+91 98292 30548</a>
                <a href="tel:+911414112904" className="hover:underline font-medium">0141-4112904</a>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer external"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:bg-foreground/90 transition"
            >
              Get Directions <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+919829230548"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition"
            >
              Call Store
            </a>
          </div>
        </div>

        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface border border-border shadow-inner">
          <iframe
            title="Lens Master Optical Store Jaipur Map"
            src={MAPS_EMBED_SRC}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mt-14 sm:mt-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-1 text-gold mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-light">Rated 4.9 by 700+ Jaipur Customers</h2>
          <p className="mt-2 text-sm text-muted-foreground">Real reviews from Google for our Lalkothi optical store.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-gold mb-3">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{r.text}"</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{r.author}</span>
                <span className="text-muted-foreground">{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCAL FAQ */}
      <section className="mt-14 sm:mt-20 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Got Questions?</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {LOCAL_FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="rounded-2xl border border-border bg-card overflow-hidden transition">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium text-sm sm:text-base hover:text-foreground/80"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
