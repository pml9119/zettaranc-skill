import type { KlineChart } from '../api/types';

/**
 * 悬停日的诊断字段推导（与后端 modules/portfolio_diagnosis.py 同口径）：
 * - 价格位置：_judge_price_position —— 收盘 vs BBI(±5%) / 白线 / 黄线
 * - 牛绳：detect_bull_rope —— 金叉/死叉 > 牵牛(白>黄) / 牛绳断(白<黄)
 * - 趋势状态：_judge_trend —— 死叉 > 金叉 > MACD多头区间 > 震荡（MACD否决逐日不可得，跳过）
 * - 操作建议/风险：_make_recommendation —— 死叉 > 牛绳断 > 防卖飞评分（蜈蚣/S信号/MACD否决逐日不可得，跳过）
 */
export interface DiagnosisHover {
  pricePosition: string;
  trendStatus: string;
  kirinPhase: string;
  bullRope: string;
  sellScore: number | null;
  riskLevel: string;
  recommendation: string;
}

const at = (arr: (number | null)[] | undefined, i: number): number | null => (arr?.[i] ?? null);
const prev = (arr: (number | null)[] | undefined, i: number): number | null => (i > 0 ? (arr?.[i - 1] ?? null) : null);

export function computeDiagnosisHover(data: KlineChart, idx: number): DiagnosisHover {
  const close = data.ohlc[idx]?.[1] ?? 0;
  const bbi = at(data.overlays.bbi, idx);
  const white = at(data.overlays.white_line, idx);
  const yellow = at(data.overlays.yellow_line, idx);
  const dif = at(data.macd.dif, idx);
  const pWhite = prev(data.overlays.white_line, idx);
  const pYellow = prev(data.overlays.yellow_line, idx);

  // 价格位置
  const parts: string[] = [];
  if (bbi != null && bbi > 0 && close > 0) {
    parts.push(close > bbi * 1.05 ? 'BBI之上' : close < bbi * 0.95 ? 'BBI之下' : 'BBI附近');
  }
  if (white != null && yellow != null && white > 0 && yellow > 0 && close > 0) {
    parts.push(close > white ? '白线之上' : '跌破白线');
    parts.push(close > yellow ? '黄线之上' : '跌破黄线');
  }
  const pricePosition = parts.length > 0 ? parts.join(' | ') : '数据不足';

  // 牛绳（金叉/死叉 优先于 牵牛/牛绳断）
  let bullRope: string;
  if (white != null && yellow != null && pWhite != null && pYellow != null && white > 0 && yellow > 0) {
    if (pWhite <= pYellow && white > yellow) bullRope = '金叉';
    else if (pWhite >= pYellow && white < yellow) bullRope = '死叉';
    else bullRope = white > yellow ? '牵牛' : '牛绳断';
  } else {
    bullRope = '数据不足';
  }

  // 趋势状态
  let trendStatus: string;
  if (bullRope === '死叉') trendStatus = '死叉（白线跌破黄线），趋势转空';
  else if (bullRope === '金叉') trendStatus = '金叉（白线上穿黄线），趋势转多';
  else if (dif != null && dif > 0) trendStatus = 'MACD多头区间，趋势向上';
  else trendStatus = '震荡整理';

  // 麒麟会（逐日序列）
  const kirinPhase = data.kirin_sequence?.[idx] ?? '未知';

  // 防卖飞评分（逐日序列）
  const sellScore = at(data.indicator_series?.sell_score, idx);

  // 操作建议 + 风险等级（优先级链：死叉 > 牛绳断 > 防卖飞）
  let recommendation: string;
  let riskLevel: string;
  if (bullRope === '死叉') {
    recommendation = '白线死叉黄线，趋势走坏，建议减仓';
    riskLevel = 'HIGH';
  } else if (bullRope === '牛绳断') {
    recommendation = '牛绳断了（白线跌破黄线），任何上涨都是反弹，建议减仓';
    riskLevel = 'HIGH';
  } else if (sellScore != null && sellScore >= 4) {
    recommendation = `防卖飞评分${sellScore}/5，持股让利润飞`;
    riskLevel = 'LOW';
  } else if (sellScore != null && sellScore >= 2) {
    recommendation = `防卖飞评分${sellScore}/5，关注破位信号`;
    riskLevel = 'MEDIUM';
  } else if (sellScore != null) {
    recommendation = `防卖飞评分${sellScore}/5，弱势信号，考虑减仓`;
    riskLevel = 'HIGH';
  } else {
    recommendation = '数据不足';
    riskLevel = 'UNKNOWN';
  }

  return { pricePosition, trendStatus, kirinPhase, bullRope, sellScore, riskLevel, recommendation };
}
