/** Lightweight CSS-only skeleton shimmer — no image dependency for instant render */
const PageLoader = () => (
  <div className="flex min-h-screen flex-col bg-background">
    {/* Top bar skeleton */}
    <div className="h-14 border-b border-border flex items-center px-4 gap-3">
      <div className="h-6 w-6 rounded bg-muted animate-pulse" />
      <div className="h-3 w-28 rounded bg-muted animate-pulse" />
    </div>
    {/* Content skeleton */}
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-3 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-muted animate-pulse" style={{ animationDelay: '500ms' }} />
    </div>
  </div>
);

export default PageLoader;
