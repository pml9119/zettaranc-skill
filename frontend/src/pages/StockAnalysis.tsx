import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStockAnalysis, useKlineData } from '../hooks/useStockAnalysis';
import { useWindowWidth } from '../hooks/useWindowWidth';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import KlineChart from '../components/charts/KlineChart';
import RadarChart from '../components/charts/RadarChart';
import IndicatorPanel from '../components/stock/IndicatorPanel';
import ScoreCard from '../components/stock/ScoreCard';
import SignalTimeline from '../components/stock/SignalTimeline';
import DiagnosisCard from '../components/stock/DiagnosisCard';
import CommentaryCard from '../components/stock/CommentaryCard';
import StockSearchInput from '../components/stock/StockSearchInput';
import ApiErrorState from '../components/ui/ApiErrorState';
import { fetchWatchlist, addToWatchlist } from '../api/watchlist';
import { computeDiagnosisHover } from '../lib/diagnosisHover';
import { formatNumber, formatPct, pctColor, formatVolume } from '../lib/formatters';

// 顶部信息卡：加入自选按钮
function WatchlistButton({ tsCode }: { tsCode: string }) {
  const queryClient = useQueryClient();
  const { data: watchlist } = useQuery({ queryKey: ['watchlist'], queryFn: fetchWatchlist });
  const alreadyAdded = !!watchlist?.items?.some((w) => w.ts_code === tsCode);

  const addMutation = useMutation({
    mutationFn: () => addToWatchlist(tsCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    onError: (err) => {
      console.error('加入自选失败：', err);
      window.alert('加入自选失败，请稍后重试');
    },
  });

  if (alreadyAdded) {
    return (
      <button
        type="button"
        disabled
        className="shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-md border border-accent-gold/30 text-accent-gold/50 bg-bg-hover/40 cursor-default"
      >
        ✓ 已加入自选
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => addMutation.mutate()}
      disabled={addMutation.isPending}
      className="shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-md border border-accent-gold/60 text-accent-gold bg-accent-gold/10 hover:bg-accent-gold/20 transition-all active:scale-95 disabled:opacity-60"
    >
      {addMutation.isPending ? '加入中...' : '★ 加入自选'}
    </button>
  );
}

// 行情快照小格
function SnapshotCell({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between px-2 py-1.5 rounded-md bg-bg-hover/30 border border-border/20">
      <span className="text-[10px] text-text-muted font-medium">{label}</span>
      <span className={`text-xs font-bold tabular-nums font-mono text-text-primary ${valueClass}`}>{value}</span>
    </div>
  );
}

// 均线项
function MaItem({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-mono tabular-nums">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-secondary ml-1">{formatNumber(value)}</span>
    </span>
  );
}

// 自选股内快速切换导航（上一只 / 下一只）
function NavArrows({ tsCode }: { tsCode: string }) {
  const navigate = useNavigate();
  const { data: watchlist } = useQuery({ queryKey: ['watchlist'], queryFn: fetchWatchlist });
  const items = watchlist?.items ?? [];
  const idx = items.findIndex((w) => w.ts_code === tsCode);
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx >= 0 && idx < items.length - 1 ? items[idx + 1] : null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && navigate(`/stock/${prev.ts_code}`)}
        title={prev ? `上一只：${prev.name ?? prev.ts_code}` : '已在自选列表开头'}
        className="px-2 py-1 text-[10px] font-bold rounded-md border border-border/40 text-text-muted hover:text-accent-gold hover:border-accent-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        ‹ 上一只
      </button>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && navigate(`/stock/${next.ts_code}`)}
        title={next ? `下一只：${next.name ?? next.ts_code}` : '已在自选列表末尾'}
        className="px-2 py-1 text-[10px] font-bold rounded-md border border-border/40 text-text-muted hover:text-accent-gold hover:border-accent-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        下一只 ›
      </button>
      <span className="text-[10px] text-text-muted ml-1 hidden sm:inline">
        {idx >= 0 ? `自选 ${idx + 1}/${items.length}` : '当前不在自选中'}
      </span>
    </div>
  );
}

