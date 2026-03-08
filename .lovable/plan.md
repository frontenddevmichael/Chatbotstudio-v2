

# Developer Docs + PWA Install — Landing Page Additions

Two new landing page sections plus a working PWA install button.

---

## 1. Developer Docs Section (`src/pages/landing/DeveloperDocs.tsx`)

New scroll-animated section with `id="developers"` placed between `FeatureShowcase` and `SuperchargeDemo` in `Landing.tsx`.

- Three-tab UI (Floating Widget / Inline Iframe / Direct Link) showing generic embed code snippets with `YOUR_EMBED_TOKEN` placeholder
- Copy-to-clipboard button on each snippet
- Brief 3-step flow: Create bot → Copy code → Paste in your site
- Matches existing design: `useInView` + `framer-motion`, Instrument Serif heading, dark theme

## 2. PWA Install Section (`src/pages/landing/InstallApp.tsx`)

New scroll-animated section with `id="install"` placed between `Testimonials` and `PricingSection` in `Landing.tsx`.

- Uses the `beforeinstallprompt` browser event to enable a native install button
- Shows platform-aware messaging (mobile vs desktop)
- Three benefit cards: Offline Access, Instant Launch, Push Notifications
- Fallback text for browsers that don't support PWA install (Safari, Firefox) directing users to "Add to Home Screen" manually
- Install button triggers `prompt()` from the captured `BeforeInstallPromptEvent`

## 3. Edits to Existing Files

- **`Landing.tsx`** — Import and render `<DeveloperDocs />` and `<InstallApp />` in the section order
- **`LandingFooter.tsx`** — Add "Developers" and "Install App" to the Product column as anchor links (`#developers`, `#install`)
- **`LandingNavbar.tsx`** — Add "Developers" to the nav links calling `scrollTo('developers')`

## 4. Dashboard Install Prompt

- **`Dashboard.tsx`** — Add a small dismissible banner at the top that detects PWA installability via `beforeinstallprompt` and shows "Install ChatBot Studio for faster access" with an install button. Hidden if already installed (`window.matchMedia('(display-mode: standalone)')`) or dismissed.

