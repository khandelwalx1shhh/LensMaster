import { Star } from "lucide-react";
import { MAPS_PLACE_URL } from "@/lib/maps";

export function ReviewsSection() {
  return (
    <section className="mt-16 sm:mt-24 border-t border-border pt-10 sm:pt-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Reviews</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-light tracking-tight">Customer feedback</h2>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto flex w-fit items-center gap-1 text-muted-foreground">
          {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4" />)}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No reviews yet for this product.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Bought this frame? Share your experience in-store or on our Google page.
        </p>
        <a
          href={MAPS_PLACE_URL}
          target="_blank"
          rel="noopener noreferrer external"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs font-medium hover:bg-muted transition"
        >
          Write a Google review
        </a>
      </div>
    </section>
  );
}
