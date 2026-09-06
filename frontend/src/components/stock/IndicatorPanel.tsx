import type { IndicatorDetail, KlineChart as KlineChartData } from '../../api/types';
import { formatNumber } from '../../lib/formatters';

interface Props {
  indicators: IndicatorDetail;
  /** 每日指标序列（KlineChart 数据）；传入后配合 hoverIdx 实现随主图悬停联动 */
  series?: KlineChartData;
  /** 悬停日期索引（null = 未悬停，显示最新快照） */
  hoverIdx?: number | null;
}

/** 卖出评分 5 项明细的展示顺序与短标签 */
const SELL_ITEMS_LABEL: [string, string][] = [
  ['收盘上涨', '收盘涨'],
  ['BBI支撑', 'BBI支撑'],
  ['非放量阴线', '非放量阴'],
  ['趋势向上', '趋势向上'],
  ['J未死叉', 'J未死叉'],
];

/**
 * 单个数据点：左侧小标签（muted uppercase），右侧数值（mono 加粗，可选色）
 */
function Stat({ label, value, color, mono = true }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-1.5 py-1 rounded-md hover:bg-bg-hover/40 transition-colors">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</span>
      <span className={`text-xs font-bold ${mono ? 'font-mono tabular-nums' : ''}`} style={{ color: color || 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * 区块分组标题（小标签 + 横向渐变线）
 */
function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: 'red' | 'green' | 'blue' | 'gold' | 'purple' | 'cyan' }) {
  const dotColor = {
    red: '#ef4444', green: '#22c55e', blue: '#3b82f6',
    gold: '#f59e0b', purple: '#a855f7', cyan: '#06b6d4',
  }[accent || 'gold'];
  return (
    <div className="flex items-center gap-2 mt-1.5 first:mt-0 mb-0.5">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: dotColor }}>
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
    </div>
  );
}

