import React from 'react';
import type { EChartsType } from 'echarts/core';
import EChartsReact from '../../lib/EChartsReact';
import type { KlineChart as KlineDataType, ChartOverlays } from '../../api/types';
import { SIGNAL_COLORS } from '../../lib/constants';
import { formatNumber, formatVolume, formatVolumeAxis } from '../../lib/formatters';

// ── 工具函数：EXIST (N期内是否存在条件) ──
function EXIST(condition: boolean[], period: number): boolean[] {
  const result: boolean[] = [];
  for (let i = 0; i < condition.length; i++) {
    let found = false;
    for (let j = Math.max(0, i - period + 1); j <= i; j++) {
      if (condition[j]) { found = true; break; }
    }
    result.push(found);
  }
  return result;
}

// ── 工具函数：INTPART (取整) ──
function INTPART(v: number): number {
  return v >= 0 ? Math.floor(v) : Math.ceil(v);
}

// ── 工具函数：ROUND (四舍五入) ──
function ROUND(v: number): number {
  return Math.round(v);
}

interface Props {
  data: KlineDataType;
  height?: number;
  /** 受控周期（与 onRangeChange 配套使用，由页面层驱动后端请求天数）；不传则组件内部 state 兜底 */
  range?: number;
  onRangeChange?: (r: number) => void;
  /** 悬停日期索引上报（null = 离开图表），供页面级联动（如技术指标卡随悬停变化） */
  onHover?: (idx: number | null) => void;
}

// 面板开关类型：KDJ / MACD / 砖型 / 呼吸波
type PanelKey = 'kdj' | 'macd' | 'brick' | 'breath';

