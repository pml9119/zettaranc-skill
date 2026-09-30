---
id: ZT-5
title: 实现 06：books/ 与 knowledge/ 同步编译
status: ready
assignee: []
created_date: '2026-09-30 17:14'
labels:
  - ready-for-agent
dependencies: []
references:
  - .scratch/wayfinder-vibe-distill/issues/06-knowledge-books-sync.md
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
map.md:205 记「阻塞于批次产物 + books/ 首次落盘」——books/ 已落盘 74 文件，阻塞已部分解除。不实现它，后续约 40 批会持续手改 knowledge/，漂移累积（R7）。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 按 artifacts/knowledge-books-sync-design.md 实现同步机制
- [ ] #2 对已手改的 6 个 knowledge/ 文件跑一次，验证幂等
- [ ] #3 消除 R7：后续批次不再手改 knowledge/
<!-- AC:END -->
