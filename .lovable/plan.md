

## Frontend Admin Intercept on Normal Login

### What Changes
One file: `src/pages/auth/Login.tsx`

In `handleSubmit`, **before** calling `signIn(email, password)` (which hits Supabase), add a check:

```
if (email.toLowerCase() === 'admin@chatbotstudio.dev' && password === 'Studio@Admin2026!') {
  sessionStorage.setItem('admin_authenticated', 'true');
  toast.success('Welcome, Admin!');
  navigate('/admin', { replace: true });
  return;  // skip Supabase auth entirely
}
```

This intercepts the admin credentials at the frontend level, sets the session flag, redirects to `/admin`, and **never** touches the server. Normal users continue through the existing Supabase flow unchanged.

### No Other Changes Needed
- `AdminLayout.tsx` already guards on `sessionStorage.getItem('admin_authenticated')`
- `/admin/login` route continues to work as a fallback
- No database or backend changes

