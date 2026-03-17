

## Stability & Flow Fixes — Chatbot Builder, Blank Pages, Auth Cleanup

After auditing the codebase, here are the root causes and fixes for all three issues:

---

### Issue 1: Chatbot Builder — Infinite Loading / No Completion Confirmation

**Root cause:** The `handleNext` function on step 3 (Knowledge) calls `createFAQMutation.mutateAsync` sequentially for every FAQ in a loop. If any FAQ fails silently or the mutation hangs, the button stays in a perpetual loading state. Additionally, `canCreateChatbot(profile, 0)` always passes `0` as the current count instead of the actual chatbot count, meaning the check is unreliable.

**Fixes in `src/pages/builder/ChatbotBuilder.tsx`:**
- Wrap the entire `handleNext` in a try/catch with a `saving` state flag so the button always recovers
- Add a dedicated `saving` boolean state (separate from mutation pending states) to control the button
- Batch FAQ creation with `Promise.allSettled` instead of sequential awaits so one failure doesn't block everything
- Pass the actual chatbot count to `canCreateChatbot` (fetch from the `useChatbots` hook)
- On reaching step 5, show a clear success toast: "Chatbot created successfully!"
- Add error recovery: if `saveDraft` fails, show the error and don't advance

### Issue 2: Blank Pages

**Root causes identified:**
1. **AuthContext race condition:** `onAuthStateChange` and `getSession` both set `loading = false` independently. If `getSession` resolves first with a user, `fetchProfile` is called but the `onAuthStateChange` callback fires concurrently and may reset state mid-flight. This can leave `profile` as `null` while `user` is set, causing downstream components (PageWrapper, Dashboard) to render with incomplete data.
2. **ErrorBoundary renders blank on uncaught errors in lazy routes:** The current ErrorBoundary works, but some errors in the auth race