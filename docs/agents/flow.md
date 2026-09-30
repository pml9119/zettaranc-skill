# Flow

本仓库的 cadence 配置。**过程**在 `cadence` skill 里；这里只放本仓库的具体值。

## 票面

两个票面，定义见 `docs/agents/issue-tracker.md`：

- **实现票** → `backlog/`（`backlog` CLI，状态 = cadence 六列）
- **决策票** → `.scratch/<effort>/issues/`（wayfinder，`open`/`claimed`/`resolved`）

## 并行上限

```
N = 2
```

**校准依据**：剩余约 **40 个蒸馏批次**，单批 **150–250 万 token**（05 v2 重估）。
并行度取两者较小：**你的验收吞吐** 与 **token 预算**。

> ⚠️ **这是一个需要你确认的默认值，不是测出来的。** 判断方法：你一周能真正读完并裁决几个批次的产物？
> 超过 N 不会更快，只会让「待验收」堆高 —— 而堆高的待验收就是屎山的定义。

## 验收警报

「待验收」最老一张超过 **2 天** → 停止启动新批次，**只做验收**。

## 决策账本

**位置：`.scratch/wayfinder-vibe-distill/map.md` §`Decisions so far`。**

本仓库**不另建** `DECISIONS.md` —— map.md 已经是决策的权威源。
再加一份账本正是 `项目管理-总览.md` §7 记录的 **9 处漂移**的成因。不要再加一层。

## 三道闸门

| 闸 | 位置 | 谁过 | 通过标准 |
|---|---|---|---|
| **闸 S** | `/to-spec` 后、`/to-tickets` 前 | 人 | 确认 spec 的测试缝隙与范围 |
| **闸 T** | `/to-tickets` 后、进 `ready` 前 | 人 | 确认粒度与阻塞边 |
| **闸 V** | `/implement` 提交后 | 人 | 裁决 `/code-review` 结论 |

**本仓库现存的闸门缺口**：3 张 open 决策票（06 / 07 / 08）**全部卡在「待用户批准」**，
阻塞源是**审批**，不是技术。

闸门必须有人过。没人过，G1–G4 就永久停摆 —— 这是当前最大的流程风险，不是技术风险。

## 节奏

| 事件 | 触发 | 频率 |
|---|---|---|
| **补充** | `ready` 少于 3 张时，才从 `discovery` 拉新票 | 触发式 |
| **每日** | 只看一个数：「待验收」最老一张的年龄 | 每天 5 分钟 |
| **回顾** | 固定时段 | 每周 30 分钟 |

**回顾四问**：

1. 完成 vs 计划的偏差
2. 这周定了哪些决策 → **回写 `map.md`**（不是新建文件）
3. 技术债 → 跑 `/improve-codebase-architecture` 出候选
4. 下一个待决问题

## 度量

```bash
node scripts/flow-metrics.mjs                # 文本
node scripts/flow-metrics.mjs --json         # 结构化
node scripts/flow-metrics.mjs --days 60      # 拉长趋势窗口
```

一次覆盖**两个票面**，数据来自 `git log` 里 `status:` 变更的 diff。

**两个已知限制：**

1. **历史粒度取决于提交方式。** 票若一次提交写定终态，就看不到状态转移 → 周期时间不可算、吞吐按提交日期归周。
   **要拿到真实流动数据，状态变更必须单独提交。**（当前 8 张决策票就是一次提交写定的，所以周期时间是空的 —— 这不是 bug。）
2. **`.scratch/vibe-trading/` 被 gitignore**（只有它），其余 `.scratch/` 都在版本控制里。

## 反屎山现状

| 层 | 状态 |
|---|---|
| 物理边界 | ⚠️ 无强制。本项目是 Python + Rust，`/setup-ts-deep-modules` 不适用 |
| 提交闸门 | ✅ `.pre-commit-config.yaml` 已有（ruff / mypy / SKILL 质量门 / 行尾检查）；**但钩子没装** → 跑 `pre-commit install` |
| 评审闸门 | ✅ `/code-review` 双轴（Standards + Spec） |
| 粒度纪律 | 一批 ≤ 一个 context window；一票 = 一个 PR；一票 ≤ 5 文件 |
| 周期清理 | 回顾第 3 问 + `/improve-codebase-architecture` |

**R6 归口**：13 failed + 7 errors 长期无归属 → 建票走 `/triage`，别继续裸奔。
