const nf = new Intl.NumberFormat('en-US');
export const formatInt = (n: number): string => nf.format(Math.round(n));

export function formatCompact(n: number): string {
    const abs = Math.abs(n);
    if (abs < 10_000) return formatInt(n);
    if (abs < 1_000_000) return `${trim(n / 1_000)}K`;
    if (abs < 1_000_000_000) return `${trim(n/1_000_000)}M`;
    return `${trim(n / 1_000_000_000)}B`;
}

function trim(n: number): string {
    return (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1)).replace(/\.0$/, '');
}

export function formatMs(ms: number): string {
    if (!Number.isFinite(ms)) return '-';
    if (ms === 0) return '0 ms';
    if (ms < 0.1) return `${Math.max(1, Math.round(ms*1000))} µs`;
    if (ms < 10) return `${ms.toFixed(2)} ms`;
    if (ms < 100) return `${ms.toFixed(1)} ms`;
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
}

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes)) return '-';
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let v = bytes;
    let i = 0
    while(v >= 1024 && i< units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${i === 0 ? v : v < 10 ? v.toFixed(1) : v.toFixed(0)} ${units[i]}`;
}

export function formatPercent(fraction: number, digits = 1): string {
    if (!Number.isFinite(fraction)) return '-';
    return `${(fraction * 100).toFixed(digits).replace(/\.0+$/, '')}%`;
}

export function formatRate(perSecond: number): string {
    if (!Number.isFinite(perSecond)) return '-';
    return `${perSecond >= 100 ? formatInt(perSecond) : perSecond.toFixed(1)}/s`
}

export function formatUptime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    if(s < 60) return `${s}s`;
    const m = Math.floor(s /60);
    if (m < 60) return `${m}m ${s%60}s`;
    const h = Math.floor(m/60);
    if(h < 60) return `${h}h ${m%60}m`;
    return `${Math.floor(h /24)}d ${h%60}h`;
}

export function formatClock(unixSeconds: number): string {
    if (!unixSeconds) return '-';
    return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const plural = (n:number, one: string, many = `${one}s`): string => (n == 1 ? one : many );

export function niceTicks(max: number, count = 4): { max: number; ticks: number[] } {
    if (!(max > 0)) return { max: 1, ticks: [0, 1] };
    const rough = max / count;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow;
    const step = (frac <= 1 ? 1: frac <= 2 ? 2: frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) * pow;
    const top = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for ( let v = 0; v <= top + step / 1e6; v += step) ticks.push(Number(v.toPrecision(12)));
    return { max: top, ticks };
}