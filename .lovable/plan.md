

## Phase 1: Make Admin Data Actually Load (Critical Fix)
## Phase 2: Unify Admin Login into Main /login

---

### The Root Problem

The admin dashboard shows **zero data** because of an architectural conflict:

- Admin auth is **frontend-only** (sessionStorage flag) — no Supabase session exists
- All admin page queries use the Supabase JS client, which hits RLS policies requiring `has_role(auth.uid(), 'admin')`
- With no Supabase session, `auth.uid()` is null, so every query returns empty arrays
- There are 34 users, 25 chatbots, 29 conversations in the database — but the admin sees none of them

### Solution: Edge Function as Admin Data Proxy

Create a single edge function (`admin-data`) that uses the **service role key** to bypass RLS and return all admin data. The frontend sends a hardcoded admin secret in the request header to authenticate.

---

### Phase 1 — Populate Admin with Real Data

**New file: `supabase/functions/admin-data/index.ts`**
- Accepts a JSON body with `{ action: string, payload?: any }`
- Validates request against a hardcoded admin secret header
- Uses `SUPABASE_SERVICE_ROLE_KEY` to create a service-role client that bypasses RLS
- Supports actions:
  - `get-stats` — counts for profiles, chatbots, conversations, waitlist, faqs, premium users, revenue
  - `get-signup-chart` — 30-day signup growth data
  - `get-convo-chart` — 7-day conversation volume
  - `get-recent-users` — latest 8 signups
  - `get-active-bots` — top 5 bots by conversation count
  - `get-users` — all profiles (for UserManager)
  - `get-roles` — all admin roles
  - `get-chatbots` — all chatbots (for ChatbotManager)
  - `get-bot-counts` — chatbot counts per user
  - `get-faq-counts` — FAQ counts per chatbot
  - `get-conversations` — recent conversations with messages
  - `get-chatbot-map` — chatbot id-to-name map
  - `get-ads` — all ads
  - `get-settings` — platform settings
  - `update-settings` — update platform_settings row
  - `toggle-maintenance` — flip maintenance_mode
  - `toggle-plan` — upgrade/downgrade a user
  - `toggle-bot-active` — activate/deactivate chatbot
  - `toggle-admin-role` — grant/revoke admin role
  - `create-ad`, `delete-ad`, `toggle-ad` — ad CRUD
  - `delete-user` — remove a user profile

**New file: `src/lib/adminApi.ts`**
- Helper function `adminFetch(action, payload?)` that calls the edge function with the admin secret
- All admin pages import this instead of using `supabase.from(...)` directly

**Updated admin pages** (all 6):
- `AdminDashboard.tsx` — replace all `supabase.from()` queries with `adminFetch()` calls
- `UserManager.tsx` — same, plus add **email column** (fetched from auth via service role), **delete user** button
- `ChatbotManager.tsx` — same
- `AdminConversations.tsx` — same
- `AdManager.tsx` — same
- `AdminSettings.tsx` — same

**New admin features added:**
- **Delete user** action in UserManager (with confirmation dialog)
- **User email display** in the user table (currently only shows name)
- **Refresh data** button on dashboard
- **Platform health indicators**: total message volume, average bots per user

---

### Phase 2 — Admin Login via Main /login Only

**`src/pages/auth/Login.tsx`** — already has the frontend intercept (lines 25-31). No changes needed here.

**`src/components/layout/AdminLayout.tsx`** — change the redirect from `/admin/login` to `/login`:
```
if (sessionStorage.getItem('admin_authenticated') !== 'true') {
  return <Navigate to="/login" replace />;
}
```
Also update `handleLogout` to redirect to `/login` instead of `/admin/login`.

**`src/App.tsx`** — remove the `/admin/login` route entirely. AdminLogin.tsx becomes dead code.

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/admin-data/index.ts` | **New** — edge function for all admin data operations |
| `src/lib/adminApi.ts` | **New** — frontend helper to call admin edge function |
| `src/pages/admin/AdminDashboard.tsx` | Rewrite queries to use adminApi, add refresh + delete user |
| `src/pages/admin/UserManager.tsx` | Use adminApi, add email column + delete user |
| `src/pages/admin/ChatbotManager.tsx` | Use adminApi |
| `src/pages/admin/AdminConversations.tsx` | Use adminApi |
| `src/pages/admin/AdManager.tsx` | Use adminApi |
| `src/pages/admin/AdminSettings.tsx` | Use adminApi |
| `src/components/layout/AdminLayout.tsx` | Redirect to `/login` instead of `/admin/login` |
| `src/App.tsx` | Remove `/admin/login` route |

### No database changes needed
All data access goes through the service role key in the edge function, bypassing RLS entirely.

