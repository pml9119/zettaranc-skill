# HANDOFF · ZK × Vibe-Trading × 逐字稿蒸馏

> ⚠️ **本文件已被同目录 `map.md` 取代——接续请读 `map.md`，勿按本文件回退。**
> 这是 **2026-09-10 写的早期快照**，它描述的状态在写入时**已经过期**：文中说「Q5 未决 / Q8 未问 / wayfinder 地图未建 / Q7 需先 commit 基线再开分支」，而实际上这些**当时都已完成**——地图在 `map.md`（含 Q5 最终拍板 + Out of scope），ticket 已开到 06，A1/A2 两批蒸馏已产出（`artifacts/distill/`），git 已在 `feature/vibe-distill-v5` @ `73c235f`。
>
> ### 🔴 本文件内**已被实测推翻**的两条具体断言（勿采信）
>
> 1. **§3.2 把 `pine-script` 标为「★★★★★ 直接对接 9 个通达信公式」—— 作废。**
>    实测（04 v2）：`.scratch/vibe-trading/agent/src/skills/pine-script/` 下**只有一个 `SKILL.md`（15.3 KB），零 `.py`**；全仓**搜不到** `export_pine`；CLI 的 `--pine RUN_ID` 是**回测运行结果查看器**，不是公式转换器。即 Vibe 的 Pine 能力是「LLM 按提示词现场生成」，**无可移植确定性代码**。9 个公式的对接**只走 02 v2 自建路径**。
> 2. **§3.3 记「复核 zt 现有 `is_price_limit_hit` 是否用当日 close 判定 —— 疑似前视」—— 疑点不成立。**
>    实测：签名为 `is_price_limit_hit(kline, prev_close: float, ts_code)`（`modules/simulator/execution_constraints.py:83`），**接收 `prev_close`**，不存在前视。
>
> 本文其余部分（§3.1 功能盘点、§3.3 回测双向对比）保留作历史参考。

> 写给「标准模式」新会话的交接文档。读完本文即可无损接续上一个会话（PTC 模式）的全部进度。
> 生成时间：本次会话结束时 ｜ 上一个会话 preset：PTC 模式（无法原地切换，见文末）

---

## 0. 任务原文（用户需求）

给项目 `D:\Users\pml\Desktop\ZK\zettaranc-skill` 添加功能：

1. **用 nuwa skill + cangjie skill 蒸馏 `E:\Z哥逐字稿` 里面的每一个内容**，把蒸馏好的合并进该项目，并给出合并方案。
2. **安装 https://github.com/HKUDS/Vibe-Trading**，对比它与该项目的优势，把好的东西补进/替换进项目。
3. 最终产物 = **吸收 Vibe-Trading + nuwa/cangjie 蒸馏产物** 产生的新项目。

已用 wayfinder skill 进入「规划/盘问」模式（本会话只做决策，不写代码）。

---

## 1. 已裁定事项（用户已拍板，不要再问）

| # | 问题 | 裁定 | 含义 |
|---|------|------|------|
| **Q1** | 蒸馏产出什么？ | **c) 两者都要** | 人物层（nuwa：心智模型/启发式/表达DNA → 刷新 SKILL.md）**+** 方法论层（cangjie：RIA 能力卡）；并与已有 32 篇 `knowledge/` 文档 **diff 合并**：已覆盖的合并补强、全新的额外添加 |
| **Q2** | 蒸哪些？ | **全部蒸馏，按主题分簇全覆盖，闲聊段也蒸** | 291 个 segment 全蒸；**主题标签在蒸馏每一段时顺手打上**（不是蒸完再分）；闲聊段归「人设/心态/表达」簇，进人物层不进方法论层 |
| **Q3** | 产物落位？ | **c) 混合** | 审计全档 → `books/zettaranc/`（cangjie 标准结构：candidates/rejected/capabilities/GLOSSARY/DIGEST）；运行时快照 → 编译进 `knowledge/`（现有 `knowledge_retriever` 零改版消费）；两者同一份编译脚本生成，自动同步 |
| **Q4** | Vibe-Trading 怎么装？ | **b + c** | b) `git clone --depth 1` 到 `.scratch/vibe-trading/` 做源码参考（**已完成**）；c) 需要实测 CLI/MCP 时用独立 venv；**绝不把 langchain/langgraph 栈混入 zt 核心依赖** |
| **Q6** | 新项目形态？ | **a) 仍叫 zettaranc-skill，升 v5.0.0**，同一仓库继续演进 | — |
| **Q7** | 脏工作区？ | **a) 先 commit 基线再开分支** | 当前约 20 个未提交改动（前端端口重构 WIP）；计划：`wip: frontend port & others` 基线 → 开 `feature/vibe-distill-v5` 分支干活；**此步尚未执行** |

