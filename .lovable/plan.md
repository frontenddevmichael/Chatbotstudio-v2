

# Production Hardening Plan

The security scan found 6 issues and my code review identified additional gaps. Here's everything needed to reach 100%.

---

## 1. Database Security Fixes (Migration)

**Fix anon chatbot exposure** — Replace the broad "Anon can read active chatbots" SELECT policy with a SECURITY DEFINER function `get_chatbot_by_embed_token(token uuid)` that returns only the fields the widget needs (id, name, welcome_message, tone, primary_color, avatar_emoji, is_active, embed_token). Drop the old anon SELECT policy.

**Fix platform_settings policy** — Change the "Authenticated can read settings" policy to target `TO authenticated` instead of the default public role.

**Fix waitlist INSERT policy** — The current `WITH CHECK (true)` allows any unauthenticated user to insert. Change to allow anon inserts (this is intentional for the landing page waitlist) but add a proper target role.

**Fix has_role function** — Rewrite to use `auth.uid()` internally instead of accepting `_user_id` parameter, preventing admin role probing. Create a new version `is_admin()` that checks `auth.uid()` and update all RLS policies referencing `has_role`.

**Add rate_limits RLS** — The table has RLS enabled but no policies. Add a service-role-only pattern (no public policies since only edge functions write to it).

**Add database indexes** for query performance:
- `conversations(chatbot_id)`
- `conversations(session_id)`
- `faqs(chatbot_id)`
- `rate_limits(identifier, endpoint)`

**Add missing trigger** — The `handle_new_user` function exists but the trigger on `auth.users` may be missing. Verify and create if needed.

**Enable leaked password protection** via auth configuration.

---

## 2. Widget Security (Code + Edge Function)

**Update WidgetPage.tsx** — Replace the direct Supabase `chatbots` table query with a call to the new `get_chatbot_by_embed_token` RPC function so the widget never touches the chatbots table directly.

**Update chat edge function** — The edge function already uses `service_role_key` to query chatbots, so no change needed there.

---

## 3. Frontend Route Protection

All authenticated pages already use `PageWrapper` which redirects to `/login` if no user. Admin pages use `AdminLayout` which checks `isAdmin`. This is already implemented correctly — no changes needed.

---

## 4. Input Validation Hardening

**Add zod schemas** for chatbot creation/update and FAQ creation to validate on the client side before sending to the database. Add to `ChatbotBuilder.tsx` and `FAQManager.tsx`.

---

## 5. Error Handling & Edge Cases

**Add global error handling** — The `ErrorBoundary` already exists and wraps routes. Add a `window.onerror` and `unhandledrejection` listener in `main.tsx` for uncaught errors.

**Handle 1000-row query limit** — Add `.limit()` to all Supabase queries that don't already have one (chatbots list, FAQs list, admin queries).

---

## 6. Auth Hardening

**Enable leaked password protection** via the `configure_auth` tool.

**Add password reset flow** — Create a `/forgot-password` page and `/reset-password` page for production-grade auth.

---

## Summary of Changes

| Area | Files/Tools |
|------|-------------|
| DB Migration | ~15 SQL statements (policies, function, indexes, trigger) |
| Auth Config | Enable leaked password protection |
| Widget | `WidgetPage.tsx` — use RPC instead of direct table query |
| Validation | `ChatbotBuilder.tsx`, `FAQManager.tsx` — add zod schemas |
| Error handling | `main.tsx` — global error listeners |
| Auth pages | New `ForgotPassword.tsx`, `ResetPassword.tsx` + routes in `App.tsx` |
| Query limits | Add `.limit()` to unbounded queries in hooks and admin pages |

