/**
 * Centralized SEO & Structured Data (Schema.org) configuration for Lens Master.
 */

export const SITE_URL =
  (typeof process !== "undefined" && process.env?.SITE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SITE_URL) ||
  "https://lensmaster.in";

export const SITE_NAME = "Lens Master";
export const BRAND_LEGAL_NAME = "Lens Master by The Swadesh";
export const STORE_PHONE = "+91-98292-30548";
export const STORE_PHONE_LANDLINE = "0141-4112904";
export const STORE_EMAIL = "support@lensmaster.in";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const STORE_ADDRESS = {
  streetAddress: "B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi",
  addressLocality: "Jaipur",
  addressRegion: "Rajasthan",
  postalCode: "302015",
  addressCountry: "IN",
};

export const STORE_GEO = {
  latitude: 26.8824981,
  longitude: 75.8000534,
};

export const STORE_OPENING_HOURS = [
  {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "10:30",
    closes: "21:00",
  },
  {
    dayOfWeek: ["Sunday"],
    opens: "10:30",
    closes: "19:00",
  },
];

export const AGGREGATE_RATING = {
  ratingValue: "4.9",
  reviewCount: "700",
  bestRating: "5",
  worstRating: "1",
};

/**
 * Builds absolute URL from relative path
 */
export function absoluteUrl(path = ""): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generates Schema.org Optician + LocalBusiness structured data
 */
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Optician", "LocalBusiness", "Store"],
    "@id": `${SITE_URL}/#store`,
    name: BRAND_LEGAL_NAME,
    alternateName: ["Lens Master", "Lens Master Jaipur", "The Swadesh Eyewear"],
    description:
      "Jaipur's flagship luxury optical store since 2023. Premium prescription glasses, designer sunglasses (Ray-Ban, Gucci, Oakley, Prada), blue cut lenses and precision computerized eye testing in Lalkothi, Jaipur.",
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    image: [DEFAULT_OG_IMAGE, `${SITE_URL}/favicon.ico`],
    telephone: STORE_PHONE,
    email: STORE_EMAIL,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI, Net Banking",
    address: {
      "@type": "PostalAddress",
      ...STORE_ADDRESS,
    },
    geo: {
      "@type": "GeoCoordinates",
      ...STORE_GEO,
    },
    hasMap: "https://maps.google.com/?cid=12076044738520857329",
    openingHoursSpecification: STORE_OPENING_HOURS.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ...AGGREGATE_RATING,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Jaipur",
      },
      {
        "@type": "AdministrativeArea",
        name: "Rajasthan",
      },
    ],
    sameAs: [],
  };
}

/**
 * Generates Schema.org Organization structured data
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND_LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: STORE_PHONE,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "Hindi"],
    },
  };
}

/**
 * Generates Schema.org WebSite with Sitelinks searchbox
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generates BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Generates FAQPage structured data
 */
export function generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates enhanced Schema.org Product structured data
 */
export function generateProductSchema(p: {
  id?: string;
  title: string;
  description?: string;
  vendor?: string;
  images?: Array<string>;
  price: string | number;
  currencyCode?: string;
  inStock?: boolean;
  handle?: string;
  sku?: string;
}) {
  const currency = p.currencyCode || "INR";
  const numPrice = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
  const canonicalUrl = p.handle ? absoluteUrl(`/product/${p.handle}`) : SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description:
      p.description ||
      `Buy ${p.title} at Lens Master, Jaipur. Premium frames with computerized eye testing and precision fitted lenses.`,
    image: p.images && p.images.length ? p.images : [DEFAULT_OG_IMAGE],
    sku: p.sku || p.handle || p.id || "LM-PRODUCT",
    mpn: p.sku || p.handle || p.id || "LM-PRODUCT",
    brand: {
      "@type": "Brand",
      name: p.vendor || "Lens Master",
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: currency,
      price: numPrice.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: p.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: BRAND_LEGAL_NAME,
      },
      priceValidUntil: "2027-12-31",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ...AGGREGATE_RATING,
    },
  };
}
