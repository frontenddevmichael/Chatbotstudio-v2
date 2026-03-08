

## Audit Results & Fix Plan

After a thorough code review of every file, database schema, RLS policies, edge functions, and UI components, here are the issues found and the plan to fix them all.

---

### Critical Issues

**1. Missing Auth Trigger — Profiles not auto-created on signup**
The `handle_new_user()` function exists but the trigger `on_auth_user_created` is missing from `auth.users`. This means new signups will NOT get a profile row, breaking the entire app for new users. A migration must recreate this trigger.

**2. `hasReachedMessageLimit()` not enforced in the widget**
The widget (`WidgetPage.tsx`) only checks a client-side `MAX_MESSAGES_PER_SESSION` counter but never calls `hasReachedMessageLimit(profile)` from `plans.ts`. Since the widget is public (no auth), this is actually correct — the server-side rate limit in the edge function handles this. However, the edge function does NOT check the chatbot owner's `monthly_message_count` against their plan limit. The chat edge function should check the owner's message usage and block if exceeded.

**3. Edge function `config.toml` missing `verify_jwt = false`**
The `supabase/config.toml` only has the project ID. Both edge functions (especially `chat` which is called without auth) need `verify_jwt = false` to work with the signing-keys system.

---

### Moderate Issues

**4. AdSidebar/AdBanner placement mismatch**
The `AdSidebar` queries for `placement = 'sidebar'` and `AdBanner` for `placement = 'banner'`. But the `AdManager` creates ads with placement values `sidebar` or `banner`. The spec says `dashboard_sidebar` and `preview_page`. This is internally consistent so it works, but should match the ad manager options.

**5. FAQManager — no inline edit capability**
The spec requires existing FAQ question/answer to be editable inline. Currently only add and delete are supported, no edit. Need to add inline editing with the existing `useUpdateFAQ` hook.

**6. Admin panel — waitlist SELECT policy missing**
The admin dashboard queries the `waitlist` table for count, but there's no SELECT RLS policy on the waitlist table. Admin queries will return 0. Need to add a SELECT policy for admins.

**7. Conversations `true` policies are overly permissive**
The `Service can insert conversations` and `Service can update conversations` policies use `true` — the linter flagged these. Since these are used by the edge function via service role key (which bypasses RLS anyway), these policies actually allow any authenticated user to insert/update any conversation. Should be restricted but the edge function uses service role so it bypasses RLS. The risk is that a malicious authenticated user could insert fake conversations. These should be tightened.

**8. `rate_limits` has `Allow all` policy**
This allows any user to manipulate rate limits directly. Should restrict to service role only (no client access).

---

### Minor Issues

**9. No debounce on admin search inputs**
The spec requires 300ms debounce on search inputs. `UserManager` and `ChatbotManager` search filters are instant (no debounce).

**10. Missing `font-display` class on some headings**
Some places use raw `font-bold` without `font-display` for headings.

**11. `NotFound` page missing SEO component**

---

### Implementation Plan

**Migration 1: Fix auth trigger + tighten RLS**
- Create trigger `on_auth_user_created` on `auth.users` AFTER INSERT
- Add SELECT policy on `waitlist` for admins
- Replace `rate_limits` "Allow all" policy with a service-role-only approach (remove the policy, keep RLS enabled — service role bypasses RLS)
- Tighten conversations INSERT/UPDATE policies

**Migration 2: Edge function config**
- Update `supabase/config.toml` to add `verify_jwt = false` for both `chat` and `supercharge` functions

**Code Fix 1: Chat edge function — check owner's message limit**
- After fetching chatbot, fetch the chatbot owner's profile
- Check `monthly_message_count >= message_limit`
- Return 429 if exceeded
- Increment owner's `monthly_message_count` on each successful response

**Code Fix 2: FAQManager — add inline editing**
- Add edit state per FAQ item
- Use `useUpdateFAQ` hook to save changes
- Show save/cancel buttons when editing

**Code Fix 3: Add debounce to admin search**
- Add a simple debounce hook or use `setTimeout` pattern in UserManager and ChatbotManager

**Code Fix 4: Redeploy edge functions**
- Deploy both `chat` and `supercharge` after config changes

**Files to modify:**
- `supabase/config.toml` — add function JWT config
- `supabase/functions/chat/index.ts` — add owner message limit check + increment
- `src/pages/chatbot/FAQManager.tsx` — add inline editing
- `src/pages/admin/UserManager.tsx` — add debounce
- `src/pages/admin/ChatbotManager.tsx` — add debounce
- `src/pages/NotFound.tsx` — add SEO component
- New migration SQL file

**Estimated scope:** ~8 file changes, 1 migration, 2 function deploys

