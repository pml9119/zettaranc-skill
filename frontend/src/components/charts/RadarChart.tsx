import EChartsReact from '../../lib/EChartsReact';
import type { ScoreDetail } from '../../api/types';

interface Props {
  score: ScoreDetail;
  height?: number;
  /** 悬停日的五维评分；null = 显示最新快照 */
  hover?: { b1: number; trend: number; volume: number; risk: number } | null;
}

export default function RadarChart({ score, height = 220, hover }: Props) {
  const values = [
    hover?.b1 ?? score.b1_score,
    hover?.trend ?? score.trend_score,
    hover?.volume ?? score.volume_score,
    hover?.risk ?? score.risk_score,
  ];
  const option = {
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: 'B1', max: 100 },
        { name: '趋势', max: 100 },
        { name: '量价', max: 100 },
        { name: '风险', max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#94a3b8', fontSize: 12, fontWeight: 500 },
      splitLine: { lineStyle: { color: '#2a3a52', width: 1 } },
      splitArea: {
        areaStyle: {
          color: ['rgba(245, 158, 11, 0.02)', 'rgba(245, 158, 11, 0.04)', 'rgba(245, 158, 11, 0.06)', 'rgba(245, 158, 11, 0.08)'],
        },
      },
      axisLine: { lineStyle: { color: '#2a3a52', width: 1 } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '评分',
            areaStyle: {
              color: {
                type: 'radial',
                x: 0.5, y: 0.5, r: 0.5,
                colorStops: [
                  { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
                  { offset: 1, color: 'rgba(245, 158, 11, 0.05)' },
                ],
              },
            },
            lineStyle: { color: '#f59e0b', width: 2 },
            itemStyle: { color: '#f59e0b', borderColor: '#fff', borderWidth: 1 },
          },
        ],
      },
    ],
  };

  return <EChartsReact option={option} style={{ height }} notMerge />;
}
