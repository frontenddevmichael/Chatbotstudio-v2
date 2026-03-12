

## 6-Point Upgrade Plan

### 1. Widget Comprehensive Features
The widget is missing several UX essentials. Changes to `public/embed.js` and `src/pages/widget/WidgetPage.tsx`:

- **Close button already exists** in header (X icon) but only shows when `embedded === true`. Verify this works and add a mobile "back" chevron for fullscreen mode
- Add a **minimize to bubble** animation (currently snaps — add smooth slide-down)
- Add **typing indicator awareness** — when bot responds, send `cbs:unread` to parent if widget is closed
- Add **click-outside to close** on desktop (click the overlay area behind the widget)
- Add **sound toggle** button in header (muted by default, user can enable notification pings)

### 2. Progressive Loading & Responsiveness
Current issues: lazy-loaded pages show a full-screen logo spinner, transitions feel abrupt. Changes across multiple files:

- **`src/components/ui/PageLoader.tsx`** — replace logo+spinner with a lightweight CSS skeleton shimmer (no image dependency = instant render)
- **`src/App.tsx`** — add `startTransition` to route changes so React doesn't block rendering
- **`src/pages/dashboard/Dashboard.tsx`** — add staggered skeleton cards instead of a single spinner
- **Widget** — add a skeleton shimmer to the widget while chatbot data loads instead of a plain spinner
- Ensure all `Suspense` boundaries use lightweight placeholders, not heavy components

### 3. Light Mode by Default
Currently the `ThemeContext` defaults to `'system'` which resolves to the OS preference. Change to default to `'light'`.

- **`src/context/ThemeContext.tsx`** — change the fallback from `'system'` to `'light'` when no stored preference exists
- **`src/pages/widget/WidgetPage.tsx`** — change default widget theme from `'dark'` to `'light'`

### 4. Remove iframe Embed Option
The iframe/floating variants don't work well. Remove them from `DeployPage.tsx`.

- **`src/pages/deploy/DeployPage.tsx`** — remove `'floating'` and `'iframe'` from the variant list, keep only `'sdk'` and `'link'`
- **`src/pages/builder/ChatbotBuilder.tsx`** (step 5) — replace the raw iframe `embedCode` with the SDK snippet
- **`src/pages/landing/DeveloperDocs.tsx`** — remove iframe examples if present

### 5. Theme Selector Affects Entire Widget Window
Currently the widget's `primaryColor` only colors the bot avatar and send button. The entire widget (header, bubble backgrounds, input area) should be tinted by the theme color.

- **`src/pages/widget/WidgetPage.tsx`** — derive accent-tinted colors from `primaryColor` for the header background, send button, user message bubbles, input focus ring, and the "Online" dot. Use the color as a true accent throughout (header subtle tint, active states, links)
- **`src/pages/builder/ChatbotBuilder.tsx`** step 4 preview — update the preview to reflect the full-window theming so users see the real effect

### 6. AI-Generated FAQs from Document Upload
Add an option in the builder's Knowledge step (step 3) to upload a company document (PDF, TXT, DOCX) and have AI generate FAQs automatically.

- **Create `supabase/functions/generate-faqs/index.ts`** — new edge function that:
  - Accepts a text document body
  - Calls Lovable AI (`google/gemini-3-flash-preview`) with a prompt to extract 10-15 Q&A pairs from the document
  - Returns structured FAQ array
- **Update `supabase/config.toml`** — add `[functions.generate-faqs]` with `verify_jwt = false`
- **`src/pages/builder/ChatbotBuilder.tsx`** step 3 — add an "Auto-Generate FAQs" card:
  - Upload area for `.txt`, `.csv`, `.pdf`, `.docx` files
  - "Generate FAQs" button that sends document text to the edge function
  - Loading state with progress indicator
  - Generated FAQs populate the FAQ list for user review/editing before saving
  - For PDF/DOCX, extract text client-side (use FileReader for text files; for PDF, read as text with a note that plain text works best)

### Files Modified
- `public/embed.js` — click-outside close, unread on bot response, smoother animations
- `src/pages/widget/WidgetPage.tsx` — full theme coloring, light default, skeleton loader, mobile close
- `src/context/ThemeContext.tsx` — light default
- `src/pages/deploy/DeployPage.tsx` — remove iframe/floating variants
- `src/pages/builder/ChatbotBuilder.tsx` — SDK snippet on step 5, AI FAQ generation UI on step 3
- `src/pages/landing/DeveloperDocs.tsx` — remove iframe examples
- `src/components/ui/PageLoader.tsx` — lightweight skeleton shimmer
- Create `supabase/functions/generate-faqs/index.ts` — AI FAQ generation
- `supabase/config.toml` — add generate-faqs function

