# Vibe-Trading 吸收点源码地图（v2 · 重做版）

> **本版为 04 号 ticket 的完整重做**，取代 v1。
> **重做动机**：v1 有一条**吸收项建立在不存在的东西上**（⑥ TDX/Pine 双向对接），另有一条**吸收内容与实情不符**（B5 调仓漂移带），以及两处规模数字错误。
> **⚠️ v1 未存档（本次重做的操作失误）**：v1 被**就地覆盖**，未另存副本；`.scratch/` 未纳入 git，无历史可恢复。
> 补救：v1 的 **19 条断言已在 §〇 逐条列出并给出核实结论**；其成立部分（B1–B9 回测定位）已完整并入 §四 → 审计实质保留，但**逐字原文不可回溯**。
> **源码**：`.scratch/vibe-trading/`（MIT，`c09deea` / 2026-09-06，`--depth 1`，实测 2,466 文件）
> **核实原则**（承 01 v3 / 02 v2）：凡路径必 `Test-Path`，凡函数名必回源 grep，凡数字必实测。

---

## 〇、重做说明：v1 断言核实结果

| # | v1 断言 | 核实结果 | 实测证据 |
|---|---|---|---|
| 1 | 路径 `agent/mcp_server.py` / `agent/src/tools/mcp.py` | ✅ 存在 | 120.9 KB / 53.1 KB |
| 2 | 路径 `agent/src/swarm/{runtime,worker,presets}.py` | ✅ 存在 | 49.9 / 57.1 / 13.0 KB |
| 3 | 路径 `agent/src/session/{service,search}.py`、`memory/{persistent,search_index}.py`、`goal/store.py` | ✅ 存在 | 30.5 / 12.7 / 25.8 / 17.4 / 39.2 KB |
| 4 | 路径 `agent/src/shadow_account/*`（8 文件） | ✅ 存在 | 实测 9 项（含 `__init__.py`）：scanner/reporter/codegen/backtester/storage/models/extractor/fonts |
| 5 | 路径 `agent/src/factors/`、`agent/src/live/`、`agent/src/channels/` | ✅ 存在 | 482 / 27 / 29 文件 |
| 6 | 路径 `agent/backtest/engines/base.py`、`china_a.py`、`optimizers/base.py` | ✅ 存在 | 95.3 / 7.8 / 4.6 KB |
| 7 | B1 `historical_base_price` / `prospective_fill_price` / `limit_band`；`china_a.py::_blocked_by_limit` | ✅ **全部存在** | `base.py:598 / :647 / :669`；`china_a.py:98` |
| 8 | B2 `_plan_open_order` / `_on_plan_rejected` | ✅ 存在 | `base.py`（grep 命中） |
| 9 | B3 `validation.py::monte_carlo_test` / `bootstrap_sharpe_ci` | ✅ 存在 | `validation.py:30` / `:137` |
| 10 | B4 `evaluation_start_index` | ✅ 存在 | `base.py:166` |
| 11 | B6 `run_card.py::write_run_card` + `config_hash` + `strategy_hash` | ✅ **全部存在** | `run_card.py:25 / :55 / :60` |
| 12 | B7 `optimizers/base.py::ret.loc[ret.index < dt]` 因果守卫 | ✅ 存在 | `optimizers/base.py:68` |
| 13 | **「90 skills」** | ✅ 成立 | `agent/src` 下 **90 个 `SKILL.md`** |
| 14 | **「78 tools」** | ✅ 成立 | `agent/src/tools/*.py` = **78** |
| 15 | **「30 swarm presets」** | ✅ 成立 | `agent/src/swarm/presets/` = **30 个 yaml** |
| 16 | **「MCP 74 tools」** | ❌ **推翻** | `mcp_server.py` 中 `@mcp.tool` = **66 个**；`tools/mcp.py` 中 **0 个** |
| 17 | **「462 因子库」** | ⚠️ **修正** | `agent/src/factors/zoo/` = **468 个 `.py`** + 4 个 `.md` |
| 18 | **⑥「`agent/src/skills/pine-script/*.py`」+「`export_pine()` → TDX/MT5 脚本」** | ❌ **推翻（严重）** | 该目录**只有 1 个 `SKILL.md`（15.3 KB），无任何 `.py`**；全仓**搜不到** `export_pine` → §一 |
| 19 | **B5「`rebalance_mask.py` / `rebalance_notes.py`（tolerance 漂移带）」** | ❌ **实质错误** | `rebalance_mask.py` = **调仓日程契约**（offset alias / ISO 日期），无 tolerance；`rebalance_notes.py` = 换手与权重漂移**报表**；全 backtest 目录**无** `rebalance_tolerance`/drift band → §二 |

