import { X, ArrowUpDown, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { fetchProducts, isHouseBrand, type ShopifyProduct } from "@/lib/shopify";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
export type Category = "" | "sunglasses" | "contacts" | "blue-light" | "kids" | "sports" | "prescription";

export interface Filters {
  category: Category;
  shape: string;
  material: string;
  gender: string;
  brand: string;
  lensType: string;
  priceMax: number;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  category: "",
  shape: "",
  material: "",
  gender: "",
  brand: "",
  lensType: "",
  priceMax: 0,
  sort: "featured",
};

const SHAPES = ["Aviator", "Wayfarer", "Round", "Rimless", "Cat-Eye", "Square"];
const MATERIALS = ["Titanium", "Acetate", "Metal", "TR90"];
const GENDERS = ["Men", "Women", "Unisex", "Kids"];
const LENS_TYPES = ["Daily", "Monthly", "Yearly", "Colored", "Accessories"];
const PRICE_STOPS = [1500, 3000, 6000, 12000, 20000];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name-asc", label: "Name: A–Z" },
  { id: "name-desc", label: "Name: Z–A" },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "", label: "All" },
  { id: "prescription", label: "Prescription" },
  { id: "sunglasses", label: "Sunglasses" },
  { id: "blue-light", label: "Blue Light" },
  { id: "contacts", label: "Contact Lenses" },
  { id: "kids", label: "Kids" },
  { id: "sports", label: "Sports" },
];

/** Which filter rows make sense for each category. */
function rowsFor(category: Category) {
  if (category === "contacts") return { lensType: true, shape: false, material: false, gender: false, brand: true, price: true };
  return { lensType: false, shape: true, material: true, gender: true, brand: true, price: true };
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}


export function ShopFilters({ filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products", 48, null],
    queryFn: () => fetchProducts(48),
  });

  const rows = rowsFor(filters.category);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      const v = (p.node.vendor ?? "").trim();
      if (v && !isHouseBrand(v)) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  const setF = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...filters, [k]: filters[k] === v ? DEFAULT_FILTERS[k] : v });

  const activeCount =
    Number(filters.category !== "") +
    Number(filters.shape !== "") +
    Number(filters.material !== "") +
    Number(filters.gender !== "") +
    Number(filters.brand !== "") +
    Number(filters.lensType !== "") +
    Number(filters.priceMax > 0);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.id === filters.sort)?.label ?? "Sort";


  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setShowFilters((v) => !v);
            setShowSort(false);
          }}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
            showFilters ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
          )}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background/20 px-1.5 text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowSort((v) => !v);
              setShowFilters(false);
            }}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
              showSort ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
            )}
            aria-expanded={showSort}
            aria-haspopup="listbox"
          >
            <ArrowUpDown className="h-4 w-4" />
            {activeSortLabel}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showSort && "rotate-180")} />
          </button>

          {showSort && (
            <div className="absolute left-0 top-full z-20 mt-2 min-w-[200px] rounded-2xl border border-border bg-background p-2 shadow-xl">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange({ ...filters, sort: o.id });
                    setShowSort(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                    filters.sort === o.id ? "bg-foreground text-background" : "hover:bg-muted"
                  )}
                  role="option"
                  aria-selected={filters.sort === o.id}
                >
                  {o.label}
                  {filters.sort === o.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <FilterRow label="Category" options={CATEGORIES.map((c) => c.label)} value={CATEGORIES.find((c) => c.id === filters.category)?.label ?? ""} onSelect={(v) => {
            const cat = CATEGORIES.find((c) => c.label === v)?.id ?? "";
            // Reset filters that don't apply to the newly picked category.
            onChange({ ...filters, category: cat, shape: "", material: "", gender: "", lensType: "" });
          }} />

          {rows.lensType && (
            <FilterRow label="Lens type" options={LENS_TYPES} value={filters.lensType} onSelect={(v) => setF("lensType", v)} />
          )}
          {rows.shape && <FilterRow label="Shape" options={SHAPES} value={filters.shape} onSelect={(v) => setF("shape", v)} />}
          {rows.material && <FilterRow label="Material" options={MATERIALS} value={filters.material} onSelect={(v) => setF("material", v)} />}
          {rows.gender && <FilterRow label="Gender" options={GENDERS} value={filters.gender} onSelect={(v) => setF("gender", v)} />}
          {rows.brand && brands.length > 0 && (
            <FilterRow label="Brand" options={brands} value={filters.brand} onSelect={(v) => setF("brand", v)} />
          )}
          {rows.price && (
            <FilterRow
              label="Under"
              options={PRICE_STOPS.map((n) => `₹${n.toLocaleString("en-IN")}`)}
              value={filters.priceMax ? `₹${filters.priceMax.toLocaleString("en-IN")}` : ""}
              onSelect={(v) => {
                const n = parseInt(v.replace(/[^\d]/g, ""), 10);
                setF("priceMax", filters.priceMax === n ? 0 : n);
              }}
            />
          )}

        </div>
      )}
    </div>
  );
}

