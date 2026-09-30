---
id: ZT-6
title: 裁决黄砖语义 + 修 if-val-else-None 陷阱
status: discovery
assignee: []
created_date: '2026-09-30 17:14'
labels:
  - ready-for-human
dependencies: []
references:
  - .scratch/wayfinder-vibe-distill/issues/02-tdx-formula-mapping.md
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
F 系列的咽喉。后端 api/services/stock_service.py:311-326 只产 brick_colors ±1，0 从未赋出 → 黄砖数学上不可达，而参考图里黄砖大量可见。同处 brick_values[i] = round(val,2) if val else None 把真值 0 也变成 None。必须人裁决：黄砖 = 砖值==0？还是持平？
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 定清黄砖语义（砖值 == 0 / 持平 / 其他），写进 docs/agents/domain.md
- [ ] #2 修掉 if val else None 陷阱，使「砖值恰为 0」在接口层可区分
- [ ] #3 给出砖色与砖值的一致性验证用例
<!-- AC:END -->
