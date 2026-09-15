# 通达信公式→Python 探测器语义映射研究

Type: research
Status: resolved（v2 全量重做）

## Question

E:\Z哥逐字稿\战法\ 有 9 个通达信公式原稿（砖型图/5日知行b1选/b2特扑/j选/k选/板砖/白线附近/超级b1/真实换手率）。研究：① 每个公式选股逻辑逐行语义拆解（VAR/SMA/STICKLINE/CROSS/REF 等函数 → pandas 算子）；② 提取可复用的指标原语；③ 给出「公式→modules/strategies 探测器」的翻译规范（命名、输入输出、pytest 对齐方式）；④ 标注公式中无法直接翻译（需人工判断）的部分。产出 artifacts/tdx-formula-mapping.md。

## Answer

**v2 全量重做完成**（核实原则：凡断言必回源）。

**核心修正（v1 的致命错误）**：
- v1 通篇使用 `brick_vec(df)`「复用 `calculate_brick_value` 的**全序列版**」—— **该函数不存在**。实测 `calculate_brick_value(klines) -> float` **只返回单点值**，全仓无砖型图序列函数。而 **5/9 公式**（①⑤⑦⑧⑨）依赖 `REF(砖型图,1/2)`，即必须要序列 → 按 v1 实现会**直接卡死**。
- **本 ticket 第一优先交付 = 新增 `calculate_brick_series()`**（O(n) 单遍，含完整实现要点 + 回归测试锚点 `series[-1] == calculate_brick_value(klines)`，**仅对 `len>=12` 成立** —— `n<12` 时后者提前返回 0）。
- 附带给出现有两个绕过实现的 **2 个隐藏缺陷**：① `len<12` 门槛污染序列头部（前缀循环前 4 个值伪造为 0）② `detect_brick_signals` → `detect_four_brick_system` → 前缀重算 = **O(n³)**。

**其他修正**：
- 探测器签名 v1 写 `(klines, index, **overrides)`，实际仓库约定是 `detect_b1(klines, index, kirin_context=None)`（`base_strategies.py:12`）
- StrategySignal 字段 v1 漏 4 个（target_price/risk_ratio/price/reason）
- 「公式与标题不一致」v1 记 **4 处 → 实为 8 处**（新增：⑨超级b1 整段强势形态缺失致 5 参数全死、⑤⑨注释写「三分之四」而代码 2/3、④ `MV_THRESHOLD` 声明但硬编码 30、③注释写 −1.27% 而代码 −2%）
- **新增发现：过滤器在 6 个选股公式间有 3 类差异**（科创板判定、ST 变体数 2 vs 4、北交所），必须可组合建模
- **不可翻译项 10 → 13 项**（新增：砖序列原语缺失、序列头部对齐口径、0/0 除零分支）

**最高风险项**：③真实换手率 `HSL = VOL/(FINANCE(46)/100)*100` —— 若数据源 VOL 单位是**股**而非**手**，换手率差 **100 倍**。实现前必须实测。

**与 01 v3 骨架挂接**：9 个公式全部落在 **M1/M3/M4** —— 与「专精图体系缺失」「关键K 薄弱」两大缺口正好互补。

产物：`artifacts/tdx-formula-mapping.md`（v2）｜**v1 未存档（就地覆盖，操作失误已披露）**，其断言核实结论保留在 v2 §〇