### 未决

| # | 问题 | 状态 |
|---|------|------|
| **Q5** | 吸收 Vibe-Trading 哪些功能？ | **讨论中**。用户要求逐项讲清「是什么/有什么用」后再勾选。已解释：Alpha Zoo、Factor 研究页签（IC/分组净值/相关矩阵）、/show /continue 历史回放、回测引擎详细对比。**待用户最终勾选** |
| **Q8** | 先试点 1 簇还是直接全量？ | **未问**（因模式切换中断） |

---

## 2. 已确认的事实（不要重复调查）

### 2.1 项目本身

- 路径：`D:\Users\pml\Desktop\ZK\zettaranc-skill`，git remote `https://github.com/pml9119/zettaranc-skill.git`，分支 `main`
- 版本 `pyproject.toml` = **4.3.0**（README/SKILL.md 里写作 v4.2.0，存在不一致）
- 双轨：`SKILL.md`（37KB，Z哥人格层，nuwa 产物）+ `modules/`（Python 数据层，60+ 指标 / 30+ 战法探测器 / 回测 / 模拟器 / verify / Rust 加速核）
- `knowledge/` 已有 **32 篇** md（砖型图、B1/B2、三波理论等**已有部分覆盖**）
- `references/research/` 是 nuwa 风格 01–11 调研文件
- 有旧文档 `docs/合并迁移计划.md`（另一条线的计划，其中曾写「vibe-trading 参考源码留在 .scratch，ZK 不需要」——**已被本次新指示覆盖**）
- **工作区不脏化处理前是脏的**：约 20 个文件 M（api/frontend/modules 均有），无 stash
- 仓库**无** `.scratch/`、`docs/agents/`、`CONTEXT.md`、`CLAUDE.md`；有 `AGENTS.md`（已由系统自动注入）
- Python 可用：3.14.6（默认）、3.12、3.9、uv 的 3.12.12

### 2.2 语料 `E:\Z哥逐字稿`

- **93 个直播场次目录 → 291 个 segment**，每个 segment 含 `transcript.txt` + `transcript.json` + `notes.md`
- 体量：transcript.txt 共 **21 MB**，notes.md 共 **4.6 MB**
- 时间跨度：**2025-04-23 → 2026-04-30**（+ 一个 `战法` 目录）
- 存在大量「非重要内容」「闲聊」目录名
- **`战法/` 含 9 个通达信公式原稿**（可执行资产，非文字）：
  `主图副图指标/`：5日知行b1选.txt、真实换手率.txt、砖型图.txt
  `选股/`：b2特扑.txt、j选.txt、k选.txt、板砖.txt、白线附近.txt、超级b1.txt
- **`knowledge/` 已覆盖的部分**（避免重复蒸馏）：砖型图出现在 data_dictionary / indicators / signal_dictionary / portfolio-management / life-decision 等

### 2.3 Vibe-Trading（HKUDS）