export default function KlineChart({ data, height = 820, range: controlledRange, onRangeChange, onHover }: Props) {
  // ── 周期切换：尾部切片保留最近 N 根 ──
  const [internalRange, setInternalRange] = React.useState<number>(120);
  const range = controlledRange ?? internalRange;
  const handleRangeChange = (r: number) => {
    setInternalRange(r);
    setZoom({ start: 0, end: 100 }); // 切换周期重置缩放
    onRangeChange?.(r);
  };
  // ── 面板显隐开关（默认全开）──
  const [panels, setPanels] = React.useState<Record<PanelKey, boolean>>({
    kdj: true,
    macd: true,
    brick: true,
    breath: true,
  });
  // ── 缩放状态（dataZoom start/end 百分比）──
  // notMerge setOption 每次悬停会重建图表并重置 dataZoom，
  // 因此把缩放状态提升为 state，由 datazoom 事件驱动，setOption 时显式写回
  const [zoom, setZoom] = React.useState<{ start: number; end: number }>({ start: 0, end: 100 });
  // ── 图例勾选状态（同理，notMerge 重建时显式写回，避免悬停丢失勾选）──
  const [legendSelected, setLegendSelected] = React.useState<Record<string, boolean>>({
    'MA6': false,
    'MA6+8%': false,
    'MA24': false,
    '布林上': false,
    '布林中': false,
    '布林下': false,
  });
  // ── 悬停日期索引（副图上方值随悬停变化；null = 显示最新值）──
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  // ── 右键拖拽平移（pan）：mousedown 记录起点 → mousemove dispatchAction 平移窗口 →
  //    mouseup 同步 zoom state。拖拽中抑制悬停联动与 datazoom 事件回流，避免重建卡顿 ──
  const containerEl = React.useRef<HTMLDivElement | null>(null);
  const [instance, setInstance] = React.useState<EChartsType | null>(null);
  const zoomRef = React.useRef(zoom);
  const isDraggingRef = React.useRef(false);
  const dragStateRef = React.useRef<{
    x: number;
    startZoom: { start: number; end: number };
    currentZoom: { start: number; end: number };
  } | null>(null);

  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  React.useEffect(() => {
    const el = containerEl.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return; // 仅右键
      e.preventDefault();
      isDraggingRef.current = true;
      dragStateRef.current = {
        x: e.clientX,
        startZoom: { ...zoomRef.current },
        currentZoom: { ...zoomRef.current },
      };
    };
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag || !instance) return;
      const width = containerEl.current?.clientWidth || 1;
      const span = drag.startZoom.end - drag.startZoom.start;
      // 拖动像素 → 窗口百分比：左拖（dx<0）向前平移（start 减小）
      const movePct = ((e.clientX - drag.x) / width) * span;
      const newStart = Math.min(Math.max(0, drag.startZoom.start + movePct), 100 - span);
      const newEnd = newStart + span;
      drag.currentZoom = { start: newStart, end: newEnd };
      instance.dispatchAction({ type: 'dataZoom', start: newStart, end: newEnd });
    };
    const onMouseUp = () => {
      const drag = dragStateRef.current;
      if (!drag) return;
      isDraggingRef.current = false;
      dragStateRef.current = null;
      setZoom(drag.currentZoom);
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault(); // 图表区域右键用于拖拽，禁用默认菜单

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('contextmenu', onContextMenu);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('contextmenu', onContextMenu);
    };
  }, [instance]);

  // 切片后的数据：所有 series / 坐标轴都用 sliced 版本，避免索引错位
  const sliced = React.useMemo(() => {
    const total = data.dates.length;
    const start = Math.max(0, total - range);
    const sliceArr = <T,>(a: readonly T[]): T[] => a.slice(start);
    const sliceNullable = <T,>(a: readonly (T | null)[]): (T | null)[] => a.slice(start);
    const overlaysSliced: ChartOverlays = {
      ma5: sliceNullable(data.overlays.ma5),
      ma10: sliceNullable(data.overlays.ma10),
      ma20: sliceNullable(data.overlays.ma20),
      ma60: sliceNullable(data.overlays.ma60),
      ma6: sliceNullable(data.overlays.ma6 ?? []),
      ma24_green: sliceNullable(data.overlays.ma24_green ?? []),
      ma24_cyan: sliceNullable(data.overlays.ma24_cyan ?? []),
      bbi: sliceNullable(data.overlays.bbi),
      boll_upper: sliceNullable(data.overlays.boll_upper),
      boll_mid: sliceNullable(data.overlays.boll_mid),
      boll_lower: sliceNullable(data.overlays.boll_lower),
      white_line: sliceNullable(data.overlays.white_line),
      yellow_line: sliceNullable(data.overlays.yellow_line),
    };
    const firstDate = data.dates[start];
    return {
      dates: sliceArr(data.dates),
      ohlc: sliceArr(data.ohlc),
      volumes: sliceArr(data.volumes),
      turnovers: data.turnovers ? sliceArr(data.turnovers) : undefined,
      pct_chgs: sliceArr(data.pct_chgs),
      overlays: overlaysSliced,
      signal_markers: data.signal_markers.filter((m) => m.date >= firstDate),
      kdj: {
        k: sliceNullable(data.kdj.k),
        d: sliceNullable(data.kdj.d),
        j: sliceNullable(data.kdj.j),
      },
      macd: {
        dif: sliceNullable(data.macd.dif),
        dea: sliceNullable(data.macd.dea),
        hist: sliceNullable(data.macd.hist),
      },
      brick: {
        values: sliceNullable(data.brick.values),
        colors: sliceNullable(data.brick.colors),
      },
      waves_sequence: data.waves_sequence ? sliceArr(data.waves_sequence) : undefined,
      kirin_sequence: data.kirin_sequence ? sliceArr(data.kirin_sequence) : undefined,
      breathing_wave: data.breathing_wave ? sliceArr(data.breathing_wave) : undefined,
    };
  }, [data, range]);

  const {
    dates,
    ohlc,
    volumes,
    turnovers,
    pct_chgs,
    overlays,
    signal_markers,
    kdj,
    macd,
    brick,
    waves_sequence,
    kirin_sequence,
    breathing_wave,
  } = sliced;

  const [bgMode, setBgMode] = React.useState<'none' | 'kirin' | 'waves'>('kirin');

  const upColor = '#ef4444';
  const downColor = '#22c55e';
  const n = dates.length;

  // ── 主图指标计算：金色蜡烛 / 距离标签 / J 值等（MA6/MA24/布林/BBI 已由后端全量预热计算）──
  const start = Math.max(0, data.dates.length - range);
  const firstDate = data.dates[start];

  const {
    highs,
    ma6,
    ma6Plus8,
    ma24Green,
    ma24Cyan,
    goldenCond,
    goldenTopScatter,
    goldenBottomScatter,
    jLastInt,
    lastPctChg,
    jColor,
  } = React.useMemo(() => {
    const closes = data.ohlc.map((o) => o[1]);
    const highs = data.ohlc.map((o) => o[3]);
    const lows = data.ohlc.map((o) => o[2]);
    const nn = data.dates.length;
    const J_LOW = 15;
    const upC = '#ef4444';
    const downC = '#22c55e';

    // MA6 / MA24 分段线：直接用后端全量预热后的数据（短周期档位左侧不空白）
    const ma6Full = data.overlays.ma6 ?? [];
    const ma6Plus8Full: (number | null)[] = [];
    for (let i = 0; i < nn; i++) {
      const m = ma6Full[i];
      if (m !== null && m !== undefined && m !== 0 && ((closes[i] - m) / m) * 100 > 8) {
        ma6Plus8Full.push(m * 1.08);
      } else {
        ma6Plus8Full.push(null);
      }
    }
    const ma24GreenFull = data.overlays.ma24_green ?? [];
    const ma24CyanFull = data.overlays.ma24_cyan ?? [];

    // ── 金色蜡烛条件：J < 15 且涨跌幅在 [-2, 1.8] 且 22 日内历史存在（直接用后端 kdj.j / pct_chgs）──
    const jLowCond: boolean[] = [];
    for (let i = 0; i < nn; i++) {
      const j = data.kdj.j[i];
      const chg = data.pct_chgs[i];
      jLowCond.push(j !== null && j !== undefined && j < J_LOW && chg >= -2 && chg <= 1.8);
    }
    const historyCond = EXIST(jLowCond, 22);
    const goldenCondFull: boolean[] = [];
    for (let i = 0; i < nn; i++) goldenCondFull.push(historyCond[i] && jLowCond[i]);

    // ── 距离百分比 + 金色蜡烛标签（上/下分开，基于完整数据生成，再用日期过滤切片）──
    const goldenTopScatterFull: { value: [string, number, string, string] }[] = [];
    const goldenBottomScatterFull: { value: [string, number, string, string] }[] = [];
    for (let i = 0; i < nn; i++) {
      if (!goldenCondFull[i]) continue;
      const c = closes[i];
      const w = data.overlays.white_line[i];
      const yl = data.overlays.yellow_line[i];
      const dq = w !== null && w !== 0 ? ROUND(((c - w) / w) * 100) : null;   // 到短期线（白线）距离
      const dk = yl !== null && yl !== 0 ? ROUND(((c - yl) / yl) * 100) : null; // 到多空线（黄线）距离
      if (w !== null && c > w) {
        if (dq !== null) goldenTopScatterFull.push({ value: [data.dates[i], highs[i], String(dq), '#ffffff'] });
        if (dk !== null) goldenBottomScatterFull.push({ value: [data.dates[i], lows[i], String(dk), dk > 0 ? upC : downC] });
      } else if (dk !== null) {
        goldenTopScatterFull.push({ value: [data.dates[i], highs[i], String(dk), dk > 0 ? upC : downC] });
      }
    }

    // ── 末根 J 值 / 涨跌幅 / J 颜色（末根 = 完整数据末根 = 切片末根）──
    const jLast = data.kdj.j[nn - 1];
    const jLastInt = jLast !== null && jLast !== undefined ? INTPART(jLast) : null;
    const lastPctChg = data.pct_chgs[nn - 1];
    const jColor = goldenCondFull[nn - 1] ? '#ffff00' : '#ffffff';

    // ── 返回全量数组（页面层已按 range 请求数据，data 长度即展示长度）──
    return {
      highs,
      // MA6/MA24 后端已按窗口预热好，直接使用
      ma6: ma6Full as (number | null)[],
      ma6Plus8: ma6Plus8Full,
      ma24Green: ma24GreenFull as (number | null)[],
      ma24Cyan: ma24CyanFull as (number | null)[],
      goldenCond: goldenCondFull,
      goldenTopScatter: goldenTopScatterFull,
      goldenBottomScatter: goldenBottomScatterFull,
      jLastInt, lastPctChg, jColor,
    };
  }, [data, start, firstDate]);

  // ── markPoint 信号标记 ──
  const lastValid = (arr: (number | null)[]): number | null => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== null && arr[i] !== undefined) return arr[i];
    }
    return null;
  };

  const lastWhite = lastValid(overlays.white_line);
  const lastYellow = lastValid(overlays.yellow_line);
  const lastBbi = lastValid(overlays.bbi);
  const lastDate = dates[dates.length - 1];

  const buyMarkers = signal_markers
    .filter((m) => m.action === 'BUY')
    .map((m) => ({
      name: m.type,
      coord: [m.date, m.price],
      value: m.type,
      itemStyle: { color: SIGNAL_COLORS[m.type] || SIGNAL_COLORS.BUY },
    }));

  const sellMarkers = signal_markers
    .filter((m) => m.action === 'SELL')
    .map((m) => ({
      name: m.type,
      coord: [m.date, m.price],
      value: m.type,
      itemStyle: { color: SIGNAL_COLORS[m.type] || SIGNAL_COLORS.SELL },
    }));

  // ── 背景色块（麒麟/三波）──
  const kirinColors: Record<string, string> = {
    '吸筹': 'rgba(59, 130, 246, 0.15)',
    '拉升': 'rgba(239, 68, 68, 0.15)',
    '派发': 'rgba(245, 158, 11, 0.15)',
    '回落': 'rgba(34, 197, 94, 0.12)',
  };

  const waveColors: Record<string, string> = {
    '建仓波': 'rgba(139, 92, 246, 0.15)',
    '拉升波': 'rgba(239, 68, 68, 0.15)',
    '冲刺波': 'rgba(244, 63, 94, 0.20)',
  };

  interface MarkAreaItem {
    name?: string;
    xAxis?: string;
    itemStyle?: { color?: string };
    label?: Record<string, unknown>;
  }

  const generateMarkArea = (sequence: string[] | undefined, colors: Record<string, string>) => {
    const areas: Array<[MarkAreaItem, MarkAreaItem]> = [];
    if (!sequence || sequence.length === 0) return undefined;

    let startIdx = 0;
    let currentVal: string | null = sequence[0];

    for (let i = 1; i <= sequence.length; i++) {
      const val = i < sequence.length ? sequence[i] : null;
      if (val !== currentVal) {
        if (currentVal && currentVal !== '未知' && colors[currentVal]) {
          areas.push([
            {
              name: currentVal,
              xAxis: dates[startIdx],
              itemStyle: { color: colors[currentVal] },
              label: {
                show: true,
                position: 'insideTop',
                color: '#94a3b8',
                fontSize: 8,
                opacity: 0.5,
                fontWeight: 'bold',
                offset: [0, 8],
              },
            },
            { xAxis: dates[Math.min(i - 1, dates.length - 1)] },
          ]);
        }
        startIdx = i;
        currentVal = val;
      }
    }
    return areas.length > 0 ? { data: areas } : undefined;
  };

  const markAreaConfig =
    bgMode === 'kirin'
      ? generateMarkArea(kirin_sequence, kirinColors)
      : bgMode === 'waves'
      ? generateMarkArea(waves_sequence, waveColors)
      : undefined;

  // ── 换手率面板（通达信副图逻辑）：HSL 染色 + MA5/MA10 + 金色标记 ──
  const hslData: (number | null)[] | null = (turnovers && turnovers.length === n)
    ? turnovers.map((t) => (t != null ? Number(t.toFixed(2)) : null))
    : null;
  // ── 成交量柱（常驻，红涨绿跌）+ 换手率线（有换手数据时右轴叠加，2026-08-16）──
  const volBars = volumes.map((v, i) => ({
    value: v,
    itemStyle: { color: pct_chgs[i] >= 0 ? `${upColor}80` : `${downColor}80` },
  }));
  const hslLine: (number | null)[] | null = hslData;

  // 换手率 MA5/MA10（无换手率数据时不画）
  const hslMa = (period: number): (number | null)[] => {
    if (!hslData) return [];
    const r: (number | null)[] = [];
    for (let i = 0; i < n; i++) {
      if (i < period - 1) { r.push(null); continue; }
      let s = 0;
      for (let j = i - period + 1; j <= i; j++) s += hslData[j] ?? 0;
      r.push(Number((s / period).toFixed(2)));
    }
    return r;
  };
  const hslMa5 = hslMa(5);
  const hslMa10 = hslMa(10);

  // 金色标记（J<15 + 近5日量最低/次低 + 22日历史条件）：红色柱覆盖
  const goldBars: (number | null)[] | null = hslData ? hslData.map((hsl, i) => {
    if (hsl == null || hsl <= 0) return null;
    const j = kdj.j[i];
    if (j == null || j >= 15) return null;
    const chg = pct_chgs[i];
    if (chg == null || chg < -2 || chg > 1.8) return null;
    const win5 = volumes.slice(Math.max(0, i - 4), i + 1);
    if (win5.length < 5) return null;
    const minV = Math.min(...win5);
    const secondMin = Math.min(...win5.filter((v) => v > minV));
    const isLow = volumes[i] === minV || (secondMin !== Infinity && volumes[i] === secondMin);
    if (!isLow) return null;
    return volumes[i];
  }) : null;

  // ── 图例值（随悬停日期变化；hoverIdx=null 显示最新值）──
  const fmt = (v: number | null, digits = 2): string => (v != null ? v.toFixed(digits) : '--');
  const legendVal = (arr: (number | null)[] | null | undefined): number | null => valAt(arr, hoverIdx);
  // OHLC 取悬停日（null=最新根），用于 开/收 图例值
  const ohlcAt = (i: number | null): number[] | null => {
    const bar = i != null && i >= 0 && i < ohlc.length ? ohlc[i] : ohlc[ohlc.length - 1];
    return bar && bar.length >= 4 ? bar : null;
  };
  const legendFormatter = (name: string) => {
    switch (name) {
      case 'K线':
        return 'K线';
      case '开': {
        const o = ohlcAt(hoverIdx);
        return `开 ${o != null ? fmt(o[0]) : '--'}`;
      }
      case '收': {
        const c = ohlcAt(hoverIdx);
        return `收 ${c != null ? fmt(c[1]) : '--'}`;
      }
      case '涨跌幅': {
        const p = legendVal(pct_chgs);
        return `涨跌幅 ${p != null ? `${p >= 0 ? '+' : ''}${p.toFixed(2)}%` : '--'}`;
      }
      case '白线':
        return `白线 ${fmt(legendVal(overlays.white_line))}`;
      case '黄线':
        return `黄线 ${fmt(legendVal(overlays.yellow_line))}`;
      case 'BBI':
        return `BBI ${fmt(legendVal(overlays.bbi))}`;
      case 'MA6':
        return `MA6 ${fmt(legendVal(overlays.ma6 ?? []))}`;
      case 'MA6+8%':
        return `MA6+8% ${fmt(legendVal(overlays.ma6) != null ? legendVal(overlays.ma6)! * 1.08 : null)}`;
      case 'MA24':
        return `MA24 ${fmt(legendVal(overlays.ma24_green ?? []) ?? legendVal(overlays.ma24_cyan ?? []))}`;
      case '布林上':
        return `布林上 ${fmt(legendVal(overlays.boll_upper))}`;
      case '布林中':
        return `布林中 ${fmt(legendVal(overlays.boll_mid))}`;
      case '布林下':
        return `布林下 ${fmt(legendVal(overlays.boll_lower))}`;
      case '成交量':
        return `成交量 ${formatVolume(legendVal(volumes) ?? 0)}`;
      case '换手率':
        return `换手率 ${fmt(legendVal(hslData))}%`;
      case 'J':
        return `J ${fmt(legendVal(kdj.j))}`;
      case '砖型图红':
      case '砖型图黄':
      case '砖型图绿':
        return '砖型';
      default:
        return name;
    }
  };

  // ── 面板顶部值（随悬停日期变化；hoverIdx=null 显示最新值）──
  const lastVal = (arr: (number | null)[] | null | undefined): number | null => {
    if (!arr) return null;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== null && arr[i] !== undefined) return arr[i];
    }
    return null;
  };
  const valAt = (arr: (number | null)[] | null | undefined, i: number | null): number | null => {
    if (!arr) return null;
    if (i != null && i >= 0 && i < arr.length && arr[i] != null) return arr[i];
    return lastVal(arr);
  };
  const f2 = (v: number | null): string => (v != null ? v.toFixed(2) : '--');
  const f3 = (v: number | null): string => (v != null ? v.toFixed(3) : '--');
  const idx = hoverIdx;
  const panelGraphics: object[] = [
    // 换手率面板（grid 1，top 45%）
    {
      type: 'text' as const,
      left: 66,
      top: '45.5%',
      silent: true,
      style: {
        text: `HSL ${f2(valAt(hslData, idx))}%  5日 ${f2(valAt(hslMa5, idx))}%  10日 ${f2(valAt(hslMa10, idx))}%`,
        fill: '#fbbf24',
        fontSize: 10,
        fontWeight: 500 as const,
      },
    },
    // KDJ 面板（grid 2，top 54%）
    ...(panels.kdj ? [{
      type: 'text' as const,
      left: 66,
      top: '54.5%',
      silent: true,
      style: {
        text: `K ${f2(valAt(kdj.k, idx))}  D ${f2(valAt(kdj.d, idx))}  J ${f2(valAt(kdj.j, idx))}`,
        fill: '#fbbf24',
        fontSize: 10,
        fontWeight: 500 as const,
      },
    }] : []),
    // MACD 面板（grid 3，top 64%）
    ...(panels.macd ? [{
      type: 'text' as const,
      left: 66,
      top: '64.5%',
      silent: true,
      style: {
        text: `DIF ${f3(valAt(macd.dif, idx))}  DEA ${f3(valAt(macd.dea, idx))}  柱 ${f3(valAt(macd.hist, idx))}`,
        fill: '#fbbf24',
        fontSize: 10,
        fontWeight: 500 as const,
      },
    }] : []),
    // 砖型图面板（grid 4，top 74%）
    ...(panels.brick ? [{
      type: 'text' as const,
      left: 66,
      top: '74.5%',
      silent: true,
      style: {
        text: `砖型 ${f2(valAt(brick.values, idx))}`,
        fill: '#fbbf24',
        fontSize: 10,
        fontWeight: 500 as const,
      },
    }] : []),
    // 呼吸波面板（grid 5，top 84%）
    ...(panels.breath ? [{
      type: 'text' as const,
      left: 66,
      top: '84.5%',
      silent: true,
      style: {
        text: `呼吸 ${f2(valAt(breathing_wave, idx))}`,
        fill: '#fbbf24',
        fontSize: 10,
        fontWeight: 500 as const,
      },
    }] : []),
  ];

  const option = {
    backgroundColor: 'transparent',
    animation: false,
    // 板块标注 + 副图面板上方值（随悬停日期变化）
    graphic: [
      ...(data.industry ? [{
        type: 'text' as const,
        left: 8,
        top: 28,
        silent: true,
        style: {
          text: data.industry,
          fill: '#64748b',
          fontSize: 10,
          fontWeight: 600 as const,
        },
      }] : []),
      ...panelGraphics,
    ],
    tooltip: {
      // 数据浮层已隐藏（透明 + 空内容）；保留 trigger/axisPointer 事件机制，
      // 用于驱动图例值与副图面板值随悬停日期变化（updateAxisPointer → hoverIdx）
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      showContent: false,
      backgroundColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'box-shadow:none;',
    },
    legend: {
      // 主图 + 换手率/砖型图例开关（含 J）；副图（KDJ K/D、MACD、呼吸）由工具栏「面板」开关控制，
      // 不再占用图例栏（HSL5/HSL10/K/D/DIF/DEA/MACD/呼气/吸气 已移除）
      data: ['K线', '开', '收', '涨跌幅', '白线', '黄线', 'BBI', 'MA6', 'MA6+8%', 'MA24', '布林上', '布林中', '布林下', '成交量', '换手率', 'J', '砖型图红', '砖型图黄', '砖型图绿'],
      // 勾选状态由 legendselectchanged 事件驱动，悬停重建时不丢失
      selected: legendSelected,
      top: 0,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 2,
      formatter: legendFormatter,
    },
    grid: [
      // 主图占 40%（对齐通达信手机版主图突出的观感），副图紧凑排列
      { left: 60, right: 70, top: 32, height: '40%' },
      { left: 60, right: 70, top: '45%', height: '7%' },
      { left: 60, right: 70, top: '54%', height: '8%' },
      { left: 60, right: 70, top: '64%', height: '8%' },
      { left: 60, right: 70, top: '74%', height: '8%' },
      { left: 60, right: 70, top: '84%', height: '7%' },
    ],
    xAxis: [
      {
        type: 'category', data: dates, gridIndex: 0,
        axisLine: { lineStyle: { color: '#2a3a52' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false },
      },
      {
        type: 'category', data: dates, gridIndex: 1,
        axisLine: { lineStyle: { color: '#2a3a52' } },
        axisLabel: { show: false }, splitLine: { show: false },
      },
      {
        type: 'category', data: dates, gridIndex: 2,
        axisLine: { lineStyle: { color: '#2a3a52' } },
        axisLabel: { show: false }, splitLine: { show: false },
      },
      {
        type: 'category', data: dates, gridIndex: 3,
        axisLine: { lineStyle: { color: '#2a3a52' } },
        axisLabel: { show: false }, splitLine: { show: false },
      },
      {
        type: 'category', data: dates, gridIndex: 4,
        axisLine: { lineStyle: { color: '#2a3a52' } },
        axisLabel: { show: false }, splitLine: { show: false },
      },
      {
        type: 'category', data: dates, gridIndex: 5,
        axisLine: { lineStyle: { color: '#2a3a52' } },
        axisLabel: { show: false }, splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        scale: true, gridIndex: 0,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      {
        scale: true, gridIndex: 1,
        splitLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10, formatter: (v: number) => formatVolumeAxis(v) },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      {
        scale: true, gridIndex: 2,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      {
        scale: true, gridIndex: 3,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      {
        scale: true, gridIndex: 4,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      {
        scale: true, gridIndex: 5,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      },
      // 换手率右轴（grid 1 双轴：左成交量，右换手率%；无换手率数据时不渲染）
      ...(hslLine ? [{
        gridIndex: 1, scale: true, position: 'right' as const,
        splitLine: { show: false },
        axisLabel: { color: '#fbbf24', fontSize: 10, formatter: (v: number) => `${v}%` },
        axisLine: { lineStyle: { color: '#2a3a52' } },
      }] : []),
    ],
    dataZoom: [
      // start/end 由 zoom state 驱动（datazoom 事件同步），悬停重建不丢失缩放状态
      { type: 'inside', xAxisIndex: [0, 1, 2, 3, 4, 5], start: zoom.start, end: zoom.end },
      { type: 'slider', xAxisIndex: [0, 1, 2, 3, 4, 5], start: zoom.start, end: zoom.end, bottom: 5, height: 15, borderColor: '#2a3a52', fillerColor: 'rgba(245,158,11,0.1)', textStyle: { color: '#64748b' } },
    ],
    series: [
      // ── 图例占位 series（开/收/涨跌幅）：无图形、不参与 tooltip，
      //    仅让 ECharts legend 渲染这三项（legend 只显示有匹配 series 的 data 项）──
      { name: '开', type: 'line', data: [], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { opacity: 0 }, silent: true },
      { name: '收', type: 'line', data: [], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { opacity: 0 }, silent: true },
      { name: '涨跌幅', type: 'line', data: [], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { opacity: 0 }, silent: true },
      // ── K 线（含金色蜡烛染色，统一 per-point 对象格式）──
      {
        name: 'K线',
        type: 'candlestick',
        data: ohlc.map((o, i) => ({
          value: o,
          ...(goldenCond[i] ? { itemStyle: { color: '#fbbf24', color0: '#fbbf24', borderColor: '#fbbf24', borderColor0: '#fbbf24' } } : {}),
        })),
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
        markArea: markAreaConfig,
        markPoint: {
          symbol: 'triangle',
          symbolSize: 10,
          data: [
            ...buyMarkers.map((m) => ({ ...m, symbol: 'triangle', symbolRotate: 0, symbolOffset: [0, 10], label: { show: false } })),
            ...sellMarkers.map((m) => ({ ...m, symbol: 'triangle', symbolRotate: 180, symbolOffset: [0, -10], label: { show: false } })),
            ...(jLastInt !== null ? [{
              name: 'J',
              coord: [lastDate, highs[n - 1]],
              value: 'J ' + String(jLastInt),
              symbol: 'none',
              symbolOffset: [0, -30],
              label: { show: true, color: jColor, fontSize: 11, fontWeight: 'bold' as const, formatter: (p: { value: string }) => p.value },
            }] : []),
            ...(lastPctChg != null ? [{
              name: '涨跌幅',
              coord: [lastDate, highs[n - 1]],
              value: (lastPctChg >= 0 ? '+' : '') + lastPctChg.toFixed(2) + '%',
              symbol: 'none',
              symbolOffset: [0, -52],
              label: { show: true, color: lastPctChg >= 0 ? upColor : downColor, fontSize: 11, fontWeight: 'bold' as const, formatter: (p: { value: string }) => p.value },
            }] : []),
          ],
        },
      },
      // ── 金色蜡烛上方距离标签（TDX: HIGH*1.02，白/红/绿）──
      ...(goldenTopScatter.length > 0 ? [{
        type: 'scatter' as const,
        data: goldenTopScatter,
        xAxisIndex: 0,
        yAxisIndex: 0,
        symbol: 'circle',
        symbolSize: 0,
        label: {
          show: true,
          position: 'top' as const,
          fontSize: 9,
          fontWeight: 'bold' as const,
          formatter: (p: { value: [string, number, string, string] }) => p.value[2],
          color: (p: { value: [string, number, string, string] }) => p.value[3],
        },
      }] : []),
      // ── 金色蜡烛下方距离标签（TDX: LOW*0.98，红/绿）──
      ...(goldenBottomScatter.length > 0 ? [{
        type: 'scatter' as const,
        data: goldenBottomScatter,
        xAxisIndex: 0,
        yAxisIndex: 0,
        symbol: 'circle',
        symbolSize: 0,
        label: {
          show: true,
          position: 'bottom' as const,
          fontSize: 9,
          fontWeight: 'bold' as const,
          formatter: (p: { value: [string, number, string, string] }) => p.value[2],
          color: (p: { value: [string, number, string, string] }) => p.value[3],
        },
      }] : []),
      // ── 白线 短期动能线 ──
      {
        name: '白线',
        type: 'line',
        data: overlays.white_line,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 2, color: '#ffffff' },
        symbol: 'none',
        markPoint: lastWhite !== null ? {
          symbol: 'roundRect', symbolSize: [44, 18], symbolOffset: [28, 0],
          data: [{ coord: [lastDate, lastWhite], value: formatNumber(lastWhite), itemStyle: { color: '#0b0f19', borderColor: '#ffffff', borderWidth: 1 }, label: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' } }],
        } : undefined,
      },
      // ── 黄线 多空生命线 ──
      {
        name: '黄线',
        type: 'line',
        data: overlays.yellow_line,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 2, color: '#fbbf24' },
        symbol: 'none',
        markPoint: lastYellow !== null ? {
          symbol: 'roundRect', symbolSize: [44, 18], symbolOffset: [28, 0],
          data: [{ coord: [lastDate, lastYellow], value: formatNumber(lastYellow), itemStyle: { color: '#0b0f19', borderColor: '#fbbf24', borderWidth: 1 }, label: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' } }],
        } : undefined,
      },
      // ── BBI ──
      {
        name: 'BBI',
        type: 'line',
        data: overlays.bbi,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1.5, color: '#ff9900', type: 'dashed' },
        symbol: 'none',
        markPoint: lastBbi !== null ? {
          symbol: 'roundRect', symbolSize: [44, 18], symbolOffset: [28, 0],
          data: [{ coord: [lastDate, lastBbi], value: formatNumber(lastBbi), itemStyle: { color: '#0b0f19', borderColor: '#ff9900', borderWidth: 1 }, label: { color: '#ff9900', fontSize: 10, fontWeight: 'bold' } }],
        } : undefined,
      },
      // ── MA6 紫色 ──
      {
        name: 'MA6',
        type: 'line',
        data: ma6,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#ff00ff' },
        symbol: 'none',
      },
      // ── MA6+8% 品红预警 ──
      {
        name: 'MA6+8%',
        type: 'line',
        data: ma6Plus8,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#32cd32' },
        symbol: 'none',
      },
      // ── MA24 绿（BIAS24 < 0）──
      {
        name: 'MA24',
        type: 'line',
        data: ma24Green,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#00ff00' },
        symbol: 'none',
      },
      // ── MA24 青（0 ≤ BIAS24 < 5）──
      {
        name: 'MA24',
        type: 'line',
        data: ma24Cyan,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#00ffff' },
        symbol: 'none',
      },
      // ── 布林上 ──
      {
        name: '布林上',
        type: 'line',
        data: overlays.boll_upper,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#a855f7', type: 'dotted', opacity: 0.6 },
        symbol: 'none',
      },
      // ── 布林中 ──
      {
        name: '布林中',
        type: 'line',
        data: overlays.boll_mid,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#a855f7', type: 'dotted', opacity: 0.6 },
        symbol: 'none',
      },
      // ── 布林下 ──
      {
        name: '布林下',
        type: 'line',
        data: overlays.boll_lower,
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { width: 1, color: '#a855f7', type: 'dotted', opacity: 0.6 },
        symbol: 'none',
      },
      // ── 成交量柱（常驻，红涨绿跌；grid 1 左轴）──
      {
        name: '成交量',
        type: 'bar',
        data: volBars,
        xAxisIndex: 1,
        yAxisIndex: 1,
        barCategoryGap: '30%',
      },
      // ── 换手率线（有换手率数据时右轴金色叠加）──
      ...(hslLine ? [{
        name: '换手率',
        type: 'line' as const,
        data: hslLine,
        xAxisIndex: 1,
        yAxisIndex: 6,
        symbol: 'none',
        smooth: true,
        lineStyle: { width: 1.5, color: '#fbbf24' },
      }] : []),
      // ── 金色标记（J<15 + 近5日量最低/次低）红色柱覆盖（barGap -100% 叠加，不挤占换手率柱）──
      ...(goldBars ? [{
        name: '金标',
        type: 'bar' as const,
        data: goldBars.map((v) => (v == null ? { value: 0, itemStyle: { color: 'transparent' } } : { value: v, itemStyle: { color: '#ef4444' } })),
        xAxisIndex: 1,
        yAxisIndex: 1,
        barGap: '-100%',
        barCategoryGap: '30%',
      }] : []),
      // ── 换手率 MA5/MA10 ──
      ...(hslMa5.length > 0 ? [{
        name: 'HSL5',
        type: 'line' as const,
        data: hslMa5,
        xAxisIndex: 1, yAxisIndex: 6,
        smooth: true,
        lineStyle: { width: 1, color: '#00ff00' },
        symbol: 'none',
      }] : []),
      ...(hslMa10.length > 0 ? [{
        name: 'HSL10',
        type: 'line' as const,
        data: hslMa10,
        xAxisIndex: 1, yAxisIndex: 6,
        smooth: true,
        lineStyle: { width: 1, color: '#00ffff' },
        symbol: 'none',
      }] : []),
      // ── KDJ（可由工具栏开关控制）──
      ...(panels.kdj ? [
        {
          name: 'K',
          type: 'line' as const,
          data: kdj.k,
          xAxisIndex: 2, yAxisIndex: 2,
          smooth: true,
          lineStyle: { width: 1, color: '#f59e0b' },
          symbol: 'none',
        },
        {
          name: 'D',
          type: 'line' as const,
          data: kdj.d,
          xAxisIndex: 2, yAxisIndex: 2,
          smooth: true,
          lineStyle: { width: 1, color: '#3b82f6' },
          symbol: 'none',
        },
        {
          name: 'J',
          type: 'line' as const,
          data: kdj.j,
          xAxisIndex: 2, yAxisIndex: 2,
          smooth: true,
          lineStyle: { width: 1, color: '#a855f7' },
          symbol: 'none',
        },
      ] : []),
      // ── MACD（可由工具栏开关控制）──
      ...(panels.macd ? [
        {
          name: 'DIF',
          type: 'line' as const,
          data: macd.dif,
          xAxisIndex: 3, yAxisIndex: 3,
          smooth: true,
          lineStyle: { width: 1, color: '#f59e0b' },
          symbol: 'none',
        },
        {
          name: 'DEA',
          type: 'line' as const,
          data: macd.dea,
          xAxisIndex: 3, yAxisIndex: 3,
          smooth: true,
          lineStyle: { width: 1, color: '#3b82f6' },
          symbol: 'none',
        },
        {
          name: 'MACD',
          type: 'bar' as const,
          data: macd.hist.map((v) => ({
            value: v,
            itemStyle: { color: (v ?? 0) >= 0 ? upColor : downColor },
          })),
          xAxisIndex: 3, yAxisIndex: 3,
        },
      ] : []),
      // ── 砖型图（可由工具栏开关控制）──
      // 通达信副图 STICKLINE：柱体从 REF(砖型图,1)（昨值）画到 砖型图（今值），K 线实体样式
      // 用 candlestick 实现：open=昨值 close=今值 low=min high=max（影线长度 0 自动隐藏）
      // candlestick 不支持 per-item 颜色，按红/黄/绿拆 3 个 series（非本色的位置填零柱占位对齐）
      ...(panels.brick ? (() => {
        const nBrick = (brick.values || []).length;
        const groups: Record<string, { color: string; data: (number[] | null)[] }> = {
          red: { color: upColor, data: Array(nBrick).fill(null) },
          yellow: { color: '#fbbf24', data: Array(nBrick).fill(null) },
          green: { color: downColor, data: Array(nBrick).fill(null) },
        };
        (brick.values || []).forEach((v, i) => {
          const prev = (brick.values || [])[i - 1];
          if (v == null || prev == null) { return; }
          const c = (brick.colors || [])[i];
          const group = c === 0 ? 'yellow' : c === -1 ? 'green' : 'red';
          groups[group].data[i] = [prev, v, Math.min(prev, v), Math.max(prev, v)];
        });
        return (Object.entries(groups) as [string, { color: string; data: (number[] | null)[] }][])
          .filter(([, g]) => g.data.some((d) => d !== null))
          .map(([key, g]) => ({
            name: `砖型图${key}`,
            type: 'candlestick' as const,
            data: g.data.map((d) => d ?? [0, 0, 0, 0]),
            xAxisIndex: 4,
            yAxisIndex: 4,
            barWidth: 8,
            barGap: '-100%',
            itemStyle: { color: g.color, color0: g.color, borderColor: g.color, borderColor0: g.color },
          }));
      })() : []),
      // ── 呼吸波（可由工具栏开关控制）──
      ...(panels.breath ? [
        {
          name: '主力呼气',
          type: 'line' as const,
          data: (breathing_wave || []).map((v) => (v > 0 ? v : 0)),
          xAxisIndex: 5, yAxisIndex: 5,
          smooth: true, symbol: 'none',
          lineStyle: { width: 1.5, color: '#ef4444' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.35)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
              ],
            },
          },
        },
        {
          name: '主力吸气',
          type: 'line' as const,
          data: (breathing_wave || []).map((v) => (v < 0 ? v : 0)),
          xAxisIndex: 5, yAxisIndex: 5,
          smooth: true, symbol: 'none',
          lineStyle: { width: 1.5, color: '#22c55e' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 197, 94, 0.02)' },
                { offset: 1, color: 'rgba(34, 197, 94, 0.35)' },
              ],
            },
          },
        },
      ] : []),
    ],
  };

  // 工具栏按钮通用类名风格（参考现有 bgMode 切换）
  const RANGES: { key: number; label: string }[] = [
    { key: 60, label: '60日' },
    { key: 120, label: '120日' },
    { key: 250, label: '250日' },
    { key: 500, label: '500日' },
  ];
  const PANEL_BTNS: { key: PanelKey; label: string }[] = [
    { key: 'kdj', label: 'KDJ' },
    { key: 'macd', label: 'MACD' },
    { key: 'brick', label: '砖型' },
    { key: 'breath', label: '呼吸波' },
  ];

  return (
    <div className="space-y-4">
      {/* 工具栏：周期切换 + 面板开关 + 背景模式 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="text-xs text-text-muted font-semibold tracking-wider">主力大势背景渲染</div>
          <div className="flex items-center gap-1.5 bg-bg-secondary p-1 rounded-lg border border-border/30">
            {(
              [
                { key: 'none', label: '无背景' },
                { key: 'kirin', label: '麒麟四阶段' },
                { key: 'waves', label: '主力三波理论' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setBgMode(t.key)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  bgMode === t.key
                    ? 'bg-accent-gold text-bg-primary shadow-sm shadow-accent-gold/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* 周期切换 */}
          <div className="flex items-center gap-1.5 bg-bg-secondary p-1 rounded-lg border border-border/30">
            <span className="px-2 text-[10px] text-text-muted font-bold">周期</span>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRangeChange(r.key)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  range === r.key
                    ? 'bg-accent-gold text-bg-primary shadow-sm shadow-accent-gold/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* 面板开关 */}
          <div className="flex items-center gap-1.5 bg-bg-secondary p-1 rounded-lg border border-border/30">
            <span className="px-2 text-[10px] text-text-muted font-bold">面板</span>
            {PANEL_BTNS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setPanels((prev) => ({ ...prev, [b.key]: !prev[b.key] }))}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  panels[b.key]
                    ? 'bg-accent-gold/30 text-accent-gold'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover line-through'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={containerEl} onContextMenu={(e) => e.preventDefault()}>
        <EChartsReact
          option={option}
          style={{ height }}
          notMerge
          onInstance={setInstance}
          onEvents={{
          // 悬停时更新副图上方值（tooltip axis 模式触发），并上报页面级联动
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ECharts 事件参数类型不稳定
          updateAxisPointer: (params: any) => {
            if (isDraggingRef.current) return; // 右键拖拽中不联动悬停
            let hIdx: number | null = null;
            if (params?.dataIndex != null && Number.isFinite(params.dataIndex)) {
              hIdx = params.dataIndex;
            } else if (params?.axisValue != null) {
              const found = dates.indexOf(params.axisValue);
              hIdx = found >= 0 ? found : null;
            }
            setHoverIdx((prev) => (prev === hIdx ? prev : hIdx));
            onHover?.(hIdx);
          },
          // 鼠标离开图表恢复最新值
          globalout: () => {
            if (isDraggingRef.current) return;
            setHoverIdx(null);
            onHover?.(null);
          },
          // 缩放状态同步（inside/slider 均触发；notMerge 重建时写回保持）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ECharts 事件参数类型不稳定
          datazoom: (params: any) => {
            if (isDraggingRef.current) return; // 拖拽中 dispatchAction 触发的事件不写 state
            const b = Array.isArray(params?.batch) && params.batch.length > 0 ? params.batch[0] : params;
            if (b?.start != null && b?.end != null) {
              setZoom({ start: b.start, end: b.end });
            }
          },
          // 图例勾选状态同步（同上，防止悬停重建丢失勾选）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ECharts 事件参数类型不稳定
          legendselectchanged: (params: any) => {
            if (params?.selected) {
              setLegendSelected({ ...params.selected });
            }
          },
        }}
        />
      </div>
    </div>
  );
}