function FilterRow({ label, options, value, onSelect }: { label: string; options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(o)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition",
              value === o
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/40"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

const CATEGORY_MATCHERS: Record<Exclude<Category, "">, (hay: string) => boolean> = {
  sunglasses: (h) => /sunglass|\bsun\b|polari/.test(h),
  contacts: (h) => /contact\s*lens|contact-lens|\bcontacts?\b|solution|accessor/.test(h),
  "blue-light": (h) => /blue[-\s]?(cut|light)|screen|anti[-\s]?glare/.test(h),
  kids: (h) => /\bkids?\b|child|junior/.test(h),
  sports: (h) => /\bsport|athletic|performance/.test(h),
  // Prescription/optical frames: any eyewear frame that isn't sunglasses or contacts.
  prescription: (h) =>
    /prescription|\brx\b|powered|reading|optical|eyeglass|frame|blue[-\s]?(cut|light)/.test(h) &&
    !/contact\s*lens|solution/.test(h),

};


const LENS_TYPE_MATCHERS: Record<string, (hay: string) => boolean> = {
  daily: (h) => /\bdail(y|ies)\b|1[-\s]?day|one[-\s]?day|disposable/.test(h),
  monthly: (h) => /\bmonthl?y\b|30[-\s]?day/.test(h),
  yearly: (h) => /\byearly\b|annual|12[-\s]?month/.test(h),
  colored: (h) => /colou?r/.test(h),
  accessories: (h) => /solution|case|accessor|tweez|drops/.test(h),
};

export function applyFilters(
  products: ShopifyProduct[],
  f: Filters,
  options?: { excludeHouseBrands?: boolean },
): ShopifyProduct[] {
  const filtered = products.filter((p) => {
    if (options?.excludeHouseBrands && isHouseBrand(p.node.vendor)) {
      return false;
    }
    const hay = `${p.node.title} ${p.node.productType ?? ""} ${p.node.vendor ?? ""} ${p.node.tags.join(" ")}`.toLowerCase();
    if (f.category) {
      const match = CATEGORY_MATCHERS[f.category];
      if (!match(hay)) return false;
    }
    if (f.brand && (p.node.vendor ?? "").toLowerCase() !== f.brand.toLowerCase()) return false;
    if (f.lensType) {
      const match = LENS_TYPE_MATCHERS[f.lensType.toLowerCase()];
      if (match && !match(hay)) return false;
    }
    if (f.shape && !hay.includes(f.shape.toLowerCase())) return false;
    if (f.material && !hay.includes(f.material.toLowerCase())) return false;
    if (f.gender && !hay.includes(f.gender.toLowerCase())) return false;

    if (f.priceMax > 0) {
      const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
      if (price > f.priceMax) return false;
    }
    return true;
  });

  const priceOf = (p: ShopifyProduct) => parseFloat(p.node.priceRange.minVariantPrice.amount);
  const sorted = [...filtered];
  switch (f.sort) {
    case "price-asc":
      sorted.sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "name-asc":
      sorted.sort((a, b) => a.node.title.localeCompare(b.node.title));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.node.title.localeCompare(a.node.title));
      break;
    default:
      break;
  }
  return sorted;
}
