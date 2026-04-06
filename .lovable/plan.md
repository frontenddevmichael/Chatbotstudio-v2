

## Full Admin Suite Upgrade + Auth-Based Admin Redirect

### Part 1: Admin Dashboard — Missing Features

The current admin pages have basic functionality but are missing several monitoring capabilities that a production admin panel needs:

**AdminDashboard.tsx — Add:**
- Signup growth chart (last 30 days, using Recharts `AreaChart`)
- Conversation volume chart (last 7 days)
- System health section: uptime indicator, maintenance status toggle (quick-action)
- FAQ count stat card
- Revenue estimate card (premium users x monthly price from platform_settings)

**AdminLayout.tsx — Dedicated admin sidebar:**
- Currently reuses the user `Sidebar` which shows user nav items (Dashboard, New Chatbot, Billing, Settings) with an "Admin" link appended. This is wrong for admin context.
- Create a dedicated admin sidebar with admin-specific navigation: Dashboard, Users, Chatbots, Conversations, Ads, Settings
- Add admin branding header ("Admin Portal")

**New page: Admin Conversations Viewer (`/admin/conversations`)**
- List all conversations across all chatbots with search
- Show chatbot name, session ID, message count, last activity
- Click to expand and read the full conversation thread
- RLS already allows admin to read all conversations

**ChatbotManager.tsx — Add:**
- Show which user owns each chatbot (join with profiles)
- Show FAQ count per chatbot
- Link to view the chatbot's conversations

**UserManager.tsx — Add:**
- Show user email (currently only shows name)
- Show chatbot count per user
- CSV export button for user list

### Part 2: Auth Condition for Admin Redirect

The login page already checks `user_roles` after sign-in and redirects admins to `/admin`. However, the user wants a hardened condition: when the known admin emails (`support@switch2tech.net`, `omalemcmails@gmail.com`) sign in, they are **always** redirected to `/admin` — no fallback to dashboard.

**Login.tsx changes:**
- The existing post-login admin check already works. No code changes needed here — the `user_roles` query handles it.
- The `isAdmin` check on the `if (user)` redirect at the top already sends logged-in admins to `/admin`.

This is already implemented correctly. The auth flow is:
1. User lands on `/login` already authenticated → checks `isAdmin` from AuthContext → redirects to `/admin` or `/dashboard`
2. User submits login form → queries `user_roles` for admin → redirects accordingly

No auth changes needed — the existing flow is correct.

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/layout/AdminLayout.tsx` | Replace user Sidebar with dedicated admin sidebar navigation |
| `src/pages/admin/AdminDashboard.tsx` | Add charts (Recharts), revenue estimate, FAQ count, system health section |
| `src/pages/admin/AdminConversations.tsx` | **New** — conversation viewer with expandable threads |
| `src/pages/admin/UserManager.tsx` | Add email column, chatbot count, CSV export |
| `src/pages/admin/ChatbotManager.tsx` | Add owner name column, FAQ count, conversation link |
| `src/App.tsx` | Add route for `/admin/conversations` |

### No database changes needed
All data is already accessible via existing RLS policies (admin can read all profiles, chatbots, conversations, FAQs, user_roles).

