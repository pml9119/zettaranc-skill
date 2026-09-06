import type { ScoreDetail } from '../../api/types';
import { formatNumber } from '../../lib/formatters';

/** 悬停日的评分快照（来自 indicator_series.score 序列） */
export interface ScoreHover {
  total: number;
  b1: number;
  trend: number;
  volume: number;
  risk: number;
  /** 悬停日的评分理由列表（逐日）；缺省时回退最新快照 */
  reasons?: string[];
  /** 悬停日的风险警告列表（逐日）；缺省时回退最新快照 */
  warnings?: string[];
}

interface Props {
  score: ScoreDetail;
  /** 悬停日的评分数值；null = 显示最新快照 */
  hover?: ScoreHover | null;
}

export default function ScoreCard({ score, hover }: Props) {
  const total = hover?.total ?? score.total;
  const ratingColor = total >= 80 ? '#22c55e' : total >= 65 ? '#3b82f6' : total >= 50 ? '#f59e0b' : total >= 35 ? '#f97316' : '#ef4444';

  const scoreItems = [
    { label: 'B1', value: hover?.b1 ?? score.b1_score, color: '#22c55e' },
    { label: '趋势', value: hover?.trend ?? score.trend_score, color: '#3b82f6' },
    { label: '量价', value: hover?.volume ?? score.volume_score, color: '#f59e0b' },
    { label: '风险', value: hover?.risk ?? score.risk_score, color: '#ef4444' },
  ];

  // 理由/警告：悬停时用逐日列表（可能为空 → 不显示），未悬停用最新快照
  const reasons = hover ? (hover.reasons ?? []) : score.reasons;
  const warnings = hover ? (hover.warnings ?? []) : score.warnings;

  return (
    <div className="space-y-4">
      {/* 总分 */}
      <div className="text-center">
        <div className="text-5xl font-black tabular-nums" style={{ color: ratingColor }}>
          {formatNumber(total, 1)}
        </div>
        <div className="text-xs text-text-muted mt-1 font-medium">{hover ? '—' : score.rating}</div>
      </div>

      {/* 分项评分 */}
      <div className="space-y-2.5">
        {scoreItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-8 font-medium">{item.label}</span>
            <div className="flex-1 h-2 rounded-full bg-bg-hover overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums w-8 text-right font-bold" style={{ color: item.color }}>
              {formatNumber(item.value, 0)}
            </span>
          </div>
        ))}
      </div>

      {/* 理由 */}
      {reasons.length > 0 && (
        <div className="pt-3 border-t border-border/40">
          <div className="text-[10px] text-text-muted mb-2 font-semibold uppercase tracking-wider">理由</div>
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-accent-green leading-relaxed flex items-start gap-1.5">
                <span className="text-accent-green/60 mt-0.5">+</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 警告 */}
      {warnings.length > 0 && (
        <div className="pt-2 border-t border-border/40">
          <div className="text-[10px] text-text-muted mb-2 font-semibold uppercase tracking-wider">警告</div>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-accent-red leading-relaxed flex items-start gap-1.5">
                <span className="text-accent-red/60 mt-0.5">!</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
