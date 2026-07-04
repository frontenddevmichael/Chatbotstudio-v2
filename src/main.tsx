import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
registerSW({ immediate: true });

// Initialize Sentry (no-op if DSN not set)
initSentry();

// Capture unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  Sentry.captureException(event.reason);
});

// Capture uncaught runtime errors
window.addEventListener("error", (event) => {
  Sentry.captureException(event.error || event.message);
});

// Initialize PostHog (no-op if API key not set)
initPostHog();

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<p className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">An unexpected error occurred.</p>}>
    <App />
  </Sentry.ErrorBoundary>
);