// 头部信息卡骨架
function HeaderSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-bg-secondary via-bg-card to-bg-secondary p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-7 bg-bg-hover/60 rounded w-1/2"></div>
        <div className="h-10 bg-bg-hover/60 rounded w-1/3"></div>
        <div className="h-12 bg-bg-hover/60 rounded w-full"></div>
        <div className="h-4 bg-bg-hover/60 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export default function StockAnalysis() {
  const { tsCode = '' } = useParams<{ tsCode: string }>();
  const navigate = useNavigate();
  const [klineRange, setKlineRange] = useState<number>(120);
  // 主图悬停日期索引（null = 未悬停），驱动技术指标卡随轴指针联动
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // 分析数据与 K 线周期同步：切换档位时指标/信号/诊断随同一 days 重新拉取（后端 5 分钟缓存兜底）
  const { data: analysis, isLoading: loadingAnalysis, error: analysisError, refetch: refetchAnalysis } =
    useStockAnalysis(tsCode, klineRange);
  const { data: klineData, isLoading: loadingKline, error: klineError, refetch: refetchKline } =
    useKlineData(tsCode, klineRange);

  const priceChange = analysis && analysis.prev_close > 0
    ? ((analysis.price - analysis.prev_close) / analysis.prev_close) * 100
    : (analysis?.pct_chg || 0);

  // 行情快照：klineData 末根数据
  const lastSnapshot = useMemo(() => {
    if (!klineData || klineData.ohlc.length === 0) return null;
    const lastOhlc = klineData.ohlc[klineData.ohlc.length - 1];
    const lastVol = klineData.volumes[klineData.volumes.length - 1];
    // 换手率取最近一个非零值：估值快照（daily_valuation）截止日早于最新行情时，
    // 末根 turnover 为 0，倒序取最近可用换手率避免卡片显示 0.00%（2026-08-16）
    let lastTurnover = 0;
    const rawTurnovers = klineData.turnovers ?? [];
    for (let i = rawTurnovers.length - 1; i >= 0; i--) {
      const t = rawTurnovers[i];
      if (t != null && t > 0) { lastTurnover = t; break; }
    }
    return {
      open: lastOhlc[0],
      low: lastOhlc[2],
      high: lastOhlc[3],
      close: lastOhlc[1],
      vol: lastVol,
      turnover: lastTurnover,
    };
  }, [klineData]);

  // K 线图高度：桌面 950（1000 的 0.95 倍）；手机端按卡片宽度 ×1.4102（×1.4844 的 0.95 倍）
  const width = useWindowWidth();
  const klineCardRef = useRef<HTMLDivElement | null>(null);
  const [klineCardWidth, setKlineCardWidth] = useState(0);
  useEffect(() => {
    const el = klineCardRef.current;
    if (!el) return;
    const update = () => setKlineCardWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const chartHeight = width < 1024
    ? Math.max(300, Math.round((klineCardWidth || width) * 1.4102))
    : 950;

  return (
    <div className="space-y-5">
      {/* ============ 左右两大列：K 线图 3/5 | 信息卡 + 指标/评分 2/5 ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
        {/* ① 左列 3/5：K 线图卡 */}
        <div>
          <Card title="K 线图">
            <div ref={klineCardRef}>
            {loadingKline && (
              <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
              </div>
            )}
            {!loadingKline && klineError && (
              <ApiErrorState message="K 线数据加载失败" onRetry={refetchKline} />
            )}
            {!loadingKline && !klineError && klineData && (
              <KlineChart data={klineData} height={chartHeight} range={klineRange} onRangeChange={setKlineRange} onHover={setHoverIdx} />
            )}
            </div>
          </Card>
        </div>

        {/* 右列 2/5 */}
        <div className="space-y-5">
          {/* ② 股票信息卡 */}
          {loadingAnalysis && <HeaderSkeleton />}

          {!loadingAnalysis && analysisError && (
            <div className="rounded-2xl border border-accent-red/30 bg-bg-secondary p-6 flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-3 text-accent-red opacity-70">⚠</div>
              <div className="text-sm font-bold text-text-primary mb-1">股票分析数据加载失败</div>
              <div className="text-xs text-text-muted mb-4">{analysisError.message}</div>
              <button
                type="button"
                onClick={() => refetchAnalysis()}
                className="text-xs font-bold text-accent-gold border border-accent-gold/40 px-3 py-1.5 rounded-md hover:bg-accent-gold/10 transition-all"
              >
                重试
              </button>
            </div>
          )}

          {!loadingAnalysis && !analysisError && analysis && (
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-bg-secondary via-bg-card to-bg-secondary">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.10),transparent_55%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.08),transparent_55%)]"></div>
              <div className="relative p-5">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                  {/* 代码/名称/行业 + 现价涨跌 */}
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-xl font-black text-text-primary tracking-tight font-mono">
                        {analysis.ts_code}
                      </h1>
                      <span className="text-sm text-text-secondary bg-bg-hover/60 px-2.5 py-0.5 rounded-md border border-border/30 font-medium">
                        {analysis.name}
                      </span>
                      {analysis.industry && (
                        <span className="text-[10px] text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-md border border-accent-cyan/30 font-semibold tracking-wide">
                          {analysis.industry}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl font-black text-text-primary tabular-nums tracking-tight leading-none">
                        ¥{formatNumber(analysis.price)}
                      </span>
                      <span className={`text-base font-bold tabular-nums ${pctColor(priceChange)}`}>
                        {priceChange >= 0 ? '▲' : '▼'} {formatPct(priceChange)}
                      </span>
                      {analysis.prev_close > 0 && (
                        <span className="text-[10px] text-text-muted font-mono">昨收 ¥{formatNumber(analysis.prev_close)}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted mt-2 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
                      <span className="tracking-wider">DATA AS OF</span>
                      <span className="font-mono text-text-secondary">{analysis.trade_date}</span>
                    </div>
                  </div>

                  {/* 行情快照格 */}
                  {lastSnapshot && (() => {
                    const { open, low, high, vol, turnover } = lastSnapshot;
                    const prevClose = analysis.prev_close || open;
                    const openClass = open > prevClose ? 'text-up' : open < prevClose ? 'text-down' : '';
                    return (
                      <div className="grid grid-cols-3 gap-2 min-w-[280px] flex-1 max-w-md">
                        <SnapshotCell label="今开" value={`¥${formatNumber(open)}`} valueClass={openClass} />
                        <SnapshotCell label="最高" value={`¥${formatNumber(high)}`} valueClass="text-up" />
                        <SnapshotCell label="最低" value={`¥${formatNumber(low)}`} valueClass="text-down" />
                        <SnapshotCell label="成交量" value={vol != null ? formatVolume(vol) : '--'} />
                        <SnapshotCell label="成交额" value={vol != null ? formatVolume(vol * analysis.price) : '--'} />
                        <SnapshotCell label="换手" value={turnover != null && turnover > 0 ? `${turnover.toFixed(2)}%` : '--'} />
                      </div>
                    );
                  })()}

                  {/* 均线 + 52 周高 */}
                  {analysis.indicators?.ma && (() => {
                    const ma = analysis.indicators.ma;
                    const dist = ma.high_52w_dist ?? 0;
                    return (
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[11px] pt-1 min-w-[220px]">
                        <MaItem label="MA5" value={ma.ma5} />
                        <MaItem label="MA10" value={ma.ma10} />
                        <MaItem label="MA20" value={ma.ma20} />
                        <MaItem label="MA60" value={ma.ma60} />
                        <span className="text-text-muted">|</span>
                        <span className="font-mono tabular-nums">
                          <span className="text-text-muted">52周高</span>
                          <span className="text-text-secondary ml-1">¥{formatNumber(ma.high_52w)}</span>
                        </span>
                        <span className="text-text-muted tabular-nums">距高 +{formatNumber(dist, 1)}%</span>
                      </div>
                    );
                  })()}

                  {/* 操作区：加入自选 + 搜索 + prev/next */}
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <WatchlistButton tsCode={analysis.ts_code} />
                      <NavArrows tsCode={analysis.ts_code} />
                    </div>
                    <div className="w-56">
                      <StockSearchInput onNavigate={(code) => navigate(`/stock/${code}`)} size="compact" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ③ 技术指标 | 综合评分（1:1） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 技术指标（含战法信号） */}
            <div>
              {!loadingAnalysis && !analysisError && analysis && (
                <div className="space-y-5">
                  <Card title="技术指标">
                    <IndicatorPanel indicators={analysis.indicators} series={klineData} hoverIdx={hoverIdx} />
                  </Card>
                  <Card title="战法信号">
                    <SignalTimeline signals={analysis.signals} />
                  </Card>
                </div>
              )}
            </div>

            {/* 综合评分（评分 + 雷达 + 主力阶段 + 诊断） */}
            <div>
              {!loadingAnalysis && !analysisError && analysis && (() => {
                const hovering = hoverIdx != null && hoverIdx >= 0 && !!klineData;
                // 主力阶段随悬停联动（逐日序列）；未悬停显示快照（含置信度）
                const waveNow = hovering && klineData?.waves_sequence?.[hoverIdx!]
                  ? klineData.waves_sequence[hoverIdx!]
                  : (analysis.waves?.wave ?? null);
                const kirinNow = hovering && klineData?.kirin_sequence?.[hoverIdx!]
                  ? klineData.kirin_sequence[hoverIdx!]
                  : (analysis.kirin?.phase ?? null);
                // 悬停日综合评分（indicator_series.score，滑动窗口口径与快照一致）
                const hoverScore = (() => {
                  if (!hovering || !klineData?.indicator_series) return null;
                  const s = klineData.indicator_series.score;
                  const t = s.total[hoverIdx!];
                  if (t == null) return null;
                  return {
                    total: t,
                    b1: s.b1[hoverIdx!] ?? 0,
                    trend: s.trend[hoverIdx!] ?? 0,
                    volume: s.volume[hoverIdx!] ?? 0,
                    risk: s.risk[hoverIdx!] ?? 0,
                    reasons: s.reasons[hoverIdx!] ?? [],
                    warnings: s.warnings[hoverIdx!] ?? [],
                  };
                })();
                const showWaves = hovering ? waveNow !== null && waveNow !== '未知' : !!analysis.waves;
                const showKirin = hovering ? kirinNow !== null && kirinNow !== '未知' : !!analysis.kirin;
                return (
                <div className="space-y-5">
                  <Card title="综合评分">
                    {hovering && (
                      <div className="mb-3">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-bold tracking-wide">悬停 · 评分随轴指针联动</span>
                      </div>
                    )}
                    <div className="space-y-4">
                      <ScoreCard score={analysis.score} hover={hoverScore} />
                      <div className="border-t border-border/40 pt-4">
                        <RadarChart score={analysis.score} height={220} hover={hoverScore} />
                      </div>
                      {(showWaves || showKirin) && (
                        <div className="border-t border-border/40 pt-4 space-y-3">
                          {showWaves && (
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent-blue/[0.10] to-accent-purple/[0.10] rounded-lg border border-border/30">
                              <div>
                                <div className="text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">三波理论</div>
                                <div className="text-sm font-bold text-text-primary">{waveNow}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">置信度</div>
                                <div className="text-base font-black text-accent-gold tabular-nums">
                                  {hovering ? '—' : `${(analysis.waves!.confidence * 100).toFixed(0)}%`}
                                </div>
                              </div>
                            </div>
                          )}
                          {showKirin && (
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent-gold/[0.10] to-accent-orange/[0.10] rounded-lg border border-border/30">
                              <div>
                                <div className="text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">麒麟会</div>
                                <div className="text-sm font-bold text-text-primary">{kirinNow}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">置信度</div>
                                <div className="text-base font-black text-accent-gold tabular-nums">
                                  {hovering ? '—' : `${(analysis.kirin!.confidence * 100).toFixed(0)}%`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                  <Card title="诊断报告">
                    <DiagnosisCard diagnosis={analysis.diagnosis} hover={hovering ? computeDiagnosisHover(klineData!, hoverIdx!) : null} />
                  </Card>
                </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ============ ④ 底部：Z哥点评（8/12 居中，长文更易读） ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="col-span-1 lg:col-span-8 lg:col-start-3">
          <CommentaryCard tsCode={tsCode} />
        </div>
      </div>
    </div>
  );
}
