# Issue tracker

本仓库有**两个票面（two surfaces）**，由票的性质区分。这**不是两个 tracker**，是两类票 —— 见 mattpocock 术语表把 **Decision ticket** 与实现票分开定义。

| 票型 | 位置 | 归属 skill |
|---|---|---|
| **决策票** | `.scratch/<effort>/issues/NN-slug.md` + `.scratch/<effort>/map.md` | `/wayfinder` |
| **实现票** | `backlog/tasks/zt-N - <slug>.md` | `/to-tickets` → `/implement` |

决策票持有一个**问题**，产出是决策；实现票是一条构建切片。

## 实现票：Backlog.md

CLI：`backlog`（v1.52.0，全局安装）。真相源是 `backlog/tasks/*.md`，但**一律走 CLI 改，不要手改文件**。

### 状态 = cadence 的六列

`backlog/config.yml` 的 `statuses` 直接就是 cadence 的六列，**无映射**：

| cadence 列 | status |
|---|---|
| 迷雾 | `fog` |
| 发现 | `discovery` |
| 待开工 | `ready` |
| 进行中 | `building` |
| 待验收 | `verifying` |
| 已完成 | `done` |

### 命令

| 动作 | 命令 |
|---|---|
| 建票 | `backlog task create "标题" -d "描述" --ac "验收1" --ac "验收2"` |
| 建票带阻塞边 | `backlog task create "标题" --dep zt-3,zt-5` |
| **取前沿** | `backlog task list --ready --json` |
| 改状态 | `backlog task edit zt-7 -s verifying` |
| 列票 | `backlog task list -s building --json` |
| 看单票 | `backlog task zt-7 --plain` |
| 勾验收 | `backlog task edit zt-7 --check-ac 1` |
| 打标签 | `backlog task edit zt-7 -l needs-triage` |
| 终端看板 | `backlog board`（交互式 TUI） |
| 导出看板 | `backlog board export` |

**依赖会被校验**：未知或歧义的依赖 **fail-closed**（按阻塞处理），不会静默当成已满足。

### 当 skill 说「publish to the issue tracker」

用 `backlog task create`。产出已经是 agent-ready，**不要再分诊**（参见 `triage-labels.md`）。

### 当 skill 说「fetch the relevant ticket」

`backlog task <id> --plain`（机器读用 `--json`）。

## 决策票：本地 markdown（wayfinder）

- **Map**：`.scratch/<effort>/map.md` —— 该 effort 的**唯一权威状态源**
- **子票**：`.scratch/<effort>/issues/NN-slug.md`。`Type:` 记票型（`research`/`prototype`/`task`），`Status:` 记 `open`/`claimed`/`resolved`
- **阻塞**：顶部 `Blocked by:` 行
- **前沿**：open、未阻塞、未认领，**编号最小者优先**
- **认领**：先写 `Status: claimed` 再动手

现有 effort：`vibe-distill` → `.scratch/wayfinder-vibe-distill/`

### 决策票编号不可重排

编号 `01`–`08` 被 `map.md` 与各 issue 文件引用了**数百次**（如「02 v2」「01 v3 §7.2」「05 v2 重估」）。
**不要重编号，也不要迁移进 Backlog.md** —— 会打断全部交叉引用。

## 冲突裁决

`map.md` 自述为唯一权威状态源。**任何派生视图都不权威** —— 包括仓库外的 `项目管理-总览.md`。
冲突时以 `map.md` 为准，并回写修正 map。
