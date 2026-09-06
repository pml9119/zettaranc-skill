import type { DiagnosisSummary } from '../../api/types';
import type { DiagnosisHover } from '../../lib/diagnosisHover';
import { riskColor } from '../../lib/formatters';

interface Props {
  diagnosis: DiagnosisSummary;
  /** 悬停日的诊断字段（前端从逐日序列推导）；null = 显示最新快照 */
  hover?: DiagnosisHover | null;
}

function DiagnosisRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-bg-hover/30 transition-colors">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-medium" style={{ color: color || 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export default function DiagnosisCard({ diagnosis, hover }: Props) {
  const sellScore = hover?.sellScore ?? diagnosis.sell_score;
  const pricePosition = hover?.pricePosition ?? (diagnosis.price_position || '--');
  const trendStatus = hover?.trendStatus ?? (diagnosis.trend_status || '--');
  const kirinPhase = hover?.kirinPhase ?? (diagnosis.kirin_phase || '--');
  const bullRope = hover?.bullRope ?? (diagnosis.bull_rope || '--');
  const riskLevel = hover?.riskLevel ?? diagnosis.risk_level;
  const recommendation = hover?.recommendation ?? (diagnosis.recommendation || '--');

  return (
    <div className="space-y-1 text-xs">
      {/* 风险等级 */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <span className="text-text-muted font-semibold uppercase tracking-wider text-[10px]">风险等级</span>
        <span className="font-bold px-3 py-1 rounded-full text-xs" style={{ backgroundColor: `${riskColor(riskLevel)}15`, color: riskColor(riskLevel) }}>
          {riskLevel}
        </span>
      </div>

      {/* 价格位置 */}
      <DiagnosisRow label="价格位置" value={pricePosition} />

      {/* 趋势状态 */}
      <DiagnosisRow label="趋势状态" value={trendStatus} />

      {/* 防卖飞评分（悬停时随主图轴指针联动） */}
      <DiagnosisRow
        label="防卖飞"
        value={`${sellScore}/5 ${hover ? '' : diagnosis.sell_score_desc}`}
        color={sellScore >= 3 ? '#ef4444' : sellScore >= 2 ? '#f59e0b' : '#22c55e'}
      />

      {/* 麒麟会 */}
      <DiagnosisRow label="麒麟会" value={kirinPhase} />

      {/* 牛绳 */}
      <DiagnosisRow label="牛绳" value={bullRope} />

      {/* 蜈蚣图 */}
      {diagnosis.is_centipede && !hover && (
        <DiagnosisRow label="蜈蚣图" value="是" color="#ef4444" />
      )}

      {/* 操作建议 */}
      <div className="pt-3 mt-2 border-t border-border/40">
        <div className="text-text-muted font-semibold uppercase tracking-wider text-[10px] mb-2">操作建议</div>
        <div className="text-text-primary leading-relaxed bg-bg-hover/20 p-3 rounded-lg text-xs">{recommendation}</div>
      </div>
    </div>
  );
}
