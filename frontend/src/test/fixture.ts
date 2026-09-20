import type { LatencyStats, SearchResponse, StatsResponse } from '../api/types';

export const lat = (o: Partial<LatencyStats> = {}): LatencyStats => ({ count: 0, mean: 0, min: 0, p50: 0, p95: 0, p99: 0, max: 0, ...o });

export function statsFixture(o: Partial<StatsResponse> = {}): StatsResponse {
  const build = {
    documents: 10,
    unique_terms: 236,
    postings: 298,
    total_tokens: 329,
    corpus_bytes: 2920,
    workers: 8,
    read_ms: 3.5,
    analyze_ms: 0.4,
    merge_ms: 0.2,
    total_ms: 0.9,
    docs_per_sec: 11580,
    mb_per_sec: 3.2,
    built_at: 1789806042,
    loaded_from_disk: false,
    load_ms: 0,
    skipped: { files_seen: 12, empty: 1, binary: 1, too_large: 0, unreadable: 0 },
  };
  return {
    index: { ready: true, documents: 10, unique_terms: 236, postings: 298, total_tokens: 329, avg_doc_length: 32.9, corpus_bytes: 2920, estimated_memory_bytes: 29160, generation: 1 },
    build,
    build_history: [build],
    queries: {
      total: 42,
      errors: 2,
      latency_ms: lat({ count: 40, mean: 0.05, p50: 0.03, p95: 0.2, p99: 0.4, max: 0.5 }),
      cached_latency_ms: lat({ count: 20, mean: 0.002, p50: 0.002, p95: 0.004, p99: 0.006, max: 0.01 }),
      uncached_latency_ms: lat({ count: 20, mean: 0.1, p50: 0.08, p95: 0.3, p99: 0.4, max: 0.5 }),
    },
    cache: { capacity: 1024, size: 20, hits: 20, misses: 20, evictions: 0, hit_rate: 0.5 },
    http: { connections: 50, rejected: 0, bad_requests: 0, responses_2xx: 45, responses_4xx: 3, responses_5xx: 0, latency_ms: lat({ count: 48, p95: 0.5 }) },
    process: { rss_bytes: 50_000_000, peak_rss_bytes: 60_000_000, hardware_threads: 16, uptime_seconds: 125 },
    ...o,
  };
}

export function searchFixture(o: Partial<SearchResponse> = {}): SearchResponse {
  return {
    query: 'bm25 ranking',
    rank: 'bm25',
    total: 2,
    limit: 10,
    offset: 0,
    has_more: false,
    cached: false,
    took_ms: 0.0562,
    terms: ['bm25', 'ranking'],
    results: [
      { id: 1, title: 'BM25 Ranking', path: 'bm25.md', score: 4.1681, snippet: '... BM25 is a ranking function that scores documents ...', bytes: 333 },
      { id: 4, title: 'TF-IDF Scoring', path: 'tfidf.txt', score: 1.2, snippet: 'Classic first ranking function for a small engine.', bytes: 250 },
    ],
    ...o,
  };
}

type Handler = (url: URL, init?: RequestInit) => { status?: number; body?: unknown } | 'network-error';

/** Installs a fetch double that routes by path; anything unhandled fails the test loudly. */
export function mockApi(handler: Handler) {
  const calls: string[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    calls.push(url.pathname + url.search);
    const r = handler(url, init);
    if (r === 'network-error') throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return { calls, fn };
}
