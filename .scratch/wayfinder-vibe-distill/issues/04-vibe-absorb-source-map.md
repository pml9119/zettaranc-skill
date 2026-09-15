# Vibe-Trading 吸收点源码确认与移植路径

Type: research
Status: resolved（v2 全量重做）

## Question

基于 Q5 吸收清单，逐一在 .scratch/vibe-trading/ 里定位最小可移植代码单元：模块路径、入口函数、依赖（哪些 langchain 系必须剥离/重写）、与 zt 现有模块的对应关系。输出 artifacts/vibe-absorb-map.md，每项含移植评级（L0 直接抄/L1 改写/L2 重写）+ 测试来源。

## Answer

**v2 全量重做完成**（22 条路径/函数断言逐条实测）。

**推翻的断言（2 条）**：
1. **⑥「TDX/Pine 双向对接」不存在可移植代码** —— v1 称 `agent/src/skills/pine-script/*.py` 有代码、有 `export_pine()`。实测：该目录**只有 1 个 `SKILL.md`（15.3 KB），零 `.py`**；全仓**搜不到** `export_pine`。真实的 `--pine RUN_ID` 是**回测运行的 Pine 输出查看器**（`cli/_legacy.py:5224`），不是公式转换器。**即 Vibe 的 Pine 能力是「LLM 按提示词现场生成」，无确定性代码可移植**；zt 无 LLM 栈 → **该吸收项取消（N/A）**。连带作废 HANDOFF §3.2 的「pine-script ★★★★★ 直接对接 9 个通达信公式」评级（建立在不存在的东西上）。
2. **B5「重平衡纪律 / tolerance 漂移带」实质错误** —— `rebalance_mask.py` 实为**调仓日程契约**（offset alias / ISO 日期校验），无 tolerance；`rebalance_notes.py` 是**换手与权重漂移报表**（epsilon 用于*判定*调仓，非抑制小额交易）；全 backtest 目录**无** `rebalance_tolerance`/drift band。→ 拆为 **B5a 调仓日程契约** + **B5b 调仓报表（换手+权重漂移分离统计）**。

**规模数字更正**：MCP 工具 **66**（v1 称 74）；factors/zoo **468 py**（v1 称 462）。成立：**90 skills**（`agent/src` 下 90 个 SKILL.md）/ **78 tools** / **30 swarm presets** / 克隆 2,466 文件。

**核实为真（可直接继承）**：B1–B9 回测定位几乎全部命中（`base.py:598/647/669`、`china_a.py:98`、`validation.py:30/137`、`run_card.py:25/55/60`、`optimizers/base.py:68` 等）；①②③④⑤⑦⑨⑩ 的路径全部存在。

**连带修正一个旧疑点**：HANDOFF §3.3 记「zt `is_price_limit_hit` 疑似用当日 close 判定涨停 → 前视」。02 v2 实测其签名为 `is_price_limit_hit(kline, prev_close, ts_code)`（`execution_constraints.py:83`）—— **接收 `prev_close`，不存在前视**。B1 的价值因此下调为「补强执行时点价与未成交审计」。

**最有价值吸收项**：④ Shadow Account（**无 langchain**、LLM 可选注入且有模板兜底、直击 Z 哥「知行合一」）—— 但**评级由 L0-L1 收紧为 L1**：需剥离 `llm_translator` 路径，且引入 sklearn / matplotlib / jinja2 / **weasyprint** 四个 zt 现无的依赖（weasyprint 含 cairo/pango 系统库，集成成本最高）。真正的 L0 是 B3/B6/B7/B8。

**新增剥离原则**：**绝不依赖 Vibe 的 LLM 路径** —— 凡由「SKILL.md 提示词 + LLM 现场生成」实现的能力，一律视为不可移植。

产物：`artifacts/vibe-absorb-map.md`（v2）｜**v1 未存档（就地覆盖，操作失误已披露）**，19 条断言核实结论保留在 v2 §〇
