---
id: ZT-1
title: 实测 VOL 单位（手 / 股，差 100x）
status: ready
assignee: []
created_date: '2026-09-30 17:14'
labels:
  - ready-for-agent
dependencies: []
references:
  - .scratch/wayfinder-vibe-distill/issues/02-tdx-formula-mapping.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
02 v2 标为最高风险：真实换手率 VOL 单位在「手」与「股」之间差 100 倍。F3/F4 实现前必须定清，否则过滤器全错。G0 无前置依赖。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 用真实数据确认 daily_kline.vol 的单位口径（随机抽 5 只股，与交易所公开数据对账）
- [ ] #2 给出与 tushare / a-stock-data 的换算关系，写进代码注释
- [ ] #3 结论落进 knowledge/ 或 docs/agents/domain.md，并让 F3/F4 显式引用
<!-- AC:END -->
