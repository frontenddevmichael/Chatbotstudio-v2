

## Admin Setup & Smart Redirect

### Summary
Grant admin to `support@switch2tech.net`, set a dedicated password, and make the normal login page automatically redirect admin users to `/admin` instead of `/dashboard`.

### Current State
- User `support@switch2tech.net` exists (id: `41f4bfd5-...`) with no admin role
- Login page always redirects to `/dashboard` regardless of role
- Admin features are already complete: Dashboard, User Manager (with grant/revoke admin), Chatbot Manager, Ad Manager, Settings
- UserManager already has the "Make Admin" / "Revoke Admin" functionality with confirmation dialogs

### Changes

**1. Database: Grant admin role**
- Insert into `user_roles`: `(user_id: '41f4bfd5-536e-4e17-abf4-c04f9a5f4150', role: 'admin')`

**2. Edge function: Set dedicated password**
- Create a temporary edge function `set-admin-password` that uses the Supabase Admin API (`auth.admin.updateUserById`) to set a generated password for the user
- Password: `Switch2Admin!2026` (strong, memorable)
- Run it once, then delete the function
- The user can change it later from settings

**3. Login page redirect for admins (`src/pages/auth/Login.tsx`)**
- Remove the instant `if (user) return <Navigate to="/dashboard">` redirect
- After successful `signIn()`, check `user_roles` for admin role
- If admin → redirect to `/admin`
- If not admin → redirect to `/dashboard`
- Also handle the case where user is already logged in: check `isAdmin` from AuthContext and redirect accordingly

**4. Verify admin page completeness**
The admin section already has all key features:
- `/admin` — Dashboard with KPI stats, recent signups, active bots
- `/admin/users` — User list with search, plan toggle, **grant/revoke admin** with confirmation dialog
- `/admin/chatbots` — All chatbots with activate/deactivate
- `/admin/ads` — Ad management with CRUD
- `/admin/settings` — Platform settings (message limits, pricing, maintenance mode, announcements)
- `/admin/login` — Dedicated admin login page (still available as alternative entry point)

No new admin features needed — the grant/revoke admin flow is already built into UserManager.

### Files

| File | Change |
|------|--------|
| Database | Insert admin role for support@switch2tech.net |
| `supabase/functions/set-admin-password/index.ts` | Temporary function to set password (deleted after use) |
| `src/pages/auth/Login.tsx` | Add admin role check after login, redirect admins to `/admin` |
| `src/context/AuthContext.tsx` | No changes needed — `isAdmin` already exposed |

### Credentials (first-time)
- **Email:** support@switch2tech.net
- **Password:** Switch2Admin!2026
- **Login at:** `/login` (normal login page — admins auto-redirect to `/admin`)

