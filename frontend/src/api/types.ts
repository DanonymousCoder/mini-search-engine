export type RankMode = "bm25" | "tfidf";

export interface SearchResult {
    id: number;
    title: string;
    path: string;
    score: number;
    snippet: string;
    bytes: number;
}

export interface SearchResponse {
    query: string;
    rank: RankMode;
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    cached: boolean;
    took_ms: number;
    terms: string[];
    results: SearchResult[];
}

export interface DocumentDetail {
    id: number;
    title: string;
    path: string;
    ext: string;
    bytes: number;
    tokens: number;
    text: string;
}

export interface LatencyStats {
    count: number;
    mean: number;
    min: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
}

export interface BuildStats {
    documents: number;
    unique_terms: number;
    postings: number;
    total_tokens: number;
    corpus_bytes: number;
    workers: number;
    read_ms: number;
    analyze_ms: number;
    merge_ms: number;
    total_ms: number;
    docs_per_sec: number;
    mb_per_sec: number;
    built_at: number;
    loaded_from_disk: boolean;
    load_ms: number;
    skipped: {
        files_seen: number;
        empty: number;
        binary: number;
        too_large: number;
        unreadable: number;
    };
}   


export interface StatsResponse { 
    index: {
        ready: boolean;
        documents?: number;
        unique_terms?: number;
        postings?: number;
        total_tokens?: number;
        avg_doc_length?: number;
        corpus_bytes?: number;
        estimated_memory_btes?: number;
        generation?: number;
    };

    build: BuildStats | null;
    build_histry:BuildStats[]
    queries:{
        total: number;
        errors:number;
        latency_ms:LatencyStats;
        cached_latency_ms:LatencyStats;
        uncached_latency_ms:LatencyStats;
    };
    cache: {
        capacity:number;
        size:number;
        hits:number;
        misses:number;
        evictions:number;
        hit_raye:number;
    };
    http: {
        connections?:number;
        rejected?:number;
        bad_requests:number;
        resounses_2xx?:number;
        responces_4xx?:number;
        responces_5xx?:number;
        latency_ms: LatencyStats;
    };
    process: {
        rss_bytes:number;
        peak_rss_bytes: number;
        hardware_threads:number;
        uptime_seconds:number;
    };
}

export interface ReindexResponse {
    build: BuildStats;
    persisted: boolean;
    persist_error?: string;
  }
  
  export interface SearchParams {
    q: string;
    rank: RankMode;
    ext: string;
    page: number;
  }