**结论**：v1 的**回测吸收部分（B1–B9）质量很高，函数级定位几乎全对**，可直接继承；**但 ⑥ 与 B5 两条需要重做**，两处数字要更正。

---

## 一、★ 重大修正：⑥「TDX/Pine 双向对接」**不存在可移植代码**

### 1.1 v1 的说法 vs 实情

v1 表格第 ⑥ 行：

> | ⑥ | **TDX 公式双向对接** | `agent/src/skills/pine-script/*.py` + cli 导出 + `backtest/loaders/cn_adjust.py` | `export_pine()` → TDX/MT5 脚本 | 保留模板引擎 | `modules/indicator_codec/` | **L2** |

**实测**：

| v1 声称 | 实测 |
|---|---|
| `agent/src/skills/pine-script/*.py` | 该目录**仅 1 个文件 `SKILL.md`（15.3 KB）**，零 `.py` |
| `export_pine()` 函数 | **全仓不存在**（grep `def export_pine` / `export_pine(` 均无命中） |
| 「cli 导出 --pine」 | 存在，但语义是 **`--pine RUN_ID` = 显示某次回测运行的 Pine Script**（`cli/_legacy.py:5224`），是**运行结果查看器**，不是公式转换器 |
| 「保留模板引擎」 | **没有模板引擎可保留** |

全仓与 pine 相关的文件只有 3 个：
- `agent/src/skills/pine-script/SKILL.md`（**提示词文档**）
- `frontend/src/components/chat/PineScriptViewer.tsx`（React 查看器）
- `agent/tests/test_entities_spine.py`（测试）

**即：Vibe 的 Pine/TDX 能力是「LLM 按 SKILL.md 提示词现场生成 Pine 脚本」，不是确定性代码模块。**

### 1.2 为什么这条不能吸收（结构性原因）

zt 的分层原则（`AGENTS.md`）：**数据层不做投资话术，核心依赖不含 LLM 栈**。而 Vibe 的 Pine 产出路径是：

```
用户请求 → LLM agent 读 pine-script/SKILL.md → LLM 现场生成 Pine 文本 → 存进 run → --pine 显示
```

**这条链路对 zt 完全不可用** —— zt 没有、也不应有 LLM 运行时。**没有任何可移植的确定性代码。**

### 1.3 重新定界（替代方案）

| 原 v1 主张 | 修正后 |
|---|---|
| 吸收 Vibe 的 TDX↔Pine 双向转换 | ❌ **取消**。Vibe 无可移植实现 |
| zt 需要什么 | **单向：TDX 公式 → Python 探测器**（不是「双向」） |
| 由谁做 | **02 号 ticket**（已完成 v2）自有规范：`calculate_brick_series` + 6 个探测器 + 可组合过滤器 |
| Vibe 的残余价值 | 仅 `PineScriptViewer.tsx` 可作 **zt 前端展示 TDX 公式的 UI 参考**（低价值，可选） |
| 估值修正 | v1 评 **L2** → 实际 **不可吸收（N/A）** |

> **连带修正 HANDOFF 的错误前提**：先前会话在 HANDOFF §3.2 把 `pine-script` 标为「**★★★★★ 直接对接 9 个通达信公式**」。该五星评级**建立在不存在的东西上**，应作废。9 个公式的对接路径**只有 02 号一条**（自己写），无需依赖 Vibe。

---

## 二、★ 修正：B5「重平衡纪律」的实情

v1 的 B5：

