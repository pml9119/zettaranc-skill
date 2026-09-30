# Triage labels

实现票在 Backlog.md 里，**标签是原生的**，五个 triage role 直接 `-l` 打。

| Role | 标签字符串 |
|---|---|
| 待分诊 | `needs-triage` |
| 缺信息 | `needs-info` |
| 可交给 agent | `ready-for-agent` |
| 需人处理 | `ready-for-human` |
| 不做 | `wontfix` |

五个都已在 `backlog/config.yml` 的 `labels` 里声明。

**标签与状态正交**：状态（`fog`…`done`）管**流动**，标签管**分诊**。一张票同时只有一个 triage role。

```bash
backlog task edit zt-7 -l needs-triage      # 先标待分诊
backlog task edit zt-7 -l ready-for-agent   # 分诊后，可交给 agent
backlog task list --labels needs-triage     # 取待分诊队列
```

## 只分诊不是你创建的票

进来的 bug 报告、外部需求、任何**原始到达**的东西。

`/to-tickets` 产出的票**已经是 agent-ready，不要分诊**。

## 本仓库最该用它的地方：R6

**13 failed + 7 errors 长期挂账、无归属、无 issue。**

这正是 triage 的用途 —— 为每个失败归口：建票 → `needs-triage` → 分诊成
`ready-for-agent`（确实是代码缺陷）或 `ready-for-human`（环境性豁免，需人裁决）。

它们挂账的原因不是难修，是**没有归口**。
