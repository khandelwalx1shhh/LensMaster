import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { fetchSearchResults, formatPrice } from "@/lib/shopify";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: Props) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounce so we don't hit the backend on every keystroke.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const term = debounced;
  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["catalogue-search", term],
    queryFn: () => fetchSearchResults(term, 50),
    enabled: open && term.length >= 2,
    staleTime: 60 * 1000,
  });

  // Recent searches, stored locally — no product or customer data.
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("lm-recent-searches");
      setRecent(raw ? (JSON.parse(raw) as string[]).slice(0, 5) : []);
    } catch {
      setRecent([]);
    }
  }, [open]);

  const rememberSearch = (value: string) => {
    const v = value.trim();
    if (v.length < 2) return;
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem("lm-recent-searches", JSON.stringify(next));
    } catch {
      /* storage unavailable — recent searches are best-effort */
    }
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 sm:pt-20" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search frames, brands, styles…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            recent.length ? (
              <div className="p-5">
                <p className="pb-3 text-xs uppercase tracking-wider text-muted-foreground">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQ(r)}
                      className="rounded-full border border-border px-3 py-1.5 text-sm transition hover:border-foreground/40"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </div>
            )
          ) : isError ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Search is unavailable right now. Please try again in a moment.
            </div>
          ) : isFetching || term !== q.trim() ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No matches for "{term}". Try a brand like Ray-Ban or a style like Aviator.
            </div>
          ) : (
            <>
            <ul className="divide-y divide-border">
              {results.map((p) => {
                const img = p.node.images.edges[0]?.node;
                return (
                  <li key={p.node.id}>
                    <Link
                      to="/product/$handle"
                      params={{ handle: p.node.handle }}
                      onClick={() => { rememberSearch(term); onClose(); }}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition"
                    >
                      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-surface">
                        {img && <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {p.node.vendor && <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.node.vendor}</p>}
                        <p className="text-sm font-medium truncate">{p.node.title}</p>
                        {p.node.productType && (
                          <p className="text-[11px] text-muted-foreground truncate">{p.node.productType}</p>
                        )}
                      </div>
                      <p className="text-sm font-medium tabular-nums shrink-0">
                        {formatPrice(p.node.priceRange.minVariantPrice.amount, p.node.priceRange.minVariantPrice.currencyCode)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
