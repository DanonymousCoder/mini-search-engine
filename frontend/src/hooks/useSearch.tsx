import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, getStats } from '../api/client';
import type { StatsResponse } from '../api/types';

export interface Sample {
  t: number; // epoch ms
  qps: number;
  mean: number; // ms, all-time mean reported by the server
  p95: number; // ms, over the server's recent window
  hitRate: number;
}

interface StatsContextValue {
  stats: StatsResponse | null;
  error: ApiError | null;
  updatedAt: number | null;
  samples: Sample[];
  live: boolean;
  setLive: (v: boolean) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<StatsContextValue | null>(null);
const MAX_SAMPLES = 90;

/** Polls /stats and keeps a short in-memory time series (the API only exposes current totals). */
export function StatsProvider({ intervalMs, children }: { intervalMs: number; children: ReactNode }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [live, setLive] = useState(true);
  const prev = useRef<{ t: number; total: number } | null>(null);
  const inflight = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    try {
      const s = await getStats(controller.signal);
      const now = Date.now();
      setStats(s);
      setError(null);
      setUpdatedAt(now);

      const last = prev.current;
      prev.current = { t: now, total: s.queries.total };
      // A restart resets the counter; treat that as "no data" instead of a negative rate.
      const qps = last && s.queries.total >= last.total ? (s.queries.total - last.total) / ((now - last.t) / 1000) : 0;
      setSamples((old) =>
        [...old, { t: now, qps, mean: s.queries.latency_ms.mean, p95: s.queries.latency_ms.p95, hitRate: s.cache.hit_rate }].slice(
          -MAX_SAMPLES,
        ),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err : new ApiError('Something went wrong.', 0, 'unknown'));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The Live switch only pauses the fast dashboard cadence; the slow background poll keeps the header status honest.
  const active = live || intervalMs >= 5000;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs, refresh]);

  useEffect(() => () => inflight.current?.abort(), []);

  const value = useMemo(
    () => ({ stats, error, updatedAt, samples, live, setLive, refresh }),
    [stats, error, updatedAt, samples, live, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStats(): StatsContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStats must be used inside <StatsProvider>');
  return v;
}
