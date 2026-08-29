import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Lens Master — Jaipur's Premium Optical Store" },
      { name: "description", content: "Lens Master by The Swadesh is Jaipur's flagship luxury optical store — premium frames, precision lenses, and professional eye care since 1997." },
      { property: "og:title", content: "About Lens Master — Jaipur's Premium Optical Store" },
      { property: "og:description", content: "Craftsmanship, precision, and personal service since 1997." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 pb-14 sm:pb-20">
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">About</p>
      <h1 className="mt-3 sm:mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">
        About Lens Master
      </h1>
      <p className="mt-3 text-lg text-muted-foreground italic">Eyewear as craft.</p>

      <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
        <p>
          Lens Master by The Swadesh is Jaipur's flagship optical store — a quiet, considered space where premium frames meet
          precision lenses, and every pair is fitted by hand.
        </p>
        <p>
          We carry the houses that define modern eyewear — Ray-Ban, Gucci, Burberry, Oakley, Prada, Carrera — alongside a
          curated selection of Indian design. Our opticians spend as long as it takes to find the frame, the lens, and the fit
          that's right for you.
        </p>
        <p>
          Rated 4.9 across 700+ Google reviews. Come see us in Lalkothi.
        </p>
      </div>
    </div>
  );
}
