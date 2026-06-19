## Audit: Why email verification is slow and fails

I traced the signup → email → click-link → login flow end-to-end. There are **5 real problems** (2 you flagged, 3 you didn't), all reinforcing each other.

### 1. No custom sender domain (root cause of the *slow* email)
`email_domain--check_email_domain_status` returned **no domain configured**. That means every verification email is sent through Lovable's shared default sender. Shared senders are heavily rate-limited and frequently land in spam / Gmail's "Promotions" tab — that's the "takes a while before it's even sent" you see.

### 2. `signUp()` doesn't set `emailRedirectTo` (root cause of *verification fails*)
`src/context/AuthContext.tsx` calls:
```ts
supabase.auth.signUp({ email, password, options: { data: { full_name } } })
```
No `emailRedirectTo`. So the link in the email points at whatever the project's Auth "Site URL" is — usually the Lovable **preview** domain, not `https://ideaweave-bot.lovable.app`. When the user clicks it from production, the token is consumed on a different origin (or 404s), the session is never written to *this* origin's storage, and the next login attempt returns `Email not confirmed` → "user not verified".

### 3. No `/auth/callback` route (hidden problem)
`src/App.tsx` has routes for `/reset-password` but **no handler for the signup confirmation redirect**. Supabase sends the user back with `#access_token=…&type=signup` in the URL hash. Without a page that calls `supabase.auth.exchangeCodeForSession` / waits for `SIGNED_IN`, the hash is dropped on the landing page and the verification never completes.

### 4. Login surfaces raw error, no resend path (hidden problem)
`src/pages/auth/Login.tsx` just toasts the raw Supabase message. When it's `Email not confirmed`, the user has no way to trigger a new email — they're stuck.

### 5. Silent failure for already-registered emails (hidden problem)
Supabase returns success with `identities: []` if the email already exists. `signUp` in `AuthContext` doesn't detect this, so the "Check your email" screen shows and the user waits forever for an email that will never arrive.

---

## Fix plan

### Step 1 — Provision a real sender domain
Trigger the email setup dialog so auth emails are sent from the project's own subdomain. This alone removes 90% of the "email is slow / in spam" symptom.

```
<presentation-open-email-setup>Set up email domain</presentation-open-email-setup>
```

### Step 2 — Add `emailRedirectTo` on signup and resend
Edit `src/context/AuthContext.tsx` `signUp` and `src/pages/auth/Signup.tsx` `handleResend`:
```ts
const redirectTo = `${window.location.origin}/auth/callback`;
supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { full_name } } });
supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
```

### Step 3 — Create `/auth/callback` route + page
New file `src/pages/auth/AuthCallback.tsx`:
- On mount: read URL hash, call `supabase.auth.getSession()` / listen for `SIGNED_IN`.
- Handle `type=recovery` → redirect to `/reset-password` preserving hash.
- Handle `type=signup` (or any successful session) → toast "Email verified" → `navigate('/dashboard')`.
- Handle `error_description` in hash → toast and send to `/login`.

Register in `src/App.tsx`:
```tsx
<Route path="/auth/callback" element={<ErrorBoundary><AuthCallback /></ErrorBoundary>} />
```

### Step 4 — Friendlier login + inline resend
In `src/pages/auth/Login.tsx`:
- Detect `error.message.includes('Email not confirmed')` (or `error.code === 'email_not_confirmed'`).
- Show a dedicated message + a "Resend verification email" button that calls `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })`.

### Step 5 — Detect duplicate-email signup
In `AuthContext.signUp`, inspect the response:
```ts
const { data, error } = await supabase.auth.signUp(...);
if (error) throw error;
if (data.user && data.user.identities && data.user.identities.length === 0) {
  throw new Error('An account with this email already exists. Try signing in or resetting your password.');
}
```
This makes Signup.tsx surface a real error instead of the misleading "Check your email" screen.

### Step 6 — Verify
- Sign up with a fresh email → confirm email arrives within seconds from the project domain.
- Click link from a different tab → land on `/auth/callback` → auto-redirect to `/dashboard` already authenticated.
- Sign up with an existing email → see "account already exists" error.
- Try logging in unverified → see resend button, click it, get new email.

### Files touched
- New: `src/pages/auth/AuthCallback.tsx`
- Edited: `src/App.tsx`, `src/context/AuthContext.tsx`, `src/pages/auth/Signup.tsx`, `src/pages/auth/Login.tsx`
- Plus: email-domain setup dialog + (optional, after domain is live) scaffold branded auth templates.

No DB/migration changes required.