- MIT、**32,777 stars**、Python ≥3.11、`pip install vibe-trading-ai` v0.1.14、langchain/langgraph 系
- **已克隆**到 `D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\vibe-trading\`（depth 1，HEAD `c09deea`）
- 规模：**90 个 skill 目录** + **78 个工具模块** + **30 个 swarm 预设** + 462 因子库
- 目录：`agent/{src/{agent,api,memory,swarm,skills,tools,factors,shadow_account,live,scheduled_research,channels,quantlib,...},backtest/{engines,loaders,optimizers},cli,evals,skills}`、`frontend`、`desktop`、`wiki`

---

## 3. Vibe-Trading 功能盘点（已向用户讲解）

### 3.1 完整功能清单（已讲解）

Agent 引擎（自然语言路由 / 90 skills / 78 tools / 30 swarm）、数据与回测（跨市场 25 源 + fallback + provenance / 回测引擎 / Alpha Zoo 462 因子 / Factor 研究页签 / Tearsheet / Options Lab / --pine 导出 TDX）、研究流程与记忆（持久记忆 / 会话搜索 / /show /continue 回放续跑 / hypothesis / thesis tracker / playbook 定时 / 交易日志 + Shadow Account）、安全与实盘（kill switch / fail-closed + 审计账本 / TAP 模式 / 券商连接器）、接入面（MCP / CLI TUI / FastAPI / 16 IM 适配器 / Electron / Docker）、自改进生态（strategy discovery 证据门 / 依赖哈希锁 / 300+ 贡献者）

### 3.2 A 股可用清单（已按用户要求只列 A 股可用的）

- **A 股专属 skill（直接可用）**：tushare、akshare、mootdx、eastmoney、iwencai、chanlun、ashare-pre-st-filter、regulatory-knowledge、trade-journal、shadow-account、report-generate、earnings-forecast、fundamental-filter、valuation-model、financial-statement、convertible-bond、etf-analysis
- **通用量化（改造后可用）**：candlestick、technical-basic、pattern_tool、factor-research、multi-factor、alpha-zoo、alpha_bench/compare、backtest-diagnose、execution-model、risk-analysis、performance-attribution、quant-statistics、correlation-analysis、seasonal、ml-strategy、strategy-generate、strategy-discovery、thesis-tracker、research-discipline、research-goal、sector-rotation、management-deep-dive、investor-lenses、behavioral-finance、bottleneck-hunter、correlation-regime、macro-analysis/global-macro、geopolitical-risk、commodity-analysis、dividend-analysis、event-driven、pair-trading、volatility、harmonic/elliott-wave/ichimoku/smc、doc-reader/web-reader/image_vision/web_search、**pine-script（★★★★★ 直接对接 9 个通达信公式）**、vnpy-export、minute-analysis、market-microstructure、data-routing
- **A 股专属 tool（★ 项目缺的能力）**：market_data、market_screener、sector、fund_flow、northbound、dragon_tiger、block_trades、margin_trading、lockup_expiry、shareholder_count、research_reports、stock_news、iwencai_tool、trade_journal_tool、shadow_account_tool、get_fundamentals、financial_statements、factor_analysis、alpha_zoo/bench/compare、pattern_tool、sdm_register/status/decay_scan、strategy_discovery、report_audit、financial_rigor、session_search、remember、goal/hypothesis、scheduled_research、swarm_tool、portfolio_risk、cashflow_analytics
- **不吸收**：多市场数据层（加密/美股/外汇/期权/印度/韩国/越南/台湾）、真实券商下单、langchain 栈、17 渠道 IM 全家桶、Electron 桌面端

### 3.3 回测引擎详细对比（已完成，结论如下）

| 维度 | 胜者 | 说明 |
|------|------|------|
| A 股规则精度（Decimal 涨停价、停牌检测） | **zt** | zt 用 Decimal+ROUND_HALF_UP 修掉银行家舍入；VT 无独立停牌检测 |
| 动态滑点（ATR + 量比惩罚） | **zt** | VT 是固定比例 |
| Rust 加速 + 网格搜索 | **zt** | VT 纯 Python |
| 五项硬门槛验收（Sharpe/Calmar/胜率/MaxDD/OOS-IS） | **zt** | VT 无硬门 |
| 组合优化（4 优化器 + 可组合权重约束） | **VT** | 压倒性 |
| 调仓控制（漂移带 rebalance_tolerance、调仓日历） | **VT** | 压倒性 |
| 统计显著性（蒙特卡洛置换检验、Bootstrap Sharpe CI） | **VT** | 压倒性 |
| 前视偏差防呆 | **VT** | 涨跌停判定用 pre_close + 执行时点价 |
| 策略沙箱（AST 静态审计 40+ 校验） | **VT** | 大胜 |
| 可复现（run_card + config_hash/strategy_hash） | **VT** | 大胜 |
| 预热期显式声明 warmup_bars | **VT** | 大胜 |
| 绩效/因子归因 | **VT** | 大胜 |

**回测专项吸收建议 B1–B8（必收）**：
B1 蒙特卡洛置换检验+Bootstrap CI → `modules/verify/validation.py`（新增）；
B2 权重约束层（单票上下限/分组敞口）→ `modules/backtest/constraints.py`；
B3 调仓漂移带 `rebalance_tolerance`；
B4 实际成交 vs 目标持仓分离；
B5 前视偏差守卫（**复核 zt 现有 `is_price_limit_hit` 是否用当日 close 判定 —— 疑似前视**）；
B6 预热期 `warmup_bars`；
B7 Run Card（config_hash + strategy_hash）→ `modules/backtest/run_card.py`（新增）；
B8 按标的/按退出原因统计 → 扩展 `modules/core/metrics.py`。
**可选 B9–B12**：优化器、换手三口径、市场冲击模型、AST 沙箱。
**保留 zt 优势**：Rust 核、五项硬门、Decimal 涨停价、停牌检测、动态滑点、A 股专注。

---

## 4. 我此前给出的吸收清单（待用户最终勾选 = Q5）

1. MCP server（zt 工具暴露给 Claude Code）
2. Swarm 多视角评审（B1味/砖型味/筹码味/基本面味）
3. 持久记忆 + 会话搜索
4. Alpha Zoo 模式 → **战法库榜单**（30+ 探测器可浏览/回测/对比/导出）
5. Factor 研究 → **战法成绩单**（IC 序列/统计、分组净值、IC 相关矩阵）
6. TDX/Pine 公式双向对接（`E:\Z哥逐字稿\战法\` 9 个公式 ⇄ Python 探测器）
7. Kill switch 熔断 + 风控门
8. Playbook 定时研究
9. IM 通知（只保留飞书 1 个）
10. **知行差距诊断**（trade_journal + shadow account）★ 最贴合 Z 哥「知行合一」
11. **防幻觉审计**（report_audit + financial_rigor）
12. 运行档案 + 续跑（/show + /continue）
13. **A 股资金/情绪工具补全**（sector + fund_flow + northbound + margin + shareholder_count）
14. 回测引擎吸收 B1–B8（见 §3.3）

---

## 5. 下一步（新会话从这里开始）

1. **收尾 Q5**：让用户对 §4 清单勾选（给默认推荐「全要」）。
2. **问 Q8**：先试点 1 簇（砖型图，约 8 个 session）还是直接全量分批。
3. **执行 Q7**：commit 基线 → 开 `feature/vibe-distill-v5` 分支。
4. **建 wayfinder 地图**（本地 markdown tracker 约定）：
   - 地图：`.scratch/wayfinder-vibe-distill/map.md`（含 Destination / Notes / Decisions so far / Not yet specified / Out of scope）
   - 子 ticket：`.scratch/wayfinder-vibe-distill/issues/NN-<slug>.md`，含 `Type:`（research/prototype/grilling/task）、`Status:`（claimed/resolved）、`Blocked by:`
5. **并行 fire research 子代理**：Vibe-Trading 源码深对比 / 语料覆盖差异分析 / 战法公式→探测器可行性。
6. **开始试点蒸馏**（cangjie 五阶段流水线 + nuwa 六维调研）。

### wayfinder Destination 草稿（供新会话沿用）

> 把 `zettaranc-skill` 升级为 **v5.0.0** —— 一个「Z 哥思维操作系统 + A 股量化判断引擎」双轨合一的项目：人物层由 291 段逐字稿全量蒸馏刷新（nuwa + cangjie 混合，与 32 篇现有知识 diff 合并），工具层吸收 Vibe-Trading 的 MCP/记忆/swarm/战法库/因子研究/公式对接/熔断/知行诊断，最终形态是**可安装、可被 Claude Code 等 agent 直接调用、可自我迭代**的新项目（仍叫 zettaranc-skill，v5.0.0）。

---

## 6. 关于切换 preset（为什么需要新会话）

DSH 的 agent preset（PTC 模式 / 标准模式）**在会话创建时固定**，Host 拒绝把已运行的会话改成另一个 preset：

- `dsh-client-ui-agent-preset/lib/client.js:1385` —— "A running session keeps the composition it began with (the host refuses to adopt an existing session under a different preset)."
- 同文件 `:1348` —— 切换只在 `session.blank`（空白会话）时生效。

**所以：本会话无法原地切到标准模式，必须新建会话。**

操作：
1. 回到新建会话界面 → 顶部的 preset chip 选「标准模式」→ 该选择落到下一个新会话；
2. 若希望以后**默认**都是标准模式：设置 → preset 名单分区 → 对「标准模式」点「设为默认」（写入 `agent-presets` 命名空间的 `default` 字段）。注意 chip 上的暂存选择用掉一次就清空，下次新会话又回到部署默认值——所以长期切换要用「设为默认」。

新会话开场建议直接说：**「读 `.scratch/wayfinder-vibe-distill/HANDOFF.md`，继续 ZK 蒸馏 + Vibe 吸收任务」**
