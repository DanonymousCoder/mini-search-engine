import { useState } from 'react';
import { ApiError, reindex } from '../api/client';
import type { BuildStats, StatsResponse } from '../api/types';
import { ErrorNotice } from '../components/ErrorNotice';
import { CheckIcon, RefreshIcon } from '../components/Icons';
import { Pipeline } from '../components/Pipeline';
import { BarChart } from '../components/charts/BarChart';
import { DotPlot } from '../components/charts/DotPlot';
import { LineChart } from '../components/charts/LineChart';
import { Meter } from '../components/charts/Meter';
import { StackedBar } from '../components/charts/StackedBar';
import { useStats } from '../hooks/useStats';
import { formatBytes, formatCompact, formatClock, formatInt, formatMs, formatPercent, formatRate, formatUptime, plural } from '../lib/format';

const S1 = 'var(--series-1)';
const S2 = 'var(--series-2)';
const S3 = 'var(--series-3)';
const ORDINAL: [string, string, string] = ['var(--ord-1)', 'var(--ord-2)', 'var(--ord-3)'];

const WORKER_CHOICES = [0, 1, 2, 4, 8, 16];

export function DashboardView() {
    const { stats, error, updatedAt, live, setLive, refresh } = useStats();
    const [workers, setWorkers] = useState(0);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

    const runReindex = async () => {
        setBusy(true);
        setResult(null);
        try {
            const r = await reindex(workers);
            const b = r.build;
            setResult({
                ok: true,
                text: `Reindexed ${formatInt(b.documents)} ${plural(b.documents, 'document')} in ${formatMs(b.total_ms)} with ${b.workers} ${plural(b.workers, 'worker')}${r.persisted ? ' and saved the index' : ''}.`,
            });
            await refresh();
        } catch (err) {
            const e = err instanceof ApiError ? err : new ApiError('Something went wrong.', 0, 'unknown');
            setResult({ ok: false, text: e.code === 'reindex_disabled' ? 'Reindex is unavailable: the server was started without --data.' : e.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="page dash">
            <div className="toolbar">
                <div className="toolbar__group">
                    <label className="switch">
                        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
                        <span className="switch__track" aria-hidden="true" />
                        <span>Live updates</span>
                        </label>
                        <button type="button" className="btn btn--quiet" onClick={() => void refresh()}>
                            <RefreshIcon width={16} height={16} />
                            Refresh
                            </button>
                            <span className="toolbar__meta" role="status">
                                {updatedAt ? `Updated ${formatClock(Math.floor(updatedAt / 1000))}` : 'Waiting for the server'}
                                </span>
                                </div>
                                <div className="toolbar__group">
                                    <label className="select select--inline">
                                        <span className="select__label">Workers</span>
                                        <select value={workers} onChange={(e) => setWorkers(Number(e.target.value))} disabled={busy}>
                                            {WORKER_CHOICES.map((w) => (
                                                <option key={w} value={w}>
                                                    {w === 0 ? 'Server default' : w}
                                                    </option>
                                            ))}
                                            </select>
                                            </label>
                                            <button type="button" className="btn btn--primary" onClick={() => void runReindex()} disabled={busy} aria-busy={busy}>
                                                {busy ? 'Reindexing' : 'Reindex'}
                                                </button>
                                                </div>
                                                </div>

                                                {result && (
                                                    <p className={result.ok ? 'flash flash--ok' : 'flash flash--bad'} role="status">
                                                        {result.ok && <CheckIcon width={16} height={16} />}
                                                        {result.text}
                                                        </p>
                                                )}

                                                {error && !stats && <ErrorNotice error={error} onRetry={() => void refresh()} />}
                                                    {error && stats && (
                                                        <p className="flash flash--bad" role="status">
                                                            Lost connection to the server. Showing the last numbers received.
                                                            </p>
                                                    )}

                                                    {stats && !stats.index.ready && (
                                                        <div className="empty">
                                                            <p className="empty__title">No index is loaded yet</p>
                                                            <p className="empty__text">Start the server with a data directory, or run Reindex once it has one.</p>
                                                            </div>
                                                    )}

                                                    {stats && stats.index.ready && (
                                                        <div className={error ? 'board is-stale' : 'board'}>
                                                            <div className="board__wide">
                                                                <Pipeline stats={stats} />
                                                                </div>
                                                                <IndexingPanel stats={stats} />
                                                                <LatencyPanel stats={stats} />
                                                                <TrafficPanel />
                                                                <LatencyTrendPanel />
                                                                <CachePanel stats={stats} />
                                                                <ProcessPanel stats={stats} />
                                                                </div>
                                                    )}
                                                    </div>
    );
}

function Panel({ title, note, children, id }: { title: string; note?: string; children: React.ReactNode; id: string }) {
    return (
        <section className="panel" aria-labelledby={id}>
            <header className="panel__head">
                <h2 className="panel__title" id={id}>
                    {title}
                    </h2>
                    {note && <p className="panel__note">{note}</p>}
                    </header>
                    {children}
                    </section>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div className="fact">
            <dt>{label}</dt>
            <dd>{value}</dd>
            </div>
    );
}

const source = (b: BuildStats) => (b.loaded_from_disk ? 'Loaded from disk' : `Built with ${b.workers} ${plural(b.workers, 'worker')}`);

function IndexingPanel({ stats }: { stats: StatsResponse }) {
    const b = stats.build;
    const [table, setTable] = useState(false);
    if (!b) return null;
    const built = stats.build_history.filter((h) => !h.loaded_from_disk);
    const totalMs = b.read_ms + b.analyze_ms + b.merge_ms;

    return (
        <Panel id="p-index" title="Indexing" note={b.loaded_from_disk ? 'Loaded from a saved file. Timings below are from the original build.' : 'Latest build'}>
            <dl className="facts">
                <Fact label="Documents per second" value={b.loaded_from_disk && !b.docs_per_sec ? '-' : formatCompact(b.docs_per_sec)} />
                <Fact label="Throughput" value={b.mb_per_sec ? `${b.mb_per_sec.toFixed(1)} MiB/s` : '-'} />
                <Fact label={b.loaded_from_disk ? 'Load time' : 'Build time'} value={formatMs(b.loaded_from_disk ? b.load_ms : b.total_ms)} />
                </dl>

                <h3 className="sub">Where the time went</h3>
                <StackedBar
                ariaLabel={`Build time split: reading ${formatMs(b.read_ms)}, tokenizing ${formatMs(b.analyze_ms)}, merging ${formatMs(b.merge_ms)}`}
                segments={[
                    { key: 'read', label: 'Reading files', value: b.read_ms, color: S1, display: formatMs(b.read_ms) },
                    { key: 'analyze', label: 'Tokenizing', value: b.analyze_ms, color: S2, display: formatMs(b.analyze_ms) },
                    { key: 'merge', label: 'Merging into index', value: b.merge_ms, color: S3, display: formatMs(b.merge_ms) },
                ]}
                />
                {totalMs === 0 && <p className="panel__note">No timing was recorded for this build.</p>}

                {built.length >= 2 && (
                    <>
                    <h3 className="sub">Documents per second, by build</h3>
                    <BarChart
                    ariaLabel="Indexing throughput for each build in this server session"
                    color={S1}
                    formatValue={(v) => formatCompact(v)}
                    bars={built.map((h, i) => ({
                        id: String(h.built_at) + i,
                        label: `#${i + 1}`,
                        sublabel: `${h.workers} ${h.workers === 1 ? 'worker' : 'workers'}`,
                        value: h.docs_per_sec,
                        tip: [
                            { label: 'documents per second', value: formatInt(h.docs_per_sec) },
                            { label: 'build time', value: formatMs(h.total_ms) },
                            { label: 'documents', value: formatInt(h.documents) },
                        ],
                    }))}
                    />
                    </>
                )}

                <button type="button" className="link-btn" aria-expanded={table} onClick={() => setTable((v) => !v)}>
                    {table ? 'Hide build history' : 'Show build history as a table'}
                    </button>
                    {table && (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Finished</th>
                                        <th scope="col">Source</th>
                                        <th scope="col" className="num">Documents</th>
                                        <th scope="col" className="num">Terms</th>
                                        <th scope="col" className="num">Time</th>
                                        <th scope="col" className="num">Docs/s</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                            {[...stats.build_history].reverse().map((h, i) => (
                                                <tr key={`${h.built_at}-${i}`}>
                                                    <td>{formatClock(h.built_at)}</td>
                                                    <td>{source(h)}</td>
                                                    <td className="num">{formatInt(h.documents)}</td>
                                                    <td className="num">{formatInt(h.unique_terms)}</td>
                                                    <td className="num">{formatMs(h.loaded_from_disk ? h.load_ms : h.total_ms)}</td>
                                                    <td className="num">{h.docs_per_sec ? formatInt(h.docs_per_sec) : '-'}</td>
                                                    </tr>
                                            ))}
                                            </tbody>
                                            </table>
                                            </div>
                    )}
                    </Panel>
    );
}

function LatencyPanel({ stats }: { stats: StatsResponse }) {
    const q = stats.queries;
    const row = (id: string, label: string, l: typeof q.latency_ms) => ({ id, label, count: l.count, p50: l.p50, p95: l.p95, p99: l.p99 });
    return (
        <Panel id="p-latency" title="Query latency" note="Measured inside the server, from parsing to snippets. Network time is not included.">
            <DotPlot
            ariaLabel="Query latency percentiles for all queries, cache misses and cache hits"
            colors={ORDINAL}
            formatValue={formatMs}
            formatTick={(v) => String(Number(v.toPrecision(3)))}
            rows={[row('all', 'All queries', q.latency_ms), row('miss', 'Cache misses', q.uncached_latency_ms), row('hit', 'Cache hits', q.cached_latency_ms)]}
            />
            <p className="axis-caption">Milliseconds. Percentiles cover the most recent 16,384 queries.</p>
            <dl className="facts">
                <Fact label="Mean, all queries" value={q.latency_ms.count ? formatMs(q.latency_ms.mean) : '-'} />
                <Fact label="Slowest seen" value={q.latency_ms.count ? formatMs(q.latency_ms.max) : '-'} />
                <Fact label="HTTP request, 95th" value={stats.http.latency_ms.count ? formatMs(stats.http.latency_ms.p95) : '-'} />
                </dl>
                </Panel>
    );
}

function TrafficPanel() {
    const { samples } = useStats();
    const idle = samples.length > 1 && samples.every((s) => s.