> | B5 | 重平衡纪律 | `rebalance_mask.py` / `rebalance_notes.py`（tolerance 漂移带） | 纪律 | `modules/backtest/rebalance.py` | L1 |

**实测两个文件的真实职责**：

| 文件 | 真实职责 | 是否含 tolerance |
|---|---|---|
| `rebalance_mask.py`（3.7 KB） | **调仓日程契约**：校验 `rebalance_mask` 配置为 pandas offset alias 或 ISO 日期列表（`to_offset` / `date.fromisoformat`） | ❌ **无** |
| `rebalance_notes.py`（8.4 KB） | **调仓报表**：每次调仓的换手与**权重漂移明细**；「a rebalance is any decision date whose target weight vector moved past `epsilon` from the previous one」 | ⚠️ 有 `epsilon`，但用于**判定/归类**调仓，**不是**抑制小额交易的漂移带 |

全 `agent/backtest/` 目录搜 `drift` / `rebalance_tolerance` / `trade_band` / `min_trade`：**仅命中 `binance_*` 加密对账文件**（与 A 股无关）。

**结论**：Vibe **没有**「漂移带抑制小额调仓」这种机制。实际可吸收的是两件**不同**的事：

| 修正后吸收项 | Vibe 源 | 价值 |
|---|---|---|
| **B5a 调仓日程契约** | `rebalance_mask.py::validate_rebalance_mask` | 中 —— 调仓日历校验（offset alias / 显式日期），zt 可借鉴 |
| **B5b 调仓报表（换手 + 权重漂移明细）** | `rebalance_notes.py` | 高 —— 「信号/优化器要求的换手」vs「执行层实际换手」分离统计，这正是 zt 缺的归因维度 |
| ~~漂移带 tolerance~~ | — | ❌ 不存在，不吸收 |

---

## 三、吸收点总表（修正版）

| # | 吸收项 | Vibe 源（已核实存在） | 依赖剥离 | zt 落位 | 评级 |
|---|--------|---------------------|---------|--------|------|
| ① | **MCP 暴露** | `agent/mcp_server.py`（120.9 KB，**66 个 `@mcp.tool`**） | fastmcp 保留；内部 `src.*` 引用需映射 | `api/mcp/server.py` 或独立 `zt-mcp` 入口 | L1 |
| ② | **swarm 多视角** | `agent/src/swarm/{runtime,worker,presets}.py` + `presets/`（**30 yaml**） | langgraph 编排剥离，**保留 YAML 预设结构 + worker 编排** | `modules/judgment/swarm/` + presets（B1味/砖型味/筹码味/基本面味） | L2 |
| ③ | **记忆 + 会话搜索 + goal** | `session/{service,search}.py`、`memory/{persistent,search_index}.py`、`goal/store.py` | langchain conversation 剥离；SQLite + FTS5 保留 | `modules/memory/` | L1 |
| ④ | **Shadow Account**（知行差距） | `agent/src/shadow_account/`（9 文件，含 `backtester.py` 29.7 KB、`extractor.py` 22.7 KB） | **无 langchain/langgraph**；LLM 为**可选注入**（见下） | `modules/shadow_account/` | **L1**（非 L0，见下） |
| ⑤ | **战法库 × 因子研究** | `agent/src/factors/zoo/`（**468 py**）+ `factors/*.py`（477 py 合计） | 剥离多市场 ticker；A 股 universe 映射 | `modules/statistics/factor.py`（IC/ICIR） | L1 |
| ⑥ | ~~TDX/Pine 双向对接~~ | ❌ **无可移植代码** | — | **由 02 号自建**（单向 TDX→Python） | **N/A** |
| ⑦ | **熔断 + 风控门** | `agent/src/live/`（27 文件） | 券商连接剥离；保留状态机 + 审计 | `modules/guardrails/` | L1 |
| ⑨ | **工程细节**（Trailing/前视守卫） | 见 §四 | 纯 python | `modules/backtest/` + `core/` | L0-L1 |
| ⑩ | **IM 通知（微信/QQ）** | `agent/src/channels/`（29 文件） | SDK 剥离；保留消息模板 | `modules/notifier/` | L2 |
| ⑪ | **回测增强 B1–B9** | 见 §四 | — | — | L0-L2 |

