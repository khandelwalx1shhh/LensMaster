import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Car,
  Navigation,
  MessageCircle,
  Calendar,
  Star,
  ShieldCheck,
  Eye,
  Sparkles,
  Award,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
  Send,
  Building2,
  BadgeCheck,
} from "lucide-react";
import storeInteriorImg from "@/assets/store/store-interior.jpg";
import eyeTestingLabImg from "@/assets/store/eye-testing-lab.jpg";
import tryOnLoungeImg from "@/assets/store/try-on-lounge.jpg";
import { MAPS_DIRECTIONS_URL, MAPS_EMBED_SRC } from "@/lib/maps";
import {
  SITE_URL,
  absoluteUrl,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
  DEFAULT_OG_IMAGE,
  STORE_PHONE,
  STORE_PHONE_LANDLINE,
  STORE_ADDRESS,
  STORE_OPENING_HOURS,
} from "@/lib/seo";

const NEARBY_AREAS = [
  { name: "Lalkothi", distance: "0 km (Store Location)", driveTime: "At location" },
  { name: "Tonk Road / Nagar Nigam", distance: "0.5 km", driveTime: "2 mins" },
  { name: "Bapu Nagar", distance: "1.2 km", driveTime: "4 mins" },
  { name: "Gandhi Nagar Railway Station", distance: "2.1 km", driveTime: "6 mins" },
  { name: "C-Scheme / Statue Circle", distance: "2.8 km", driveTime: "7 mins" },
  { name: "Civil Lines", distance: "3.5 km", driveTime: "8 mins" },
  { name: "Raja Park / Tilak Nagar", distance: "3.8 km", driveTime: "9 mins" },
  { name: "Malviya Nagar / GT", distance: "4.2 km", driveTime: "10 mins" },
  { name: "Gopalpura Bypass", distance: "4.5 km", driveTime: "11 mins" },
  { name: "Mansarovar", distance: "5.5 km", driveTime: "13 mins" },
  { name: "MI Road / Pink City", distance: "4.8 km", driveTime: "12 mins" },
  { name: "Vaishali Nagar", distance: "8.5 km", driveTime: "18 mins" },
];

const SERVICES = [
  {
    icon: Eye,
    title: "Free Computerized Eye Testing",
    desc: "State-of-the-art auto-refractometers and certified optometrist consultation for precision optical accuracy.",
  },
  {
    icon: Clock,
    title: "1-Hour Lens Fitting Lab",
    desc: "In-house optical laboratory cuts, fits, and polishes single-vision and blue-cut lenses in under 60 minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Authorized Luxury Brands",
    desc: "Official retailer for Ray-Ban, Gucci, Oakley, Prada, Tom Ford, Carrera, and Vogue with genuine warranty.",
  },
  {
    icon: Sparkles,
    title: "Blue Cut Screen Protection",
    desc: "High-index UV420 lenses that block harmful digital blue light from laptops and smartphones. Special 2 @ ₹1,199 offer.",
  },
  {
    icon: Award,
    title: "Progressive & Bifocal Specialist",
    desc: "Custom corridor measurement and laser-accurate pupil distance alignment for seamless multifocal vision.",
  },
  {
    icon: BadgeCheck,
    title: "Free Ultrasonic Cleaning & Tuning",
    desc: "Complimentary frame alignment, nose-pad replacements, screw tightening, and deep ultrasonic sanitization.",
  },
];

const DIRECTIONS_GUIDE = [
  {
    from: "From Tonk Road / Nagar Nigam",
    guide: "Turn into Laxmi Colony road near Lal Kothi Sabzi Mandi. We are located at B-51 inside Lal Kothi Shopping Centre.",
  },
  {
    from: "From C-Scheme / Statue Circle",
    guide: "Head south via Jan Path / Bhagwan Das Road onto Tonk Road. Take the right turn into Lal Kothi Shopping Centre opposite Nagar Nigam.",
  },
  {
    from: "From Malviya Nagar & Airport",
    guide: "Drive north along JLN Marg or Tonk Road towards Lalkothi. Take the left into Laxmi Colony Lal Kothi Shopping Centre.",
  },
  {
    from: "From Mansarovar & Gopalpura",
    guide: "Take Gopalpura Bypass to Tonk Road heading north. In 8 minutes you will reach Lal Kothi Shopping Centre on your left.",
  },
];

