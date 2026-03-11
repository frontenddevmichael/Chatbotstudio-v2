

## Deep Audit: What's Still Missing for a Production-Grade Widget

After a thorough review of `embed.js`, `WidgetPage.tsx`, `chat/index.ts`, and the database schema, here are the remaining gaps grouped by severity.

---

### Critical Bugs

**1. Resize handler kills open widget (embed.js line 111-119)**
When the browser window resizes, `updateContainerStyles()` resets `display: 'none'` and `opacity: '0'` even when the widget is open. The widget vanishes mid-conversation.

**2. `postMessage` uses wildcard origin (`'*'`)**
Both `embed.js` and `WidgetPage.tsx` use `postMessage(msg, '*')`. Any malicious page could intercept or spoof messages. Should validate `e.origin` against the known widget origin.

**3. No `sandbox` attribute on iframe**
The iframe has no `sandbox` restrictions. Should use `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` to limit what embedded content can do.

---

### Missing Features (High Impact)

**4. No resize / expand / collapse**
Container is hardcoded 400x600px. Users cannot resize, expand to near-fullscreen, or configure dimensions. Need:
- Configurable `width`/`height` via `window.$chatbot`
- An expand/collapse toggle button in the widget header
- CSS `resize` handle on desktop

**5. No unread message badge / notification dot**
When the widget is closed and the bot sends a welcome message or a proactive greeting, there's no visual indicator on the bubble.

**6. No Escape key to close**
Users expect pressing Escape to close the widget. Missing keyboard shortcut.

**7. No sound / haptic feedback option**
No audio ping when a new message arrives (common in production chat widgets like Intercom, Drift).

**8. No proactive greeting / auto-open**
No way for the host site to configure an auto-open delay (e.g., open widget after 5 seconds or on scroll).

---

### Security Hardening

**9. Rate limit is not atomic (chat/index.ts line 72-79)**
The rate limit read-then-write pattern has a race condition. Two concurrent requests could both read count=19 and both pass. Should use an atomic SQL increment with a RETURNING clause.

**10. No origin validation on RPC**
The `get_chatbot_by_embed_token` RPC is callable by anyone with any token. Consider adding an allowed-domains list on the chatbot record and validating the `Referer`/`Origin` header in the edge function.

**11. Conversation data grows unbounded**
The `messages` JSONB column in `conversations` has no size cap. A session with 20 messages * 2000 chars each = 80KB per row, which is fine, but there's no TTL/cleanup for old conversations.

---

### UX Polish

**12. No markdown rendering in bot responses**
Bot responses use `dangerouslySetInnerHTML` with DOMPurify but don't render markdown (bold, lists, code blocks, links). The AI model outputs markdown but it shows as raw text.

**13. No link click handling**
Links in bot responses open inside the iframe. They should open in `_blank` (parent window).

**14. No connection error state**
If the initial chatbot fetch fails due to network, the user sees "Chatbot not found" with no retry option. Should distinguish network errors from 404s.

**15. No smooth auto-focus on open**
When the widget opens, the input field doesn't auto-focus. Users have to click it.

---

### Plan: What to Implement

| # | Change | File |
|---|--------|------|
| 1 | Fix resize handler — only update position/size props when open, never reset display/opacity | `public/embed.js` |
| 2 | Add origin validation to postMessage listeners | `public/embed.js`, `WidgetPage.tsx` |
| 3 | Add `sandbox` attribute to iframe | `public/embed.js` |
| 4 | Add configurable width/height + expand/collapse toggle | `public/embed.js`, `WidgetPage.tsx` |
| 5 | Add unread notification dot on bubble | `public/embed.js` |
| 6 | Add Escape key listener to close widget | `public/embed.js` |
| 7 | Add auto-open delay config (`window.$chatbot.autoOpen: 5000`) | `public/embed.js` |
| 8 | Make rate limit atomic with SQL function | Migration + `chat/index.ts` |
| 9 | Add basic markdown rendering (bold, italic, lists, code, links with `target="_blank"`) | `WidgetPage.tsx` |
| 10 | Auto-focus input on widget open | `WidgetPage.tsx` |
| 11 | Add network error vs 404 distinction with retry button | `WidgetPage.tsx` |
| 12 | Update deploy snippets with new config options | `DeployPage.tsx` |

### Files Modified
- `public/embed.js` — resize fix, origin validation, sandbox, expand/collapse, notification dot, Escape key, auto-open
- `src/pages/widget/WidgetPage.tsx` — origin validation, expand toggle, markdown rendering, auto-focus, retry on error
- `supabase/functions/chat/index.ts` — atomic rate limiting
- `src/pages/deploy/DeployPage.tsx` — updated snippet with new options
- New migration — atomic rate limit SQL function

