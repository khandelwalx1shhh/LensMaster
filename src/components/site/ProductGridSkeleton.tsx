export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-xl bg-muted" />
          <div className="mt-3 sm:mt-4 space-y-2">
            <div className="h-2.5 w-16 rounded bg-muted" />
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-3.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
