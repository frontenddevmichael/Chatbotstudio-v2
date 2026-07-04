import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_API_HOST || 'https://eu.posthog.com';

export const initPostHog = () => {
  if (!POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: false,
    loaded: () => {
      if (import.meta.env.DEV) posthog.opt_out_capturing();
    },
  });
};

export const capturePageView = () => {
  if (!POSTHOG_KEY) return;
  posthog.capture('$pageview');
};

export const identifyUser = (userId: string, traits?: Record<string, string | number | boolean>) => {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits);
};

export const captureEvent = (event: string, properties?: Record<string, unknown>) => {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
};
