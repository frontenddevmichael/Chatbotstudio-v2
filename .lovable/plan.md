

## Fix: Admin Data Not Loading in Browser

### Root Cause

The edge function works when called directly (returns 34 users, 26 bots, etc.), but **fails in the browser** due to a CORS issue. The `x-admin-secret` custom header is not included in `Access-Control-Allow-Headers`, so the browser's preflight (OPTIONS) request rejects the call before it ever reaches the function logic.

The response headers confirm: `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type` — no `x-admin-secret`.

### Fix

**File: `supabase/functions/admin-data/index.ts`**

Replace the imported `corsHeaders` with a manually defined object that includes `x-admin-secret`:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};
```

Remove the broken `import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors"` line.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/admin-data/index.ts` | Replace CORS import with manual headers including `x-admin-secret` |

One-line fix, then redeploy. No other changes needed — all admin pages already use `adminFetch` correctly.

