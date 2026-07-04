import { Link } from 'react-router-dom';
import { RefreshCw, Home } from 'lucide-react';
import SEO from '@/components/ui/SEO';
import ServerError500 from '@/components/ui/illustrations/ServerError500';

const ServerError = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
    <SEO title="Server Error" description="An unexpected server error occurred." noIndex />
    <ServerError500 className="mb-6 h-36 w-48" />
    <h1 className="text-3xl font-bold text-foreground mb-1">Server error</h1>
    <p className="text-sm text-muted-foreground/60 mb-8 text-center max-w-sm">
      Something went wrong on our end. Please try refreshing the page.
    </p>
    <div className="flex gap-3">
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
      </button>
      <Link
        to="/"
        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Home className="h-4 w-4" aria-hidden="true" /> Home
      </Link>
    </div>
  </div>
);

export default ServerError;
