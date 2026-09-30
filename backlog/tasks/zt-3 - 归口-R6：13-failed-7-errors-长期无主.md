---
id: ZT-3
title: 归口 R6：13 failed + 7 errors 长期无主
status: discovery
assignee: []
created_date: '2026-09-30 17:14'
labels:
  - needs-triage
dependencies: []
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
测试基线长期挂账：13 failed / 1513 passed / 17 skipped / 7 errors，集合稳定但无 issue、无归属。这不是「难修」，是「没有归口」。需要先分诊：逐条判定是代码缺陷还是环境性豁免。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 逐条复跑并记录失败原因（命令 + 输出摘要）
- [ ] #2 每条判定为「代码缺陷」（建实现票）或「环境性豁免」（写进豁免清单 + 理由）
- [ ] #3 结论落进 DECISIONS 账本（map.md §Decisions so far），避免下次会话重新争论
<!-- AC:END -->