export default function IndicatorPanel({ indicators, series, hoverIdx }: Props) {
  const { kdj, macd, bbi, rsi, bollinger, vol_ratio, double_line, brick, dmi, signal, sell_score, ma, wr } = indicators;

  const idx = hoverIdx;
  const hovering = idx != null && idx >= 0 && !!series;

  // ── 悬停取值：从每日序列取 hoverIdx 位置的值，未悬停/无序列时回退快照 ──
  const s = series?.indicator_series;
  const overlays = series?.overlays;
  const num = (arr: (number | null)[] | null | undefined, fallback: number | null = null): number | null => {
    if (hovering && arr && idx != null && idx < arr.length) {
      const v = arr[idx];
      if (v != null) return v;
    }
    return fallback;
  };

  const kVal = num(series?.kdj.k, kdj.k) ?? 50;
  const dVal = num(series?.kdj.d, kdj.d) ?? 50;
  const jVal = num(series?.kdj.j, kdj.j) ?? 50;
  const difVal = num(series?.macd.dif, macd.dif) ?? 0;
  const deaVal = num(series?.macd.dea, macd.dea) ?? 0;
  const histVal = num(series?.macd.hist, macd.hist) ?? 0;
  const bbiVal = num(overlays?.bbi, bbi) ?? 0;
  const rsi6Val = num(s?.rsi.rsi6, rsi.rsi6) ?? 50;
  const rsi12Val = num(s?.rsi.rsi12, rsi.rsi12) ?? 50;
  const rsi24Val = num(s?.rsi.rsi24, rsi.rsi24) ?? 50;
  const wr5Val = num(s?.wr.wr5, wr?.wr5 ?? -50) ?? -50;
  const wr10Val = num(s?.wr.wr10, wr?.wr10 ?? -50) ?? -50;
  const vrVal = num(s?.vol_ratio, vol_ratio) ?? 1;
  const ma5Val = num(overlays?.ma5, ma?.ma5) ?? 0;
  const ma10Val = num(overlays?.ma10, ma?.ma10) ?? 0;
  const ma20Val = num(overlays?.ma20, ma?.ma20) ?? 0;
  const ma60Val = num(overlays?.ma60, ma?.ma60) ?? 0;
  const bollU = num(overlays?.boll_upper, bollinger.upper) ?? 0;
  const bollM = num(overlays?.boll_mid, bollinger.mid) ?? 0;
  const bollL = num(overlays?.boll_lower, bollinger.lower) ?? 0;
  const whiteVal = num(overlays?.white_line, double_line.white) ?? 0;
  const yellowVal = num(overlays?.yellow_line, double_line.yellow) ?? 0;
  const dmiPlus = num(s?.dmi.plus, dmi?.plus ?? 0) ?? 0;
  const dmiMinus = num(s?.dmi.minus, dmi?.minus ?? 0) ?? 0;
  const adxVal = num(s?.dmi.adx, dmi?.adx ?? 0) ?? 0;
  const sellVal = num(s?.sell_score, sell_score) ?? 0;

  // 布林位置：悬停时用当日收盘价与上下轨推算；未悬停用快照 position
  const bollPos = hovering && idx != null && series && series.ohlc[idx]
    ? (() => {
        const close = series.ohlc[idx][1];
        const span = bollU - bollL;
        return span > 0 ? Math.min(100, Math.max(0, ((close - bollL) / span) * 100)) : bollinger.position;
      })()
    : bollinger.position;

  // ── 悬停派生标记（从序列推导；未悬停直接用快照徽章）──
  const prevAt = (arr: (number | null)[] | null | undefined): number | null =>
    hovering && arr && idx != null && idx > 0 ? (arr[idx - 1] ?? null) : null;

  const macdGold = hovering
    ? (() => {
        const pDif = prevAt(series?.macd.dif), pDea = prevAt(series?.macd.dea);
        return pDif != null && pDea != null && pDif <= pDea && difVal > deaVal;
      })()
    : !!macd.gold_cross;
  const macdDead = hovering
    ? (() => {
        const pDif = prevAt(series?.macd.dif), pDea = prevAt(series?.macd.dea);
        return pDif != null && pDea != null && pDif >= pDea && difVal < deaVal;
      })()
    : !!macd.dead_cross;
  // 背离/否决为多日形态判定，悬停时不展示（保持快照徽章仅在未悬停显示）
  const showDivergence = !hovering;

  const bullAlign = ma5Val > ma10Val && ma10Val > ma20Val && ma60Val > 0 && ma20Val > ma60Val;

  const whiteCross = hovering
    ? (() => {
        const pW = prevAt(overlays?.white_line), pY = prevAt(overlays?.yellow_line);
        return pW != null && pY != null && pW <= pY && whiteVal > yellowVal;
      })()
    : !!double_line.is_gold_cross;
  const yellowCross = hovering
    ? (() => {
        const pW = prevAt(overlays?.white_line), pY = prevAt(overlays?.yellow_line);
        return pW != null && pY != null && pW >= pY && whiteVal < yellowVal;
      })()
    : !!double_line.is_dead_cross;

  // 砖型：悬停显示当日砖值与颜色；未悬停显示快照（值/块数/趋势色）
  const brickVal = hovering && series ? num(series.brick.values, brick.value) : brick.value;
  const brickColorIdx = hovering && idx != null && series ? (series.brick.colors?.[idx] ?? null) : null;
  const brickTrend = hovering
    ? (brickColorIdx === 1 ? 'RED' : brickColorIdx === -1 ? 'GREEN' : brickColorIdx === 0 ? 'YELLOW' : null)
    : (brick.trend === 'RED' ? 'RED' : brick.trend === 'GREEN' ? 'GREEN' : brick.trend === 'YELLOW' ? 'YELLOW' : null);
  const brickCount = hovering ? null : brick.count;

  const sellColor = sellVal >= 3 ? '#ef4444' : sellVal >= 2 ? '#f59e0b' : '#22c55e';
  const signalColor = signal === 'B1' || signal === 'B2' ? '#22c55e'
    : signal === 'S1' || signal === 'S2' ? '#ef4444'
    : '#94a3b8';

  // 卖出评分 5 项明细（悬停时数字已联动，明细为最新快照）
  const sellItems = indicators.sell_items ?? {};

  return (
    <div className="grid grid-cols-2 gap-x-1 max-h-[600px] overflow-y-auto pr-1">
      {/* 交易信号（横跨两列；悬停时保持最新快照，多日形态判定不随单日联动） */}
      <div className="col-span-2 mb-1.5 pb-1.5 border-b border-border/40">
        <div className="flex items-center justify-between px-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">交易信号</span>
            {macd.veto && !hovering && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-red/15 text-accent-red font-bold tracking-wide">MACD 否决</span>}
            {hovering && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-bold tracking-wide">悬停 · 信号为快照</span>}
          </div>
          <span className="text-sm font-black font-mono tabular-nums tracking-wide" style={{ color: signalColor }}>
            {signal}
          </span>
        </div>
      </div>

      {/* KDJ */}
      <SectionLabel accent="gold">KDJ</SectionLabel>
      <div className="col-span-2 grid grid-cols-3 gap-x-1">
        <Stat label="K" value={formatNumber(kVal)} />
        <Stat label="D" value={formatNumber(dVal)} />
        <Stat label="J" value={formatNumber(jVal)} color={jVal < 0 ? '#22c55e' : jVal > 100 ? '#ef4444' : undefined} />
      </div>

      {/* MACD */}
      <SectionLabel accent="blue">MACD</SectionLabel>
      <div className="col-span-2 grid grid-cols-3 gap-x-1">
        <Stat label="DIF" value={formatNumber(difVal, 3)} />
        <Stat label="DEA" value={formatNumber(deaVal, 3)} />
        <Stat label="柱" value={formatNumber(histVal, 3)} color={histVal >= 0 ? '#ef4444' : '#22c55e'} />
      </div>
      {(macdGold || macdDead || (showDivergence && (macd.top_divergence || macd.bottom_divergence))) && (
        <div className="col-span-2 px-1.5 mb-1 flex items-center gap-2 flex-wrap">
          {macdGold && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/15 text-accent-green font-bold">金叉</span>}
          {macdDead && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-red/15 text-accent-red font-bold">死叉</span>}
          {showDivergence && macd.top_divergence && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-red/15 text-accent-red font-bold tracking-wide">顶背离</span>}
          {showDivergence && macd.bottom_divergence && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/15 text-accent-green font-bold tracking-wide">底背离</span>}
        </div>
      )}

      {/* RSI + BBI 合并一行 */}
      <SectionLabel accent="purple">RSI / BBI</SectionLabel>
      <div className="col-span-2 grid grid-cols-4 gap-x-1">
        <Stat label="6"  value={formatNumber(rsi6Val)} color={rsi6Val > 70 ? '#ef4444' : rsi6Val < 30 ? '#22c55e' : undefined} />
        <Stat label="12" value={formatNumber(rsi12Val)} />
        <Stat label="24" value={formatNumber(rsi24Val)} />
        <Stat label="BBI" value={formatNumber(bbiVal)} />
      </div>

      {/* WR — 威廉指标 */}
      {wr && (
        <>
          <SectionLabel accent="purple">WR</SectionLabel>
          <div className="col-span-2 grid grid-cols-2 gap-x-1">
            <Stat label="WR5"  value={formatNumber(wr5Val)} color={wr5Val < -80 ? '#22c55e' : wr5Val > -20 ? '#ef4444' : undefined} />
            <Stat label="WR10" value={formatNumber(wr10Val)} color={wr10Val < -80 ? '#22c55e' : wr10Val > -20 ? '#ef4444' : undefined} />
          </div>
        </>
      )}

      {/* MA — 均线组 */}
      {ma && (
        <>
          <SectionLabel accent="blue">均线 MA</SectionLabel>
          <div className="col-span-2 grid grid-cols-4 gap-x-1">
            <Stat label="MA5"  value={formatNumber(ma5Val)}  color={ma5Val > ma20Val ? '#ef4444' : undefined} />
            <Stat label="MA10" value={formatNumber(ma10Val)} />
            <Stat label="MA20" value={formatNumber(ma20Val)} />
            <Stat label="MA60" value={formatNumber(ma60Val)} />
          </div>
          {bullAlign && (
            <div className="col-span-2 px-1.5 mb-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/15 text-accent-green font-bold">多头排列</span>
            </div>
          )}
        </>
      )}

      {/* 布林带 — 一行紧凑 */}
      <SectionLabel accent="cyan">布林带</SectionLabel>
      <div className="col-span-2 grid grid-cols-4 gap-x-1">
        <Stat label="上" value={formatNumber(bollU)} />
        <Stat label="中" value={formatNumber(bollM)} />
        <Stat label="下" value={formatNumber(bollL)} />
        <Stat label="位" value={`${formatNumber(bollPos)}%`}
              color={bollPos > 80 ? '#ef4444' : bollPos < 20 ? '#22c55e' : undefined} />
      </div>

      {/* 双线战法 + 量比 — 单独突出 */}
      <SectionLabel accent="red">双线战法</SectionLabel>
      <div className="col-span-2 grid grid-cols-4 gap-x-1">
        <Stat label="白" value={formatNumber(whiteVal)} color="#ffffff" />
        <Stat label="黄" value={formatNumber(yellowVal)} color="#fbbf24" />
        <Stat label="比" value={formatNumber(vrVal)} color={vrVal > 2 ? '#f59e0b' : undefined} />
        <Stat label="砖" value={hovering ? formatNumber(brickVal ?? 0) : `${brickCount}块`} color={brickTrend === 'RED' ? '#ef4444' : brickTrend === 'GREEN' ? '#22c55e' : brickTrend === 'YELLOW' ? '#fbbf24' : undefined} />
      </div>
      {(whiteCross || yellowCross) && (
        <div className="col-span-2 px-1.5 mb-1 flex items-center gap-2">
          {whiteCross && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/15 text-accent-green font-bold">双线金叉</span>}
          {yellowCross && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-red/15 text-accent-red font-bold">双线死叉</span>}
        </div>
      )}

      {/* DMI */}
      <SectionLabel accent="green">DMI</SectionLabel>
      <div className="col-span-2 grid grid-cols-3 gap-x-1">
        <Stat label="+DI" value={formatNumber(dmiPlus)} color="#22c55e" />
        <Stat label="-DI" value={formatNumber(dmiMinus)} color="#ef4444" />
        <Stat label="ADX" value={formatNumber(adxVal)} color={adxVal > 25 ? '#f59e0b' : undefined} />
      </div>

      {/* 卖出评分（横跨两列 + 进度条 + 5 项明细） */}
      <div className="col-span-2 mt-2 pt-2 border-t border-border/40 px-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">卖出评分</span>
          <span className="text-base font-black font-mono tabular-nums" style={{ color: sellColor }}>
            {sellVal}<span className="text-text-muted text-xs font-bold">/5</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(sellVal / 5) * 100}%`, backgroundColor: sellColor }}
          />
        </div>
        {/* 5 项明细（未悬停显示；悬停时数字已联动，明细为最新快照） */}
        {!hovering && Object.keys(sellItems).length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2">
            {SELL_ITEMS_LABEL.map(([key, label]) => {
              const ok = sellItems[key];
              if (ok == null) return null;
              return (
                <div key={key} className="flex items-center gap-1.5 text-[10px]">
                  <span className={`font-bold ${ok ? 'text-accent-green' : 'text-accent-red'}`}>{ok ? '✓' : '✗'}</span>
                  <span className={ok ? 'text-text-secondary' : 'text-text-muted'}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
