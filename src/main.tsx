import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]', { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
};

createRoot(document.getElementById("root")!).render(<App />);
