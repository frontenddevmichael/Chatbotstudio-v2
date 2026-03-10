

## Problem

The deploy page builds all widget URLs using `window.location.origin`, which resolves to the Lovable preview domain (e.g., `id-preview--xxx.lovable.app`). When users copy these embed snippets, the URLs expose the Lovable platform instead of using the published app URL.

## Fix

Use the **published URL** (`https://ideaweave-bot.lovable.app`) as the base origin for all embed snippets, instead of `window.location.origin`. This ensures snippets always point to the production bot URL.

### Changes

**`src/pages/deploy/DeployPage.tsx`**
- Replace `window.location.origin` with a constant pointing to the published production URL
- Add a helper that picks the published URL: if the current origin contains `lovable.app` and is a preview URL, use the published domain; otherwise use the current origin (for custom domains)
- Specifically: detect if origin includes `-preview--` and strip it to derive the published `*.lovable.app` URL, or use a hardcoded published URL constant

**`public/embed.js`**  
- No changes needed — the SDK already correctly derives origin from the `<script src>` attribute, so when the snippet uses the published URL, the SDK will resolve correctly

**`src/pages/landing/DeveloperDocs.tsx`**
- Update any example URLs that reference `yourapp.lovable.app` to use the published domain pattern

### Implementation detail

```typescript
// Derive the production base URL
const getPublishedOrigin = () => {
  const origin = window.location.origin;
  // If on a preview domain, use the published domain
  if (origin.includes('-preview--') && origin.includes('.lovable.app')) {
    return 'https://ideaweave-bot.lovable.app';
  }
  // Custom domain or already published — use as-is
  return origin;
};

const baseUrl = getPublishedOrigin();
const widgetUrl = `${baseUrl}/widget/${chatbot.embed_token}`;
const embedJsUrl = `${baseUrl}/embed.js`;
```

This ensures all copied snippets point to the stable published URL rather than the ephemeral preview URL.

