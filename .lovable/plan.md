

# Back Buttons, Landing Theme Toggle, and PWA Fix

## 1. Back button on Login & Signup pages

Both pages already have the logo linking to `/`. Add an explicit back arrow button above the card for clearer navigation.

**Files**: `src/pages/auth/Login.tsx`, `src/pages/auth/Signup.tsx`
- Import `ArrowLeft` from lucide-react
- Add a `<Link to="/">` with an arrow icon + "Back" text above the form card, positioned top-left or above the logo

## 2. Theme toggle on landing page

The landing page is hardcoded dark (`bg-black text-white`). Adding a theme toggle requires the landing page to respect the theme system instead of forcing dark colors.

**Approach**: Add a `ThemeToggle` button to `LandingNavbar.tsx` (both desktop and mobile menus). However, the landing page currently uses hardcoded `bg-black`, `text-white`, `text-white/50` etc. everywhere. This is a significant refactor across 15+ landing components.

**Pragmatic solution**: Add the toggle to the navbar but scope it so the landing page wrapper uses theme-aware classes (`bg-background text-foreground`), and update the main `Landing.tsx` wrapper. The individual sections use `text-white/X` patterns extensively — we'll update the wrapper and navbar, and let the inner sections inherit where possible. For the inner sections that hardcode white text, we'll use a CSS approach: in light mode, swap the landing page to a light background with dark text via a utility class.

**Files**:
- `src/pages/landing/LandingNavbar.tsx` — Add `ThemeToggle` import and render it in the desktop nav and mobile menu. Update hardcoded `text-white/X` to theme-aware colors.
- `src/pages/landing/Landing.tsx` — Change `bg-black text-white` to `bg-background text-foreground`
- `src/index.css` — Add a `.landing-section` utility that maps `text-white/X` patterns to theme-aware equivalents in light mode

## 3. Fix PWA to actually work

The PWA config in `vite.config.ts` looks correct. The `public/manifest.json` is redundant (VitePWA generates its own) and only has a favicon icon, which conflicts. The PWA icons (`pwa-192x192.png`, `pwa-512x512.png`) exist in `/public`.

**Issues to fix**:
- `public/manifest.json` conflicts with VitePWA's generated manifest — delete or empty it so VitePWA's manifest takes priority
- The service worker registration needs to be imported in the app entry point

**Files**:
- `public/manifest.json` — Remove this file (VitePWA generates the manifest automatically from `vite.config.ts`)
- `index.html` — Remove any `<link rel="manifest">` tag if present, since VitePWA injects it automatically
- `src/main.tsx` — Ensure `registerSW` from `virtual:pwa-register` is called (VitePWA with `registerType: 'autoUpdate'` should auto-inject, but we should verify)

Let me check `index.html` and `main.tsx` to confirm.

