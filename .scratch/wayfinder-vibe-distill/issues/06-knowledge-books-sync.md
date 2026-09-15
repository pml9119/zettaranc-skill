# books/ 与 knowledge/ 同步编译机制设计

Blocked by: 05（批次产物）+ books/zettaranc/ 首次落盘

Type: prototype
Status: open

## Question

设计 cangjie capability bundle → knowledge/（RAG 运行时快照）的确定性编译脚本：输入 .cangjie/capabilities/verified.yaml + cards/*.md，输出 knowledge/ 下的 md 文件（与现有 32 篇格式兼容，可被 knowledge_retriever.py 直接消费）；处理「与已有文档 diff 合并 vs 新增」；保证 books/ 审计链完整（candidates/rejected）；检测本地手改（勿静默覆盖）。产出：脚本原型 + 与原 knowledge 文件的一次干跑（dry-run）结果。

## Answer

已产出原型设计：artifacts/knowledge-books-sync-design.md（编译规则 dry-run + 分类补强/新增 + 防手改 hash + 边界）。**状态：open**——设计闭环，实现未开始；待 A3+ 批次产物 + `books/zettaranc/` 落盘后实现。
