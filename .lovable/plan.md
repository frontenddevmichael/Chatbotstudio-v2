

## Dedicated Admin Login Page

### What
Create a separate `/admin/login` page that authenticates admin users and redirects them to `/admin` dashboard. This keeps the admin entry point distinct from regular user login.

### Changes

**New file: `src/pages/admin/AdminLogin.tsx`**
- Styled login form matching the existing Login page but with admin branding ("Admin Portal" heading, shield icon)
- On successful sign-in, checks `user_roles` for admin role via the existing `checkAdmin` pattern
- If admin: redirects to `/admin`
- If not admin: shows error "You do not have admin access", signs out
- If already logged in as admin: auto-redirects to `/admin`
- No "Sign up" or "Forgot password" links (admins are provisioned, not self-service)

**`src/App.tsx`**
- Add lazy import for `AdminLogin`
- Add route: `/admin/login` -> `<AdminLogin />`

**`src/components/layout/AdminLayout.tsx`**
- Change the unauthenticated redirect from `/login` to `/admin/login` so admin pages redirect to the admin-specific login

### Files
- New: `src/pages/admin/AdminLogin.tsx`
- Edit: `src/App.tsx` (add route)
- Edit: `src/components/layout/AdminLayout.tsx` (redirect to `/admin/login`)

