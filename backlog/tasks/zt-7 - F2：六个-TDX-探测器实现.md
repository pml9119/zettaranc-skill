---
id: ZT-7
title: F2：六个 TDX 探测器实现
status: ready
assignee: []
created_date: '2026-09-30 17:14'
labels:
  - ready-for-agent
dependencies:
  - ZT-6
references:
  - .scratch/wayfinder-vibe-distill/issues/02-tdx-formula-mapping.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
依赖黄砖语义裁决。02 v2 已给出 9 公式到 Python 的映射，其中 5/9 需要 calculate_brick_series（F1 已完成，brick.py:75）。F2 是 F3 过滤器的前置。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 按 02 v2 的映射表实现六个探测器，复用 calculate_brick_series
- [ ] #2 每个探测器带回归锚点测试（对照 TDX 公式的已知输出）
- [ ] #3 跑通 zt-6 给出的一致性验证用例
<!-- AC:END -->
