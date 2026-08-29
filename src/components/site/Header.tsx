import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { AnnouncementBar } from "./AnnouncementBar";
import { SearchDialog } from "./SearchDialog";

const nav: Array<{ label: string; to: string; search?: Record<string, string> }> = [
  { label: "Shop", to: "/shop" },
  { label: "Frames", to: "/shop", search: { category: "prescription" } },
  { label: "Sunglasses", to: "/shop", search: { category: "sunglasses" } },
  { label: "Contact Lenses", to: "/shop", search: { category: "contacts" } },
  { label: "Blue Light", to: "/shop", search: { category: "blue-light" } },
  { label: "Brands", to: "/brands" },
  { label: "Stores", to: "/stores" },
  { label: "About", to: "/about" },
];

function useDesktopNavActive() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search as unknown as string);
  const category = params.get("category");

  return useMemo(() => {
    const active = (label: string) => {
      if (pathname === "/") return label === "Shop";
      if (pathname === "/brands") return label === "Brands";
      if (pathname === "/stores") return label === "Stores";
      if (pathname === "/about") return label === "About";
      if (pathname === "/shop") {
        if (label === "Shop" && !category) return true;
        if (label === "Frames" && category === "prescription") return true;
        if (label === "Sunglasses" && category === "sunglasses") return true;
        if (label === "Contact Lenses" && category === "contacts") return true;
        if (label === "Blue Light" && category === "blue-light") return true;
      }
      return false;
    };
    return active;
  }, [pathname, category]);
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isDesktopNavActive = useDesktopNavActive();
  const totalItems = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const setOpen = useCartStore((s) => s.setOpen);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <div
        className={`transition-all duration-300 bg-background/95 backdrop-blur-xl border-b border-border ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="mx-auto grid h-14 sm:h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 md:px-8">
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 rounded-full hover:bg-muted transition"
          >
            {menuOpen ? <X className="h-[20px] w-[20px]" /> : <Menu className="h-[20px] w-[20px]" />}
          </button>

          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-baseline gap-1 justify-self-center lg:justify-self-start">
            <span className="font-display text-lg sm:text-xl font-semibold tracking-tight">LENS</span>
            <span className="font-display text-lg sm:text-xl font-light tracking-[0.2em] text-muted-foreground">MASTER</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 justify-self-center col-start-2">
            {nav.slice(0, 6).map((n) => {
              const isActive = isDesktopNavActive(n.label);
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  search={n.search ?? {}}
                  className={`relative text-[15px] transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  {n.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#D4AF37]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 justify-self-end">
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="p-2 rounded-full hover:bg-muted transition">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              aria-label="Cart"
              onClick={() => setOpen(true)}
              className="relative p-2 -mr-2 sm:mr-0 rounded-full hover:bg-muted transition"
            >
              <ShoppingBag className="h-[20px] w-[20px] sm:h-[18px] sm:w-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center tabular-nums">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col">
              {nav.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  search={n.search ?? {}}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-base font-medium border-b border-border/50 last:border-0"
                >
                  {n.label}
                </Link>
              ))}

              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
                  className="flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm"
                >
                  <Search className="h-4 w-4" /> Search
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