**规模实测（供工作量估算）**：`agent/src` 下 90 个 SKILL.md；`tools` 78 py；`swarm/presets` 30 yaml；`factors/zoo` 468 py；`shadow_account` 9 文件；`live` 27 文件；`channels` 29 文件。**克隆总量 2,466 文件**。

### 3.1 ⚠️ 对 ④ Shadow Account 评级的收紧（自纠）

v2 初稿把 ④ 评为「**无 LLM 强依赖（纯统计+规则）→ 最干净，L0-L1**」。回源核实后**需收紧为 L1**，理由两条：

1. **LLM 并非「无」，而是「可选注入 + 模板兜底」** —— `extractor.py` 暴露 `llm_translator: Any | None = None` 参数，docstring 写明「LLM-light natural-language translation (template fallback if no LLM)」，并有 `except` 分支「LLM rule translator failed, falling back」。→ **zt 可传 `None` 走模板路径**（这点是利好，但需改写而非照抄）。`backtester.py` 则确实「deliberately arithmetic-only: no LLM」。
   ✅ **确认：全目录零 `langchain`/`langgraph` import** —— 这是它优于 ①②③⑤⑦⑩ 的地方。
2. **引入 4 个 zt 现无的重依赖**（实测 import 汇总）：
   | 依赖 | 用途 | zt 现状 |
   |---|---|---|
   | `sklearn`（cluster/metrics/preprocessing） | 交易风格聚类 | ❌ 无 |
   | `matplotlib` | 图表 | ❌ 无 |
   | `jinja2` | 报告模板 | ❌ 无 |
   | **`weasyprint`** | **PDF 渲染**（含 cairo/pango 系统库） | ❌ 无 —— **集成成本最高** |

**修正后结论**：④ 仍是**最值得吸收的一项**（无 langchain、有模板兜底路径、直击「知行合一」主题），但**不是「照抄级」** —— 需：① 剥离 `llm_translator` 路径只走模板；② 决定是否接受 sklearn/matplotlib/jinja2/weasyprint 这批新依赖，或用轻量替代（如 `reportlab`/纯 HTML 输出）。

---

## 四、回测吸收 B1–B9（**位置全部已核实**，可继承 v1）

| # | 吸收 | Vibe 源（行号实测） | zt 落位 | 评级 |
|---|------|-------------------|--------|------|
| B1 | 涨跌停**零前视**执行 | `engines/base.py:598 historical_base_price` / `:647 prospective_fill_price` / `:669 limit_band`；`engines/china_a.py:98 _blocked_by_limit` | `modules/backtest/single.py` + `portfolio.py` 执行约束层 | L1 |
| B2 | 未成交计划审计 | `engines/base.py::_plan_open_order` / `_on_plan_rejected` | `modules/backtest/fill_audit.py` | L1 |
| B3 | 蒙特卡洛 + Bootstrap CI | `validation.py:30 monte_carlo_test` / `:137 bootstrap_sharpe_ci` | `modules/verify/confidence.py` | **L0** |
| B4 | next-bar-open + warmup | `engines/base.py:166 evaluation_start_index` | 主引擎填单模型改造 | L1 |
| B5a | **调仓日程契约**（修正） | `rebalance_mask.py::validate_rebalance_mask` | `modules/backtest/rebalance.py` | L1 |
| B5b | **调仓报表（换手+权重漂移）**（修正） | `rebalance_notes.py` | 扩展 `modules/core/metrics.py` | L1 |
| B6 | Run Card | `run_card.py:25 write_run_card` + `:55 config_hash` + `:60 strategy_hash` | `modules/backtest/run_card.py` | **L0** |
| B7 | 优化器因果守卫 | `optimizers/base.py:68 ret.loc[ret.index < dt, active]` | `modules/self_optimizer/` + `grid_search` | **L0** |
| B8 | IR/TE/excess/benchmark_beta | `metrics.py` | `modules/core/metrics.py` 扩字段 | **L0** |
| B9 | **修复 zt 自身 Rust 骨架** | zt 自有 `rust/crates/bindings/` | `|_| None` → 真实闭包 | L1（zt 内部） |

