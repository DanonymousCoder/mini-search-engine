import { useEffect, useState } from "react";
import { ApiError, search } from "../api/client";
import type { SearchParams, SearchResponse } from "../api/types";

export type SearchState = 
    | { status: 'idle'; data: null; error: null }
    | { status: 'loading'; data: SearchResponse | null; error: null }
    | { status: 'success'; data: SearchResponse; error: null }
    | { status: 'error'; data: SearchResponse | null; error: ApiError };

const IDLE: SearchState = { status: 'idle', data: null, error: null };


export function useSearch(params: SearchParams, retryToken = 0): SearchState {
    const [state, setState] = useState<SearchState>(IDLE);
    const {q, rank, ext, page } = params;
    
    useEffect(() => {
        if (!q.trim()) { setState(IDLE); return }
        const controller = new AbortController();
        setState((prev) => ({status: 'loading', data, error: null}));
        search({q, rank, ext, page}, controller.signal)
            .then((data) => setState({ status: "success", data, error: null }))
            .catch((err: unknown) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
                const error = err instanceof ApiError ? err : new ApiError("Something went wrong.", 0, 'unknown');
                setState((prev) => ({ status: 'error', data:prev.data, error }));
            });
        return () => controller.abort();
    }, [q, rank, ext, page, retryToken]);

    return state;
}