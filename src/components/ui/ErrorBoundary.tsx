import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className="flex min-h-[300px] items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
            <h2 className="mb-2 font-display text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="mb-4 text-sm text-muted-foreground">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground">Error details</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
