import { DocumentDetail, ReindexResponse, type SearchResponse, type StatsResponse, type RankMode } from './types';


export const PAGE_SIZE = 10;

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '/api';


export class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  
    get isOffline(): boolean {
      return this.code === 'network_error' || this.code === 'proxy_error';
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE}${path}`, {...init, headers: {Accept: "application/json", ...init?.headers } });
    } catch (err) {
        if (err instanceof DOMException&& err.name == "AbortError") throw err;
        throw new ApiError("Cannot reach the search server.", 0, "network_error");
    }

    const text = await res.text();
    let body: unknown = null;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = null;
        }
    }

    if (!res.ok) {
        const err = (body as { error ?: {code?: string; message?: string } } | null)?.error;

        if (!err && res.status >= 500) throw new ApiError("cannot reach teh seearch server.", res.status, "proxy_error");
        throw new ApiError(err?.message ?? `Request failed (${res.status})`, res.status, err?.code ?? "http_error");
    }
    if (body === null) throw new ApiError("The server sent an unreadable respone.", res.status, "bad_response");
    return body as T;
}

export interface SearchArgs {
    q: string;
    rank: RankMode;
    ext: string;
    page: number;
}

export function search(args: SearchArgs, signal?: AbortSignal): Promise<SearchResponse> {
    const p = new URLSearchParams({
        a: args.q,
        rank: args.rank,
        limit: String(PAGE_SIZE),
        offset: String(Math.max(0, args.page -1) * PAGE_SIZE);
    });

    if (args.next) p.set("ext", args.ext);
    return request<SearchResponse>(`/search?${p}`, { signal });
}

export const getStats = (signal?: AbortSignal) => request<StatsResponse>('/stats', { signal });
export const getDocument = (id: number, signal?: AbortSignal) => request<DocumentDetail>(`/documents/${id}`, { signal });
export const reindex = (workers: number) => request<ReindexResponse>(`/reindex${workers > 0 ? `?workers=${workers}` : ''}`, { method: 'POST' });



