# Frontend Persistent SWR Cache Usage

The components `upload-history` (user) and `admin/approval-history-management` now use `usePersistentSWR`.

## Key Features
- LocalStorage backed: last successful response painted instantly on revisit / tab switch.
- TTL default: 5 minutes (override via `ttl` option).
- Background revalidation every 60s (configurable via `refreshInterval`).
- Optimistic updates for status changes leverage `mutate` without blocking UI.

## Changing TTL / Refresh
```tsx
usePersistentSWR(key, fetcher, { ttl: 2 * 60_000, refreshInterval: 30_000 })
```

## Clearing a Specific Cache Entry
```ts
import { clearPersistentSWR } from '@/hooks/usePersistentSWR'
clearPersistentSWR('/api/upload-history?username=bob')
```

## Forcing Revalidation
Call `mutate()` returned from the hook to re-fetch immediately in the background.

## When Data Mutates Server-Side
After actions like delete or status approval:
1. Perform the fetch (mutation call).
2. Call `mutate(prev => transform(prev), { revalidate: false })` for instant UI update.
3. Call plain `mutate()` to revalidate against server.

## Edge Cases Considered
- Expired localStorage entries are ignored and removed on next write.
- JSON parsing errors are swallowed safely.
- SSR safety: hook guards against `window` usage on server.

## Potential Enhancements
- Add compression (LZ-string) for very large payloads.
- Add versioning: include a `schemaVersion` field in stored object to invalidate when structure changes.
- Integrate with service workers for offline support.
- Switch to IndexedDB for very large data sets.

## Debugging
Open DevTools > Application > LocalStorage and filter for `swr-cache:` prefix.

## Fallback Behavior
If no cached value or expired -> behaves like normal SWR (loading spinner shown). With cache -> immediate content + subtle updates as fresh data arrives.