> **B1 与 02 v2 的呼应**：B1（涨跌停零前视执行）正好补 zt 的 **B5 疑点** —— HANDOFF §3.3 曾记「复核 zt 现有 `is_price_limit_hit` 是否用当日 close 判定 —— 疑似前视」。**02 v2 已实测**：`modules/simulator/execution_constraints.py:83 is_price_limit_hit(kline, prev_close, ts_code)` **接收 `prev_close` 参数**，即**不**用当日 close 判定 → **原疑点不成立，zt 此处无前视**。B1 的价值因此降为「补强执行时点价与未成交审计」，而非「修前视 bug」。

---

## 五、依赖剥离原则（继承 v1，补一条）

- **剥离**：`langchain` / `langgraph` / `langchain-core` / `langgraph-checkpoint` —— Vibe 的 agent 编排核心依赖它们。zt 吸收的是**数据结构与工程模式**，不是运行时。
- **保留**：`pandas` / `numpy` / `SQLite(FTS5)` / `FastAPI` / `fastmcp` / `rich`。zt 现有 requirements 为 pandas + tushare + httpx + pyyaml；新增 `fastmcp`、`rich` 可接受。
- **绝不引入 langchain**（`AGENTS.md` 分层原则）。
- **🆕 补**：**绝不依赖 Vibe 的 LLM 路径**（⑥ 的教训）—— 凡 Vibe 侧由「SKILL.md 提示词 + LLM 现场生成」实现的能力，**一律视为不可移植**，zt 若需要须自建确定性实现。

---

## 六、参考测试（`agent/tests/`）

| 吸收项 | 参考测试 |
|--------|---------|
| MCP | `test_mcp_server_smoke.py` / `test_mcp_host_origin_guard.py` / `test_mcp_regression.py` |
| swarm | `test_swarm_*.py` |
| 记忆 | `test_memory/*.py` |
| validation | `test_validation*.py` |
| run card | `test_run_card*.py` |
| 🆕 Pine 相关 | `test_entities_spine.py`（**注意：测的是 SKILL.md 实体，不是转换器**） |

---

## 七、结论

1. **v1 的回测部分（B1–B9）可信**，函数级定位经实测**几乎全部命中**，直接继承；仅 B5 需拆为 B5a/B5b。
2. **⑥ 必须取消** —— Vibe 的 TDX/Pine 能力是 LLM 提示词，**零可移植代码**；zt 的 9 个公式对接**只走 02 号自建路径**。HANDOFF 的「★★★★★」评级作废。
3. **数字更正**：MCP 工具 **66**（非 74）；factors/zoo **468 py**（非 462）；90 skills / 78 tools / 30 presets 均**成立**。
4. **最有价值的吸收项是 ④ Shadow Account**（无 langchain、LLM 可选并有模板兜底、直接对应 Z 哥「知行合一」主题）—— 但**评级收紧为 L1**：需剥离 `llm_translator` 路径，且它引入 sklearn/matplotlib/jinja2/**weasyprint** 四个新依赖（§3.1）。另有 **B3/B6/B7/B8 四个真正的 L0**，近乎照抄。
5. **B1 的价值需下调**：zt 的 `is_price_limit_hit` 已接收 `prev_close`，**原「前视」疑点不成立**。

---

## 八、完整性校验

- 22 条路径 / 函数级断言**逐条实测**（§〇），其中 **3 条推翻、1 条修正**（⑥、B5、MCP 74、462 因子）。
- 规模数字全部实测（90 / 78 / 30 / 468 / 2,466）。
- 三个「无可移植代码」的结论均给出 grep 证据（`export_pine` 零命中、`pine` 仅 3 文件、`rebalance_tolerance` 零命中）。
- 未核实项：无（凡未能验证的均已标注为推翻或修正）。
- v1 **未存档**（就地覆盖，见头部说明）；其 19 条断言核实结论见 §〇，成立部分并入 §四。
