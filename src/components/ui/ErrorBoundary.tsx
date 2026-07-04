import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import ServerError500 from '@/components/ui/illustrations/ServerError500';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
          <ServerError500 className="mb-6 h-36 w-48" />
          <h1 className="text-3xl font-bold text-foreground mb-1">Something went wrong</h1>
          <p className="text-sm text-muted-foreground/60 mb-8 text-center max-w-sm">
            An unexpected error occurred. Please try refreshing the page.
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
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">Error details</summary>
            <pre className="mt-2 max-w-md overflow-auto rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
