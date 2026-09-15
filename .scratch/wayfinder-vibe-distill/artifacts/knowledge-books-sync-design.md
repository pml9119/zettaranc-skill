# books/ ↔ knowledge/ 同步编译机制设计（06 号 ticket 原型）

> 目标：cangjie capability bundle（verified.yaml + cards/*.md）→ knowledge/ 下与现有 32 篇同构的 md（RAG 消费零改版）。
> 现实约束：knowledge_retriever.py 消费外部 RAG API（KB_API_URL + KB_ENABLED=false 时返回空）——即 knowledge/ 是知识库服务的**源文件**，格式必须与现有文档一致。

## 一、输入输出

输入（cangjie 产物）: books/zettaranc/.cangjie/capabilities/ -> verified.yaml（capability 清单）+ cards/<slug>.md（RIA 卡）+ book/overview.md + glossary.md
输出（knowledge/）: 与现有 32 篇同构的 md：如 砖型图定式.md（新）、indicators.md 追加「砖型图-补充」节（合并补强）

## 二、编译规则（deterministic）

1. **能力卡 → knowledge md**：每张 cards/<slug>.md → knowledge/<topic>.md（RIA 六段转成知识文档体例：章节化 R/I/A1/A2/E/B）
2. **与现有 32 篇的 diff（关键）**：
   - 提取现有知识文件中**已覆盖的相同 topic**（如 indicators.md 的砖型图节、signal_dictionary.md 的砖型图字段）
   - 对每张卡：标注「已覆盖（合并补强）→ 生成 patch 段」或「全新 → 新增文档」
   - 合并模式：**补强写回原文件对应节**（用「### 补充」小节追加），**全新放新文件**（knowledge/<new-topic>.md）
3. **避免重复蒸馏**：已有 32 篇覆盖 topic → 卡只提取「增量」（diff 已覆盖/新增表），不重写全文
4. **审计链**：books/ 原样保留（candidates/rejected/verified.yaml/cards）——**books/ 是全档，knowledge/ 是运行时快照**
5. **防手改冲突**：编译前检测 knowledge/ 目标文件是否被手改（hash 对比；手改则**三选一**：跳过 / 合并到新节 / 报错人工处理）——绝静默覆盖

## 三、脚本原型（dry-run 逻辑）

[scripts/compile_knowledge.py 概念原型]
- load_bundle(bundle_dir) -> list[Card]：读 verified.yaml + cards/*.md
- load_existing(knowledge_dir) -> dict[str, Doc]：现有 32 篇（按主题关键词索引）
- classify(card, existing) -> DiffResult：命中 existing 同主题 → Coexist（合并补强，生成 patch 新节追加）；未命中 → New（新增文档）
- write_knowledge(knowledge_dir, results, mode)：mode="dry-run" 只打印计划（推荐先跑）；mode="apply" 写文件，每文件 hash 检测（改动过 → 三选一，不静默覆盖）
- main()：results = [classify(c, load_existing()) for c in load_bundle()]; render_plan(results) —— 计划表：卡 → 动作（补强/新增）+ 目标文件

## 四、dry-run 预期输出（演示）

| 能力卡 | 现有知识 | 动作 | 目标文件 |
|--------|---------|------|---------|
| 砖型图定式 | signal_dictionary.md「七、砖型图」 | 补强（追加：三种定式/黄金信号/数砖规则） | signal_dictionary.md（新增小节）|
| 砖型图-MACD 共振 | indicators.md「砖型图与MACD共振」 | 补强（追加：空头区间压制表） | indicators.md |
| 止损理念（壁虎断尾） | 无 | 新增文档 | knowledge/stop-loss-philosophy.md |
| B1/B2 共振规则 | 无 | 新增文档 | knowledge/brick-resonance.md |

## 五、边界

- knowledge_retriever 的 KB_API_URL 外部服务：本编译只产出**源 md**，不直接写向量库；知识库服务的索引更新由宿主另行触发（文档说明）。
- 冻结规则：books/ 只读（cangjie 生成）；knowledge/ 只由编译脚本写；人工改 knowledge/ 必须在卡上游（books/cards）改后重编译。
- 首版只覆盖试点卡（砖型图族），全量时由 05 批次产物驱动。

> 原型定位：06 为 prototype 型任务，本文件为设计稿 + dry-run 逻辑；实现留给 Vibe 吸收阶段后统一接入（与 modules/indicator_codec 并行）。
