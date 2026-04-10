

## Admin Suite Enhancement Plan

After reviewing all 6 admin pages and the layout, here are the improvements organized by impact:

---

### 1. Dashboard Enhancements

**Current gaps**: No percentage changes, no quick-action links, no real-time status indicators.

- Add **delta indicators** (e.g. "+12% vs last week") on KPI cards by comparing current vs previous period counts
- Add **quick-action cards** at the top: "Ban a user", "Toggle maintenance", "Send announcement" as icon buttons
- Add a **real-time activity feed** panel showing the last 10 actions across the platform (new signups, new conversations, new bots) with live timestamps
- Add **conversion funnel**: Waitlist → Signup → Created Bot → Had Conversation (as a horizontal funnel chart)
- Show **top users by message count** alongside top chatbots

### 2. User Manager Improvements

**Current gaps**: No pagination, no bulk actions, no user detail view, no ability to reset passwords or impersonate.

- Add **pagination** (25 users per page) with page controls
- Add **bulk actions**: select multiple users via checkboxes, then bulk upgrade/downgrade or bulk delete
- Add **user detail drawer/dialog** — click a user row to see full profile: all their chatbots, total conversations, message history, join date, last active
- Add **reset message count** action per user
- Add **role filter** dropdown (All / Admin / User) alongside the plan filter
- Add **sort controls** on table headers (by name, join date, messages, bots)

### 3. Chatbot Manager Improvements

**Current gaps**: No delete bot, no detail view, no ability to edit bot settings.

- Add **delete chatbot** action with confirmation dialog
- Add **chatbot detail dialog** — click a row to see: all FAQs, recent conversations, embed token, configuration (tone, color, welcome message)
- Add **export chatbots CSV**
- Add **sort by** conversations count, FAQ count, or created date

### 4. Conversations Page Improvements

**Current gaps**: No date filter, no bot filter dropdown, no export.

- Add **chatbot filter dropdown** — filter conversations by specific bot
- Add **date range filter** (today, 7d, 30d, all time)
- Add **export conversations** as JSON or CSV
- Add **delete conversation** action
- Show **sentiment indicator** (positive/negative/neutral) based on message content keywords

### 5. Settings Page Improvements

**Current gaps**: Very basic, no sections, no danger zone.

- Reorganize into **tabbed sections**: General, Limits, Notifications, Danger Zone
- Add **Danger Zone** section: "Purge all conversations older than X days", "Reset all message counts", "Export all data"
- Add **email templates** preview section (see what emails look like)
- Add **API rate limit** configuration (currently hardcoded)
- Add **waitlist management** — view waitlist entries, export, delete

### 6. Layout & UX Improvements

**Current gaps**: No breadcrumbs, no global search, no notifications, no theme toggle.

- Add **breadcrumb navigation** below the mobile header
- Add **global admin search** (Cmd+K) — search across users, bots, conversations from anywhere
- Add **notification badge** on sidebar items showing counts (e.g. new users today)
- Add **dark/light theme toggle** in the admin sidebar footer
- Add **"last refreshed" timestamp** on dashboard

### 7. New Admin Page: Waitlist Manager

Currently waitlist count shows on dashboard but there's no page to manage it.

- New **Waitlist page** (`/admin/waitlist`) — list all waitlist entries with email, date, delete action, export CSV
- Add to sidebar navigation

### 8. New Admin Page: System Logs

- New **Logs page** (`/admin/logs`) — show recent edge function calls, errors, response times
- Fetched via a new `get-logs` action in the admin-data edge function that queries recent function invocations

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/layout/AdminLayout.tsx` | Add breadcrumbs, notification badges, theme toggle, waitlist + logs nav items |
| `src/pages/admin/AdminDashboard.tsx` | Delta indicators, activity feed, conversion funnel, top users panel |
| `src/pages/admin/UserManager.tsx` | Pagination, bulk actions, user detail drawer, sort controls, role filter, reset messages |
| `src/pages/admin/ChatbotManager.tsx` | Delete bot, detail dialog, CSV export, sort controls |
| `src/pages/admin/AdminConversations.tsx` | Bot filter dropdown, date range filter, delete conversation, export |
| `src/pages/admin/AdminSettings.tsx` | Tabbed layout, danger zone actions, waitlist management, rate limit config |
| `src/pages/admin/AdManager.tsx` | Minor polish — ad preview, click count display |
| `src/pages/admin/WaitlistManager.tsx` | **New** — waitlist CRUD page |
| `supabase/functions/admin-data/index.ts` | Add actions: `get-waitlist`, `delete-waitlist-entry`, `reset-user-messages`, `bulk-toggle-plan`, `delete-chatbot`, `delete-conversation`, `get-activity-feed`, `get-delta-stats` |
| `src/App.tsx` | Add routes for `/admin/waitlist` |

### No database changes needed
All operations go through the service-role edge function.

