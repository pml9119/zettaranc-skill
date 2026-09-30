---
id: ZT-2
title: 修 4 处版本文档漂移 + skill.json 测试数过期
status: ready
assignee: []
created_date: '2026-09-30 17:14'
labels:
  - ready-for-agent
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
项目管理-总览 §3 记录：SKILL.md:19、SKILL.md:225、docs/TODO.md:5、AGENTS.md:12 四处版本与 pyproject.toml 4.3.0 不一致；skill.json quality_metrics.tests 仍写 1383，实测 1513。纯文档，改动小、无阻塞。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 四处版本串与 pyproject.toml / skill.json / CHANGELOG 顶端对齐到 4.3.0
- [ ] #2 skill.json quality_metrics.tests 更新为实测值 1513
- [ ] #3 AGENTS.md:12 的「四处一致」表述改为真话（或删掉该断言）
<!-- AC:END -->
