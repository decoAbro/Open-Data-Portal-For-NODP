# Backend Caching Notes

To further speed up approval & history endpoints (`/api/upload-history`, `/api/upload-history-admin`) you can introduce a simple in-memory cache.

## Quick In-Memory Cache (Edge Safe Off)
Because these routes likely run on Node (not edge), you can keep a module-level Map.

```ts
// /app/api/_cache/simpleCache.ts
const cache = new Map<string, { data: any; ts: number }>();

export function getCached(key: string, ttlMs: number) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.ts > ttlMs) { cache.delete(key); return undefined; }
  return hit.data;
}

export function setCached(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}
```

Usage inside an API handler:

```ts
import { getCached, setCached } from '../_cache/simpleCache';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get('username') || 'ALL';
  const key = `upload-history-admin:${username}`;
  const ttl = 30_000; // 30s
  const cached = getCached(key, ttl);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
  }
  const data = await fetchFreshFromDB(username);
  setCached(key, data);
  return NextResponse.json(data, { headers: { 'x-cache': 'MISS' } });
}
```

## When To Bypass Cache
- Mutations: after status update or deletion, call a small revalidation util that `cache.delete(key)` for affected keys.
- Large memory footprint? Add an LRU or size cap.

## Future Enhancements
- Replace with Redis for multi-instance deployments.
- Add Server-Sent Events or WebSocket for push updates to clients instead of polling.
- Add `If-None-Match` / ETag headers and return 304 to reduce payload.

## Client Already Optimized
The new `usePersistentSWR` gives instant paint + background revalidation. Server caching adds extra defense for burst load.

