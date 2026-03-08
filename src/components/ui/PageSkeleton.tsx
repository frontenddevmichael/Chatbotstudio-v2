const PageSkeleton = () => (
  <div className="flex min-h-screen bg-background">
    <div className="hidden w-60 border-r border-border bg-background lg:block">
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
    <div className="flex-1 p-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-card" />
        ))}
      </div>
    </div>
  </div>
);

export default PageSkeleton;
