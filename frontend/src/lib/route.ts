import { useCallback, useEffect, useState } from "react";
import type { RankMode, SearchParams } from "../api/types";

export type Route = { view: "search"; params: SearchParams } | { view: "dashboard" };

export const DEFAULT_PARAMS: SearchParams = { q: '', rank: 'bm25', ext: '', page: 1 };

const RANKS: readonly RankMode[] = ['bm25', 'tfidf'];

export function parseHash(hash: string): Route {
    const raw = hash.replace(/^#/, '');
    const qIndex = raw.indexOf('?');
    const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    const query = new URLSearchParams(qIndex == -1 ? "" : raw.slice(qIndex + 1));
    if (path === "/dashboard") return { view: 'dashboard' };

    const rank = query.get('rank');
    const page = Number.parseInt(query.get('page') ?? '1', 10);
    return {
        view: 'search',
        params: {
            q: query.get('q') ?? '',
            rank: RANKS.includes(rank as RankMode) ? (rank as RankMode) : DEFAULT_PARAMS.rank,
            ext: query.get('ext') ?? '',
            page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
        },
    };
}

export function searchHash(params: Partial<SearchParams>): string {
    const p = {...DEFAULT_PARAMS, ...params };
    const q = new URLSearchParams();
    if (p.q) q.set('q', p.q);
    if(p.rank !== DEFAULT_PARAMS.rank) q.set('rank', p.rank);
    if(p.ext) q.set('ext', p.ext);
    if(p.page > 1) q.set('page', String(p.page));
    const s = q.toString();
    return s ? `#/?${s}` : "#/";
}

export const DASHBOARD_HASH = '#/dashboard';

export function navigate(hash: string, replace = false): void {
    if (window.location.hash === hash) return;
    if (replace) {
        window.history.replaceState(null, '', hash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
        window.location.hash = hash;
    }
}

export function useRoute(): Route {
    const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
    const sync = useCallback(() => setRoute(parseHash(window.location.hash)), []);

    useEffect(() => {
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, [sync]);
    return route;
}