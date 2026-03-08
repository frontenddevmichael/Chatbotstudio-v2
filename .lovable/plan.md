

# Remaining Features — Status & Implementation Plan

## What's DONE
- **Phase 1**: Design system foundation (CSS tokens, typography, colors, shadows, motion)
- **Phase 2**: Full page refactor (Landing, Dashboard, Builder, Widget, Analytics, FAQ Manager, Deploy, Settings, Auth pages, Sidebar, TopNav)

## What's NOT YET IMPLEMENTED

From the original directive, these features remain:

### Cycle 0B: Device-Native Responsive
1. **`useDevice()` hook** — device detection (mobile/tablet/desktop + touch)
2. **Mobile bottom tab bar** — replaces sidebar on phones, 5 tabs with elevated center "Create" button
3. **Tablet slim sidebar** — 72px icon-only collapsible sidebar
4. **Mobile-specific layouts** — full-screen wizard, swipe gestures on FAQ rows, safe area insets
5. **Tablet split-view** — master-detail for FAQ Manager, two-pane builder

### Cycle 7: Proactive Evolutions
6. **Evolution 1: Smart error recovery** — auto-retry on widget network errors, exponential backoff
7. **Evolution 2: Optimistic UI** — snapshot/rollback on chatbot toggle, FAQ delete/edit
8. **Evolution 3: Keyboard shortcuts** — Cmd+K command palette, Cmd+N new chatbot, Cmd+S save, Escape close
9. **Evolution 4: Chatbot health score** — 0-100 score displayed as colored arc on chatbot cards
10. **Evolution 5: Smart onboarding** — dismissible 5-step checklist with confetti on completion
11. **Evolution 6: Conversation insights** — unanswered questions detection, peak hours sparkline
12. **Evolution 7: Embed code variants** — floating widget, inline iframe, full page link (3 options)
13. **Evolution 8: Chatbot duplication** — copy bot + FAQs with plan limit check
14. **Evolution 9: FAQ bulk actions** — checkboxes, bulk supercharge/delete, search/filter
15. **Evolution 10: Widget session persistence** — sessionStorage for conversation, clear button

### Cycles 1-6: Bug Scan & Cleanup
16. **Deep codebase scan** — flag all issues by severity
17. **Dead code elimination** — unused imports, components, CSS, dependencies

---

## Implementation Plan (Prioritized)

Given the volume, I'll batch these into manageable groups:

### Batch A — Responsive Foundation (items 1-5)
- Create `src/hooks/useDevice.ts` with device/touch detection
- Create `src/components/layout/BottomTabBar.tsx` for mobile (Home, Chatbots, +Create, Analytics, Settings)
- Update `Sidebar.tsx` to hide on mobile, show icon-only on tablet
- Update page layouts with mobile-first adjustments (full-width stats, stacked cards)
- Add safe area padding utilities

### Batch B — High-Impact Features (items 8-10, 12-13)
- Create `src/components/CommandPalette.tsx` with Cmd+K trigger using `cmdk` (already installed)
- Create `src/components/chatbot/HealthScore.tsx` — arc ring component
- Create `src/components/onboarding/OnboardingChecklist.tsx` with localStorage tracking + confetti
- Update `DeployPage.tsx` with 3 embed variants (script, iframe, link)
- Add duplicate action to `ChatbotCard.tsx` and `useChatbot.ts`

### Batch C — UX Improvements (items 6-7, 14-15)
- Add retry logic to widget chat hook
- Add optimistic updates to FAQ and chatbot mutations
- Add bulk selection UI to FAQ Manager
- Add sessionStorage persistence to widget

### Batch D — Cleanup (items 16-17)
- Scan for unused imports, dead components, redundant CSS
- Remove dead code and consolidate utilities

---

### Technical Approach
- **useDevice hook**: `window.innerWidth` + resize listener + `navigator.maxTouchPoints` for touch detection
- **Bottom tab bar**: Fixed position, `env(safe-area-inset-bottom)` padding, framer-motion scale animation on tap
- **Command palette**: Leverage already-installed `cmdk` package with dialog overlay
- **Health score**: Pure calculation from chatbot + FAQs data, rendered as SVG arc
- **Onboarding**: localStorage flags, checklist component rendered conditionally on Dashboard
- **Bulk FAQ actions**: Checkbox state array, batch Supabase operations

All changes will use the existing design tokens and follow the established Apple-inspired visual language.

