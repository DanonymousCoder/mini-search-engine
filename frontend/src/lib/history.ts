const KEY = 'observability-history';
const MAX = 8;

export  function loadHistory(): string[] {
    try {
        const raw = localStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw): [];
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX): [];
    } catch {
        return []
    }
}

function save (items: string[]): string[] {
    try {
        localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
        // unavilable for now
    }
    return items;
}

export function pushHistory(query:string): string[] {
    const q = query.trim();
    if (!q) return loadHistory();

    const rest = loadHistory().filter((x) => x.toLowerCase() !== q.toLowerCase());
    return save([q, ...rest].slice(0, MAX));
}

export function removeHistory(query: string): string[] {
    return save(loadHistory().filter((x) => x !== query ));
}

export const cleanHistory = (): string[] => save([]);