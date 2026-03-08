/** Context-aware skeleton loaders for lazy-loaded pages */

/** Full app shell skeleton (sidebar + content area with cards) */
export const DashboardSkeleton = () => (
  <div className="flex min-h-screen bg-background">
    <div className="hidden w-60 border-r border-border bg-background lg:block">
      <div className="space-y-3 p-4">
        {[...Array(6)].map((_, i) => (
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
      <div className="mt-6 h-64 animate-pulse rounded-lg border border-border bg-card" />
    </div>
  </div>
);

/** Auth page skeleton (centered card) */
export const AuthSkeleton = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="w-full max-w-sm space-y-4 px-4">
      <div className="mx-auto h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-3 rounded-xl border border-border bg-card p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-primary/20" />
      </div>
    </div>
  </div>
);

/** Builder / wizard skeleton (centered narrow column with steps) */
export const BuilderSkeleton = () => (
  <div className="flex min-h-screen bg-background">
    <div className="hidden w-60 border-r border-border bg-background lg:block">
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
    <div className="flex-1 p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-6 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[480px] space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-14 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Widget skeleton (standalone chat widget) */
export const WidgetSkeleton = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-14 animate-pulse rounded-full bg-primary/20" />
      </div>
    </div>
  </div>
);

/** Landing page skeleton (full-width hero) */
export const LandingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="h-6 w-28 animate-pulse rounded bg-muted" />
      <div className="flex gap-3">
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-primary/20" />
      </div>
    </div>
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-20 text-center">
      <div className="mx-auto h-10 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mx-auto h-5 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mx-auto h-12 w-40 animate-pulse rounded-lg bg-primary/20" />
    </div>
  </div>
);

/** Default fallback */
const PageSkeleton = () => <DashboardSkeleton />;
export default PageSkeleton;
