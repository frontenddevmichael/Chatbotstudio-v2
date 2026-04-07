

## Frontend-Only Admin Login + Premium Whitelist

### Summary
Replace the current server-validated admin login with a purely frontend credential check. When `admin@chatbotstudio.dev` + a hardcoded password is entered, the user bypasses all backend auth and goes straight to `/admin`. Separately, whitelist `Projects@cloudcraves.com` to premium.

### Admin Credentials (your first-time password)
- **Email:** `admin@chatbotstudio.dev`
- **Password:** `Studio@Admin2026!`

### Changes

**1. `src/pages/admin/AdminLogin.tsx` — Frontend-only login**
- Remove all Supabase `signIn`, `signOut`, `getUser`, `user_roles` checks
- Remove `useAuth` dependency entirely (no server-side auth needed)
- On submit: compare email === `admin@chatbotstudio.dev` and password === `Studio@Admin2026!`
- If match: store a flag in `sessionStorage` (e.g. `admin_authenticated = true`), navigate to `/admin`
- If no match: show "Invalid admin credentials" toast
- Remove the auto-redirect `useEffect` that checks `isAdmin`

**2. `src/components/layout/AdminLayout.tsx` — Guard via sessionStorage**
- Remove `useAuth` dependency for admin gate
- Instead check `sessionStorage.getItem('admin_authenticated') === 'true'`
- If not set, redirect to `/admin/login`
- Remove the `isAdmin` and `user` checks entirely

**3. `src/context/AuthContext.tsx` — No changes needed**
- The normal user auth flow stays intact for regular users

**4. `src/pages/auth/Login.tsx` — Remove admin redirect logic**
- Remove the post-login `user_roles` admin check and redirect to `/admin`
- All logins from `/login` go to `/dashboard` only
- Remove the `isAdmin` ternary on the `if (user)` redirect — always go to `/dashboard`

**5. Database: Whitelist `Projects@cloudcraves.com` to premium**
- Update `profiles` for user `f771a3e2-86e0-47ef-85a5-b2dc0a190c8d`: set `plan = 'premium'`, `message_limit = 10000`

### Files
| File | Change |
|------|--------|
| `src/pages/admin/AdminLogin.tsx` | Replace with frontend-only credential check |
| `src/components/layout/AdminLayout.tsx` | Guard via sessionStorage instead of auth context |
| `src/pages/auth/Login.tsx` | Remove admin redirect, always go to `/dashboard` |
| Database | Set `Projects@cloudcraves.com` to premium plan |