const FAQS = [
  {
    question: "Where is Lens Master located in Jaipur and what are your timings?",
    answer:
      "Lens Master is located at B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015. We are open Monday to Saturday from 10:30 AM to 9:00 PM, and Sunday from 10:30 AM to 7:00 PM.",
  },
  {
    question: "Is free parking available at Lens Master Jaipur?",
    answer:
      "Yes! There is dedicated, free parking space directly in front of Lal Kothi Shopping Centre for both two-wheelers and four-wheelers with easy drive-in access.",
  },
  {
    question: "How do I book an appointment for eye testing in Jaipur?",
    answer:
      "You can book directly using the online appointment form below or by WhatsApp/Call at +91 98292 30548. Walk-ins are also welcome throughout the day.",
  },
  {
    question: "How quickly can I get my prescription glasses made in Jaipur?",
    answer:
      "For standard single-vision and blue-cut lenses, we offer our signature 1-Hour Lens Fitting in-store. Custom progressive or high-index lenses are delivered in 24–48 hours.",
  },
  {
    question: "Are you an authorized retailer of Ray-Ban and Gucci in Jaipur?",
    answer:
      "Yes. We are an authorized dealer in Jaipur offering 100% authentic designer eyewear from Ray-Ban, Gucci, Oakley, Prada, Tom Ford, Carrera, and Vogue with original authenticity certificates.",
  },
  {
    question: "What is your Blue Cut glasses promotional pricing in Jaipur?",
    answer:
      "We offer our flagship 2 Blue Cut Glasses for ₹1,199 bundle (1 frame @ ₹849). For powers above ±4.00, high-power lenses are 1 @ ₹1,049 or 2 @ ₹1,599.",
  },
];

export const Route = createFileRoute("/lens-master-jaipur")({
  head: () => {
    const canonical = absoluteUrl("/lens-master-jaipur");
    const title = "Lens Master Jaipur — Best Luxury Optical Store in Lalkothi (4.9★)";
    const description =
      "Lens Master by The Swadesh: Jaipur's flagship optical store at B-51 Lal Kothi Shopping Centre. 4.9★ on Google (700+ reviews). Free eye checkup, 1-hour fitting, Ray-Ban, Gucci & Blue Cut glasses.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content:
            "lens master jaipur, optical store in jaipur, best optical shop in jaipur, eyeglasses in jaipur, ray-ban store jaipur, prescription glasses jaipur, blue cut glasses jaipur, opticians in jaipur, lalkothi optical shop",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "place" },
        { property: "og:image", content: DEFAULT_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "geo.placename", content: "Jaipur" },
        { name: "geo.region", content: "IN-RJ" },
        { name: "geo.position", content: "26.882498;75.800053" },
        { name: "ICBM", content: "26.882498, 75.800053" },
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
              { name: "Lens Master Jaipur", path: "/lens-master-jaipur" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(generateFaqSchema(FAQS)),
        },
      ],
    };
  },
  component: LensMasterJaipurPage,
});

function LensMasterJaipurPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("Morning (11:00 AM - 2:00 PM)");
  const [bookingService, setBookingService] = useState("Free Eye Checkup & Vision Test");
  const [submitted, setSubmitted] = useState(false);

  function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hello Lens Master Jaipur! I would like to book an in-store appointment:\n\n• Name: ${bookingName}\n• Phone: ${bookingPhone}\n• Date: ${bookingDate || "Today"}\n• Time: ${bookingTime}\n• Service: ${bookingService}`,
    );
    window.open(`https://wa.me/919829230548?text=${text}`, "_blank");
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground flex items-center gap-2">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Lens Master Jaipur Flagship</span>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-foreground text-background p-6 sm:p-10 md:p-16">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3.5 py-1 text-xs font-medium backdrop-blur-sm text-gold">
              <Award className="h-3.5 w-3.5" />
              Rated 4.9★ on Google (700+ Jaipur Reviews)
            </div>

            <h1 className="mt-4 font-display text-3xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.08]">
              Lens Master Jaipur
            </h1>
            <p className="text-lg sm:text-xl font-light text-gold mt-1">
              Flagship Luxury Optical Store &amp; Eye Clinic
            </p>

            <p className="mt-4 text-sm sm:text-base text-background/80 leading-relaxed max-w-xl">
              Experience the pinnacle of eyewear in Jaipur. From precision computerized eye testing and 1-hour express lens fitting to authentic luxury collections from <strong>Ray-Ban, Gucci, Oakley &amp; Prada</strong>.
            </p>

            {/* Quick Contact & Directions Bar */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer external"
                className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3.5 text-sm font-semibold hover:bg-background/90 transition shadow-sm"
              >
                <Navigation className="h-4 w-4" /> Get Directions
              </a>
              <a
                href="https://wa.me/919829230548?text=Hello%20Lens%20Master%20Jaipur%2C%20I%20have%20an%20inquiry%20regarding%20eyewear"
                target="_blank"
                rel="noopener noreferrer external"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-6 py-3.5 text-sm font-medium hover:bg-emerald-500 transition"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
              <a
                href="tel:+919829230548"
                className="inline-flex items-center gap-2 rounded-full border border-background/30 px-6 py-3.5 text-sm font-medium hover:bg-background/10 transition"
              >
                <Phone className="h-4 w-4" /> Call Store
              </a>
            </div>

            {/* Exact NAP Display */}
            <div className="mt-8 pt-6 border-t border-background/15 space-y-2 text-xs sm:text-sm text-background/70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                <span>
                  <strong>Name:</strong> Lens Master by The Swadesh<br />
                  <strong>Address:</strong> B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold shrink-0" />
                <span><strong>Hours:</strong> Mon–Sat 10:30 AM – 9:00 PM · Sun 10:30 AM – 7:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-gold shrink-0" />
                <span><strong>Parking:</strong> Free on-site parking for cars and two-wheelers in front of the showroom</span>
              </div>
            </div>
          </div>

          {/* Featured Interior Photo Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-background/20 shadow-2xl group">
              <img
                src={storeInteriorImg}
                alt="Lens Master Jaipur Luxury Optical Store Interior"
                className="w-full h-auto aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
                <div className="text-white">
                  <p className="text-xs uppercase tracking-wider text-gold font-semibold">Flagship Showroom</p>
                  <p className="text-sm font-medium">B-51 Lal Kothi Shopping Centre, Jaipur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORE PHOTOS GALLERY */}
      <section className="mt-14 sm:mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Store Tour</p>
            <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Inside Lens Master Jaipur</h2>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Lalkothi, Jaipur</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={storeInteriorImg}
                alt="Lens Master Jaipur Luxury Eyewear Boutique Interior"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-display text-base font-semibold">Designer Frame Boutique</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Over 1,500+ curated frames from Ray-Ban, Gucci, Prada, Oakley, and boutique Indian designers.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={eyeTestingLabImg}
                alt="Computerized Eye Testing Clinic Lens Master Jaipur"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-display text-base font-semibold">Computerized Eye Testing Lab</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Zero-error digital refraction and comprehensive prescription analysis by certified optometrists.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={tryOnLoungeImg}
                alt="Eyewear Styling and Try-On Lounge Lens Master Jaipur"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-display text-base font-semibold">Personal Styling Lounge</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Relaxed try-on counters with face-shape analysis and custom frame fitting consultations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="mt-14 sm:mt-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Comprehensive Eye Care</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Services at Lens Master Jaipur</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            From computerized diagnostics to express fitting, we take care of your vision with uncompromising precision.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE APPOINTMENT BOOKING & CONTACT */}
      <section id="book-appointment" className="mt-14 sm:mt-20 grid lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 text-gold px-3 py-1 text-xs font-semibold">
              <Calendar className="h-3.5 w-3.5" /> Book Online
            </div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-light">Book Free In-Store Consultation</h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Schedule your free computerized eye examination or private frame styling session at our Jaipur showroom.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <h3 className="font-semibold text-base">Booking Request Sent via WhatsApp!</h3>
                <p className="text-xs mt-1">
                  Our Jaipur store team will confirm your slot shortly. We look forward to seeing you at Lalkothi!
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs font-medium underline"
                >
                  Book another slot
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9829X XXXXX"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Preferred Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Preferred Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option>Morning (11:00 AM – 2:00 PM)</option>
                      <option>Afternoon (2:00 PM – 5:00 PM)</option>
                      <option>Evening (5:00 PM – 8:30 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Service Required</label>
                  <select
                    value={bookingService}
                    onChange={(e) => setBookingService(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option>Free Eye Checkup &amp; Vision Test</option>
                    <option>Ray-Ban &amp; Designer Eyewear Consultation</option>
                    <option>Blue Cut Glasses 2 for ₹1,199 Offer</option>
                    <option>Progressive / Bifocal Lens Fitting</option>
                    <option>Frame Adjustment &amp; Deep Cleaning</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-foreground/90 transition shadow-sm"
                >
                  <Send className="h-4 w-4" /> Confirm Appointment on WhatsApp
                </button>
              </form>
            )}
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            Zero booking fees. Instant WhatsApp confirmation. Walk-ins always welcome.
          </p>
        </div>

        {/* Live Map & Direction Summary */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gold" /> Store Location Details
            </h3>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Store:</strong> Lens Master by The Swadesh
              </p>
              <p>
                <strong className="text-foreground">Address:</strong> B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015
              </p>
              <p>
                <strong className="text-foreground">Direct Phones:</strong>{" "}
                <a href="tel:+919829230548" className="hover:underline text-foreground font-medium">+91 98292 30548</a> ·{" "}
                <a href="tel:+911414112904" className="hover:underline text-foreground font-medium">0141-4112904</a>
              </p>
              <p>
                <strong className="text-foreground">Email:</strong>{" "}
                <a href="mailto:support@lensmaster.in" className="hover:underline text-foreground font-medium">support@lensmaster.in</a>
              </p>
              <p>
                <strong className="text-foreground">Parking:</strong> Free open parking for cars and two-wheelers right at our storefront.
              </p>
            </div>
          </div>

          <div className="mt-6 aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-inner">
            <iframe
              title="Lens Master Jaipur Map"
              src={MAPS_EMBED_SRC}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </section>

      {/* DIRECTIONS GUIDE */}
      <section className="mt-14 sm:mt-20">
        <div className="mb-6">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Easy Access</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Driving Directions to Lalkothi</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DIRECTIONS_GUIDE.map((d, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
                <Navigation className="h-4 w-4 text-gold shrink-0" />
                {d.from}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {d.guide}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NEARBY AREAS SERVED */}
      <section className="mt-14 sm:mt-20 rounded-3xl border border-border bg-muted/20 p-6 sm:p-10">
        <div className="max-w-2xl mb-8">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Local Jaipur Coverage</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Jaipur Neighborhoods We Serve</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Our centrally located Lalkothi showroom is within a 10 to 15 minute drive from almost all major residential and commercial hubs in Jaipur.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {NEARBY_AREAS.map((area, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
              <p className="font-medium text-xs sm:text-sm text-foreground">{area.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{area.distance} · {area.driveTime}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GOOGLE REVIEWS SHOWCASE */}
      <section className="mt-14 sm:mt-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-1 text-gold mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-light">4.9★ from 700+ Google Reviews</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            See why customers rank Lens Master as the #1 optical shop in Jaipur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-gold mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "Hands down the best optical store in Jaipur. The computerized eye test was fast and accurate, and they had my Ray-Ban sunglasses fitted with prescription lenses in 45 minutes!"
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Vikramaditya S.</span>
              <span className="text-muted-foreground">Google Review</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-gold mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "Got 2 pairs of Blue Cut glasses for ₹1,199. Super lightweight frames and great quality coating. Friendly staff in Lalkothi and very reasonable prices."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Ananya Sharma</span>
              <span className="text-muted-foreground">Google Review</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-gold mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "Authentic designer eyewear collection that you normally only see in metropolitan cities. The opticians took great care in fitting my progressive lenses."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Rajat Goyal</span>
              <span className="text-muted-foreground">Google Review</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section className="mt-14 sm:mt-20 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Help &amp; Answers</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-light">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
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
