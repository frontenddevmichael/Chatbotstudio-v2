

## Production-Grade Widget Upgrade Plan

### Overview
Upgrade the embeddable chatbot widget from a basic iframe to a fully production-ready, third-party-embeddable solution with a proper JS SDK, responsive design, and robust communication layer.

### Changes

**1. Create a proper embed SDK (`public/embed.js`)**
- Lightweight JS file (~3KB) that host sites load via `<script>` tag
- Renders a launcher bubble (customizable color/position)
- Creates iframe on-demand (lazy load — no performance hit until opened)
- Handles open/close/minimize toggle with smooth animations
- `postMessage` bridge for host-to-widget communication (pass user metadata, programmatic open/close)
- Mobile detection: fullscreen overlay on small viewports, standard bubble on desktop
- API: `window.ChatBotStudio.open()`, `.close()`, `.setUser({name, email})`

**2. Update `WidgetPage.tsx`**
- Add `postMessage` listener to receive config from parent (user metadata, theme preference)
- Add close/minimize button in header that sends `postMessage` to parent
- Switch from `sessionStorage` to `localStorage` for cross-navigation persistence
- Add light theme support (auto-detect or receive from parent)
- Add ARIA labels, `role="log"` on message area, `aria-live="polite"` for new messages
- Add focus trap when widget is open

**3. Update embed snippets in `DeployPage.tsx`**
- Replace raw iframe snippet with SDK `<script>` tag
- Add configuration options (position, color, welcome text)
- Keep iframe and direct link as secondary options

**4. Update `chat/index.ts` edge function**
- Replace read-then-write message count with atomic SQL increment
- Add response headers: `X-Frame-Options: ALLOWALL`, CSP `frame-ancestors *`

**5. Add response streaming (optional, high-impact)**
- Switch edge function to return Server-Sent Events for token streaming
- Update widget to render tokens as they arrive

### Embed snippet (after changes)
```text
<!-- New production embed -->
<script>
  window.$chatbot = { id: "TOKEN", color: "#0a84ff", position: "bottom-right" };
</script>
<script src="https://yourapp.lovable.app/embed.js" async></script>
```

### Technical details

```text
Host Page                    embed.js                   iframe (WidgetPage)
─────────                    ────────                   ───────────────────
  loads <script>  ──────►  renders bubble
  user clicks     ──────►  creates iframe  ──────►   loads widget
                           postMessage({             receives config
                             type:'init',            renders chat
                             user, theme})
  .open() / .close() ───► toggle iframe visibility
                           postMessage({type:'close'}) ◄── close btn clicked
```

**Files created/modified:**
- Create `public/embed.js` — lightweight SDK
- Edit `src/pages/widget/WidgetPage.tsx` — postMessage, a11y, localStorage, themes, close button
- Edit `src/pages/deploy/DeployPage.tsx` — updated snippets
- Edit `supabase/functions/chat/index.ts` — atomic increment, frame headers

