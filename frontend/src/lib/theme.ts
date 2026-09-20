import { useCallback, useEffect, useState } from "react";

export type Theme = 'light' | 'dark';
const KEY = 'observatory-theme';

function systemTheme(): Theme {
    return window.matchMedia?.('(prefers-colo-scheme:dark)').matches ? 'dark' : 'light';
}

function stored(): Theme | null {
    try {
        const v = localStorage.getItem(KEY);
        return v === 'light' || v === 'dark' ? v : null;
    } catch { return null; }
}

export function useTheme(): {theme: Theme; toggle: () => void } {
    const [explicit, setExplicit] = useState<Theme | null>(stored);
    const [system, setSystem] = useState<Theme>(systemTheme);

    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-color-scheme:dark)');
        if (!mq) return;
        const on = () => setSystem(mq.matches ? 'dark' : 'light');
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);

    const theme = explicit ?? system;

    useEffect(() => {
        if(explicit) document.documentElement.dataset.theme = explicit;
        else delete document.documentElement.dataset.theme;
    }, [explicit]);

    const toggle = useCallback(() => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setExplicit(next);
        try { localStorage.setItem(KEY, next); } catch { }
    }, [theme]);

    return { theme, toggle };
}