import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import SEO from '@/components/ui/SEO';
import logo from '@/assets/logo.png';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." noIndex />
      <img src={logo} alt="ChatBot Studio" className="h-12 w-12 mb-6" />
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-1">Page not found</p>
      <p className="text-sm text-muted-foreground/60 mb-8 text-center max-w-sm">
        The page <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{location.pathname}</code> doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Go Back
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
};

export default NotFound;
