# Final Audit Wave — Production Hardening

Close out the remaining items from the original ruthless audit in one comprehensive pass.

## 1. Edge function hardening (parity with `chat`)

Apply the same input-validation + structured-error pattern already used in `supabase/functions/chat/index.ts` to the other three functions:

- **`admin-data`** — validate `action` against a whitelist of allowed strings, validate `payload` shape per action, return `{ error, code }` with 400 on invalid input. Confirm `x-admin-secret` check is constant-time-ish and rejects early.
- **`generate-faqs`** — enforce `document_text` is a string, length bounds (e.g. 50–50 000 chars), strip control chars, rate-limit per IP via `check_and_increment_rate_limit`.
- **`supercharge`** — validate `faq_id` as UUID, ensure caller owns the FAQ via JWT, keep existing rate limit.
- **`reset-monthly-messages`** — confirm it only accepts scheduled/cron invocations (reject if no service-role / cron secret header).

All four: ensure CORS headers on every response (including errors) and consistent `{ error: string, code?: string }` shape.

## 2. SEO sweep (per-route)

Currently only the landing page has rich head tags. Add a `<SEO>` component call to every public/auth route with route-appropriate title + description + `noIndex` where applicable:

- `/login`, `/signup`, `/forgot-password`, `/reset-password` — titled, `noIndex`
- `/privacy`, `/terms`, `/cookies` — titled, indexed, real descriptions
- `/dashboard`, `/settings`, `/billing`, `/deploy`, `/chatbot/:id`, `/chatbot/:id/analytics`, `/chatbot/:id/faqs` — titled, `noIndex` (authed surfaces)
- `/admin/*` — already mostly covered; verify all have `noIndex`

Also add a single canonical `<link rel="canonical">` to `index.html` pointing at `https://ideaweave-bot.lovable.app/`.

## 3. `ChatbotBuilder.tsx` refactor (carefully)

Split the 449-line file without changing behavior:

```
src/pages/builder/
  ChatbotBuilder.tsx              (state machine + nav only, ~150 lines)
  steps/
    Step1Identity.tsx
    Step2Personality.tsx
    Step3Knowledge.tsx            (FAQ list + import + AI generate)
    Step4Appearance.tsx           (color + preview)
    Step5Deploy.tsx               (SDK snippet)
  hooks/
    useBuilderDraft.ts            (saveDraft + mutations)
    useFAQImport.ts               (CSV/TXT parse + AI generate)
```

Each step receives typed props; parent owns state. No logic changes — only structural.

## 4. Responsive QA pass

Walk the key routes at 375×812 and verify no horizontal scroll / overflowing tables / clipped CTAs:

- Landing (hero, pricing, footer)
- Dashboard, Settings, Billing
- Builder steps 1–5
- Admin tables (already have `overflow-x-auto`, verify on real viewport)
- Widget page

Fix any issues found by adjusting Tailwind responsive classes only (no logic).

## 5. Verification

- Run `supabase--linter` and address any new findings.
- Run `security--run_security_scan` and triage.
- Re-read modified files to confirm no regressions.

## Out of scope

- Bundle-size analysis (would require running build artifacts beyond what this loop supports).
- Visual redesign (separate request).

## Deliverable

After execution: a summary listing files changed per section, any findings from linter/security scan, and confirmation of mobile QA results.
