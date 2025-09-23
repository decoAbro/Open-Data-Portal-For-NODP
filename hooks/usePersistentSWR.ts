import { useEffect, useState, useRef } from 'react';
import useSWR, { Key, SWRConfiguration, MutatorCallback } from 'swr';

/**
 * Persistent SWR cache stored in localStorage to give instant paint of last data
 * while background revalidation keeps it fresh.
 */
const LS_PREFIX = 'swr-cache:';

export interface PersistentSWROptions<Data = any, Error = any> extends SWRConfiguration<Data, Error> {
  /** Time (ms) the cached value is considered fresh enough to be used as fallback. Default 5 minutes. */
  ttl?: number;
}

interface StoredValue<T> { data: T; timestamp: number }

function readFromStorage<T>(key: string, ttl: number): T | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    if (!raw) return undefined;
    const parsed: StoredValue<T> = JSON.parse(raw);
    if (parsed.timestamp + ttl < Date.now()) return undefined; // expired
    return parsed.data;
  } catch {
    return undefined;
  }
}

function writeToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() } as StoredValue<T>));
  } catch {
    // ignore quota / serialization errors silently
  }
}

export function clearPersistentSWR(key: Key) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(LS_PREFIX + String(key)); } catch {}
}

export function usePersistentSWR<Data = any, Error = any>(
  key: Key,
  fetcher: ((...args: any[]) => any) | null,
  { ttl = 5 * 60 * 1000, ...config }: PersistentSWROptions<Data, Error> = {}
) {
  const [fallbackData, setFallbackData] = useState<Data | undefined>(undefined);
  const initializedRef = useRef(false);
  const stringKey = typeof key === 'string' ? key : Array.isArray(key) ? key.join('|') : undefined;

  // Load from localStorage once on mount (or when key changes)
  useEffect(() => {
    if (!stringKey || initializedRef.current) return;
    const cached = readFromStorage<Data>(stringKey, ttl);
    if (cached !== undefined) {
      setFallbackData(cached);
    }
    initializedRef.current = true;
  }, [stringKey, ttl]);

  const swr = useSWR<Data, Error>(key, fetcher as any, {
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
    ...config,
    fallbackData: fallbackData as any ?? config.fallbackData,
  });

  // Persist to localStorage whenever fresh data arrives
  useEffect(() => {
    if (!stringKey) return;
    if (swr.data !== undefined) {
      writeToStorage(stringKey, swr.data);
    }
  }, [stringKey, swr.data]);

  // Wrapped mutate that also writes to storage synchronously when possible
  const mutate: typeof swr.mutate = async (data?, opts?) => {
    if (stringKey && data && typeof data !== 'function') {
      writeToStorage(stringKey, data as Data);
    }
    if (stringKey && typeof data === 'function') {
      try {
        const current = readFromStorage<Data>(stringKey, Number.MAX_SAFE_INTEGER) ?? swr.data;
        const next = (data as MutatorCallback<Data>)(current);
        if (next instanceof Promise) {
          next.then(resolved => writeToStorage(stringKey, resolved as Data)).catch(()=>{});
        } else if (next !== undefined) {
          writeToStorage(stringKey, next as Data);
        }
      } catch {/* ignore */}
    }
    return swr.mutate(data as any, opts as any);
  };

  return { ...swr, mutate } as typeof swr;
}

export default usePersistentSWR;
