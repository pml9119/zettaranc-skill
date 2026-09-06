# Zettaranc Skill @ modules/ 代码梳理总结

> 范围：`zettaranc-skill/modules/` 顶层 40 个 .py + `core/`(9) + `indicators/`(6+8 子模块) + `strategies/`(7)；抽查 `backtest/`、`simulator/`、`screener/`、`self_optimizer/`、`verify/`、`data_sync/`。
> 版本基线：README/doc "当前 v4.1.0"。全仓仅 1 个测试文件带 2 处 `XXX`，无 `TODO/FIXME/HACK` 残留在业务代码（集中在 docs/TODO.md）。

---

## 1. 核心文件要点（目的 / 关键类函数 / 依赖）

### 顶层（40 个）

| 文件 | 目的 | 关键类/函数（签名） | 依赖 |
|---|---|---|---|
| `__init__.py` | 包入口：加载 .env、暴露工具函数 | `get_data_mode()`、`get_project_root()` | dotenv、database、tushare、setup_wizard、trade_parser/manager/reviewer |
| `constants.py` | 集中"配置语义"常量（阈值/权重/默认值），纯数学阈值留在使用点 | 仅常量；`BAC_*`、`REGIME_*` 等 | 无 |
| `database.py` (1036 行) | SQLite 建库、连接管理、watchlist/trade/klines/llm_stats 表 CRUD | `TradeRecord`、`StockInfo`、`get_db_connection()`、`init_tracking_tables()`、`save_trade_record()`（生成器 `get_connection`） | sqlite3、pathlib |
| `datasource.py` (1131 行) | 统一数据源抽象（核心枢纽），`DataSource` Protocol + 6 个实现 + 自动回退 Composite | `DataSource(Protocol)`；`TushareDataSource/IndevsDataSource/AStockDataDataSource/BridgeDataSource/HithinkFinanceDataSource/SqliteDataSource`；`CompositeDataSource(preferred="auto")`；`get_datasource()`、`dict_to_daily()` | tushare/indevs/a_stock/bridge/hithink client |
| `tushare_client.py` | Tushare 中转 API 客户端（带限流+重试） | `TushareClient`：`_rate_limit()`、`_call_api_with_retry()`、`get_index_daily/get_moneyflow/get_trade_cal/check_connection` | requests、pandas |
| `a_stock_data_client.py` (830 行) | 免费 A 股数据源（无 key），腾讯行情/百度K线/东财资金流 | `tencent_quote()`、`baidu_kline_to_dataframe()`、`AStockDataClient._rate_limit()/get_realtime_quote()` | requests、urllib、random |
| `hithink_client.py` | 同花顺官方金融 REST（X-api-key）客户端，接口语义对齐 Tushare | `HithinkFinanceClient`：`_rate_limit()`、`_chunks()`、`get_realtime_quote()/list_all_a_share()` | requests、datetime |
| `indevs_client.py` | Indevs Tushare Replay 免费代理客户端（含 DNS 回退 monkeypatch） | `IndevsClient`：`_rate_limit()`、`get_realtime_quote()/health_check()` | requests、socket、pandas |
| `bridge_client.py` | Bridge HTTP 网关（bridge 不通回退本地 SQLite） | `BridgeConfig`、`is_bridge_available()`、`query_bridge_sql()`、`_get_local_stock_list()` | urllib、json、sqlite |
| `loop_engine.py` (832 行) | 少妇战法六步闭环状态机核心 | `LoopState(Enum)`、`LoopConfig.from_registry()`、`LoopTrade`、`ShaofuLoopEngine.check_entry/check_stop_loss/check_lu_zhu/check_white_line_exit/run_stock` | indicators、market_regime、statistics |
| `loop_engine_enhanced.py` | 增强版：多策略投票共振（B1/B2/长安/娜娜/平行重炮） | `EnhancedLoopConfig/EnhancedLoopTrade/EnhancedShaofuLoopEngine`；`_detect_b1_enhanced()/_detect_changan()` | loop_engine、strategies、base_strategies |
| `backtest_six_step.py` | 六步回测封装（单股+组合），`ShaofuLoopEngine` 回测壳 | `ShaofuBacktestResult`、`_calc_metrics()`、`summary_text()/summary_with_validation()` | loop_engine、indicators、market_regime、statistics、core.metrics |
| `market_regime.py` | 大盘五因子市场状态分类（BULL/BEAR/SIDEWAYS） | `TrendRegime(Enum)`、`MarketRegimeClassifier.classify()/classify_date()/precompute_all()/_score_ma_alignment()` | indicators |
| `market_timing.py` (573 行) | 全市场择时：广度/资金量能/波动/情绪，DuckDB 优先 + SQLite 回退 | `MarketTimingIndicators`；`_load_index_klines_duckdb()/_breadth_score()/_moneyflow_score()/_classify_regime()` | duckdb、sqlite、datasource |
| `dynamic_config.py` | 按市场状态动态调整 `LoopConfig` 参数 | `MarketTimingWeights`、`DynamicConfigAdapter.get_config(regime)/set_regime_params()` | loop_engine、market_regime |
| `active_market_value.py` | 活跃市值(0AMV)加载+择时信号：日环比≥+4% 多头，≤-2.3% 空头 | `ActiveMarketValuePoint`、`format_active_market_value()`、`GateAction(Enum)`、`import_0amv_csv_to_duckdb()` | dataclass、duckdb、csv、lru_cache |
| `index_sync.py` / `industry_filter.py` | 指数日线写入 DuckDB；行业分散化约束 | `_parse_trade_date()`；`IndustryFilter.get_industry()/get_industry_distribution()` | hithink/datasource、duckdb |
| `position_manager.py` | 组合级基于风险的仓位（固定风险比例 + ATR 波动缩放 + 行业约束） | `PositionInfo`、`PositionManager(equity, risk_per_trade)`：`record_exit()/get_portfolio_summary()` | dataclass、math |
| `trade_parser.py` | 随堂测试解析器：口语/JSON/CSV 多格式 | `ParseResult`、`TradeParser.parse()/_parse_natural()/confirm_and_fill()` | csv、json、re |
| `trade_manager.py` | 交易记录 CRUD + 策略关联 + 盈亏统计 | `TradeManager.add_trade()/get_trade_history()/calculate_pnl()/check_trade_conditions()`；`match_strategy()` | database、indicators |
| `trade_reviewer.py` | 交割单数据准备（点评交给 LLM） | `ReviewContext.to_llm_prompt()`、`TradeReviewer.parse_input()/enrich_with_indicators()/save_trade()` | database、trade_parser |
| `watchlist.py` | 自选股观察池：批量监控/每日报告/破位预警 | `WatchAlert`、`add_watch()/scan_watchlist()/generate_daily_report()` | database、indicators |
| `monitor.py` | 自选股监控引擎：同步+算指标+扫描信号+推送 | `run_watchlist_monitor(sync_days, enable_push)` | tracking_syncer、notifier、watchlist |
| `notifier.py` | 预警推送：macOS 弹窗 + 飞书/钉钉 webhook | `notify_macos()`、`notify_feishu()`、`notify_all()` | subprocess、requests、core.errors |
| `portfolio_diagnosis.py` | 持仓诊断：状态扫描/防卖飞评分/出货信号/止损止盈位 | `DiagnosisReport`、`diagnose_stock()`、`format_report()` | indicators、database |
| `report.py` | 评估报告：业务下沉 modules，markdown 模板集中 | `StockAssessment`、`render_assessment()`、`write_assessment()` | indicators、database |
| `review_generator.py` | 自我改进：月度复盘报告（信号准确率/收益/策略表现） | `ReviewGenerator.generate_monthly_review()/_analyze_strategy_performance()` | database、tushare |
| `harness_updater.py` | 复盘结果 → 自动更新 Guardrails | `HarnessUpdater.analyze_strategy_performance()/generate_guardrails_update()/run_harness_update()` | database、review_generator |
| `improvement_logger.py` | 自我改进操作日志 | `ImprovementLogger.log_harness_update()/get_improvement_summary()` | json、pathlib |
| `tracking_manager.py` / `tracking_syncer.py` | 跟踪池管理；跟踪股 K线/指标/信号同步 | `TrackingManager.remove_stock()/get_tracking_stats()`；`TrackingSyncer.sync_daily()/sync_all_active()` | database、indicators |
| `intent_router.py` | 意图识别+路由：规则优先(零token) + LLM 兜底，集成知识库 | `RouterResult`、`IntentRouter.process()/_rule_match()/_build_system_prompt()` | re、yaml、knowledge_retriever |
| `knowledge_retriever.py` | 知识库 RAG 适配器（按意图注入分类过滤） | `KnowledgeCard`、`KnowledgeRetriever.retrieve()/format_knowledge_cards()` | httpx、dataclass |
| `llm_providers.py` | LLM 生成层（OpenAI 兼容 MiniMax），v3.10.4 接入错误码 | `LLMProvider.generate()`、`MiniMaxProvider`：超时→`ZettarancError(LLM_TIMEOUT)` | openai 兼容、core.errors |
| `intent_chat.py` | 意图识别+RAG+LLM 聊天界面（交互/单次） | `generate_reply()`、`chat_once()`、`chat_interactive()` | intent_router、knowledge_retriever、llm_providers |
| `commentary_service.py` | Z哥风格点评：SKILL.md + 知识库 → LLM，含 SQLite 缓存 | `generate_commentary()`、`_build_user_prompt()`、`_get_cache_key()` | sqlite、llm_providers |
| `setup_wizard.py` | 首次启动向导：JNB/Tushare 或普通模式 | `run_wizard()`、`write_env_file()`、`test_jnb_connection()` | dotenv、core.errors |
| `cli.py` (973 行) | 统一 CLI 入口（argparse 子命令） | `build_parser()`、`cmd_analyze/cmd_screen/cmd_score/cmd_workflow/cmd_diagnose/cmd_track/cmd_self_optimize`、`main()` | cli_commands、datasource、database |
| `cli_commands.py` (1161 行) | CLI 扩展命令：backtest/trade/daily/monitor/simulate/verify_v10 | `cmd_backtest()/cmd_daily()/cmd_simulate()/cmd_verify_v10()/_daily_step_*` | backtest、simulator、verify |

### core/（公共底座，v3.9+ 技术债清理产物）

| 文件 | 目的 | 关键函数 | 依赖 |
|---|---|---|---|
| `__init__.py` | 集中 re-export（含 `__all__`） | 聚合 walk_forward/market_context/metrics/net/paths/atr/errors | 各子模块 |
| `metrics.py` | 统一绩效指标（20 字段） | `PerformanceMetrics`、`calculate_metrics()`、`compute_sharpe()/compute_drawdown()/daily_returns()` | math、statistics |
| `market_context.py` | 统一市场环境判定 | `MarketRegime(Enum)`、`MarketContext`（dataclass）、`classify_market_regime()` | dataclass、enum |
| `walk_forward.py` | 统一 walk-forward 窗口切分 | `WalkForwardSplit`（dataclass）、`make_walk_forward_splits()` | dataclass |
| `atr.py` | 统一 ATR（v3.10.1 消除跨模块重复） | `calculate_atr(klines, window=14)`、`atr_pct()` | indicators.DailyData |
| `errors.py` | 统一错误码 + 异常基类（继承 ValueError，兼容旧 except） | `ErrorCode(StrEnum)`、`ZettarancError(code, message, *, cause)` | enum |
| `net.py` | 禁用 HTTP/HTTPS 代理（数据源连接） | `disable_proxy()` | os |
| `paths.py` | 统一路径常量（从 `DATA_DIR` 派生） | `DATA_DIR`、`REGISTRY_DIR`、`REPORTS_DIR` | pathlib |
| `_rust_compat.py` | Rust/Python 实现切换 shim | `get_impl_choice()`、`get_compute_module()`、`compute_func(name)` | os、types |

### indicators/（技术指标，拆分自原 indicators.py，__init__ 保持兼容，re-export ~154 个名字）

| 文件 | 目的 | 关键函数 | 依赖 |
|---|---|---|---|
| `core.py` (859 行) | 基础类型+核心数学 | `TradeSignal(Enum)`、`DailyData`（支持 `[]`/`get`）、`IndicatorResult`；`calculate_ma/ema/sma_td/kdj/bbi/rsi/macd/wr/vol_ratio`、`precompute_kdj_sequence()` | pandas、database、enum |
| `data_layer.py` (918 行) | 指标缓存(kline→IndicatorResult) + 分步计算状态机 | `analyze_stock()`、`get_kline_data()`、`get_realtime_data()`、`_step_kdj/_step_macd/_step_brick/_step_sell_score` 等 ~30 个 `_step_*`；`clear_indicator_memory_cache()` | core、database |
| `volume_patterns.py` | 量价模式 | `detect_volume_anomaly()/calculate_sell_score()/detect_trade_signal()/detect_chuhuo_wushi()/detect_volume_attack()` | core、price_patterns |
| `wave_theory.py` | 三波理论（建仓→拉升→冲刺） | `detect_three_waves()`、`classify_wave_for_b1()`、`_find_recent_low()` | core |
| `kirin_detector.py` (469 行) | 麒麟会四阶段状态机（吸→拉→派→落；铁蝴蝶/学院派） | `detect_kirin_stage()`、`_detect_n_shape_raise()`、`_calculate_pull_speed()` | core、price_patterns、volume_patterns |
| `price_patterns/*` | K线形态集合 | aggregate：`base`(ZG白线/DG黄线/双线交叉/DMI)、`brick`(砖块)、`bull_rope`(牛绳)、`complex_patterns`(双枪/SB1/SB1详解/娜娜/金碗/呼吸结构/B3/再后重建/月月鱼式)、`key_candles`(关键K/暴力K/ABC阶段)、`sandglass`(沙漏评分)、`screener_helper`(饭包/量模式/地di/族冲目标/B1/B2今日/双30规则/蜈蚣) | core |

### strategies/（信号生成层）

| 文件 | 目的 | 关键函数 | 依赖 |
|---|---|---|---|
| `core.py` | 信号基础：`StrategyType/Priority/Action(Enum)`、`StrategySignal`、K线归一化与 KDJ/BBI/MACD 取值 | `get_kline_data()`、`_ensure_daily_klines()`、`_get_kdj()/_get_bbi()/_get_macd_dif()` | database、datasource、indicators |
| `base_strategies.py` | 基础买点 B1/B2/B3/SB1 | `detect_b1()/detect_b2()/detect_b3()/detect_sb1`；`_safe_num()`；支持自优化参数 `get_active_param()` | indicators、core、self_optimizer.param_registry |
| `compound_strategies.py` | 组合战法：长安/四分之三音/娜娜/移动迪莲/平行重炮/坑漆/对称VA | `detect_changan()/detect_nana()/detect_pinghang()/detect_duichen_va()` | indicators、core |
| `sell_signals.py` | 卖出信号 S1/S2/S3 + 砖块信号/买竭/绿肥红瘦/阶梯出货/顶风车 | `detect_s1()/detect_s2()/detect_s3()/detect_brick_signals()` | core、indicators |
| `b1_b2_confirm.py` | B1观察+B2确认量化规则 | `B1B2Config`、`has_b1_in_window()`、`is_b2_signal()` | core |
| `vectorized.py` | 向量化信号（pandas/numpy，~60x） | `detect_b1_vec()/detect_b2_vec()/detect_s1_vec()/generate_signals_from_df()` | pandas、numpy、core |
| `__init__.py` | 编排：`detect_all_strategies()`、`analyze_with_strategies()`、`get_latest_signal()`、`_post_process_signals()` | 各子模块 |

---

## 2. 整体架构分层与数据流

```
[CLI 层]      cli.py / cli_commands.py / data_sync/cli.py / screener/cli.py / verify/cli.py
                    |  argparse 子命令
[编排/引擎层]  loop_engine(_enhanced) - backtest_six_step -|- simulator/simulator.py - backtest/{portfolio,single,b1_b2}
                    |                                      |  strategies/{core,base,compound,sell,vectorized,b1_b2_confirm}
                    |                                      +- screener/engine . verify/pipeline . self_optimizer/*
[策略/指标层]  strategies/*  ->  indicators/*（core,data_layer,volume_patterns,wave_theory,kirin_detector,price_patterns）
                    |
[LLM/RAG 层]   intent_router -> knowledge_retriever -> llm_providers(MiniMax) -> intent_chat/commentary_service
[数据源层]     datasource.py(DataSource Protocol + CompositeDataSource 自动回退)
                    +- TushareDataSource  - tushare_client
                    +- IndevsDataSource   - indevs_client
                    +- AStockDataDataSource - a_stock_data_client
                    +- BridgeDataSource   - bridge_client
                    +- HithinkFinanceDataSource - hithink_client
                    +- SqliteDataSource   - modules/database.py (SQLite) + DuckDB
[基础设施层]   core/{metrics,walk_forward,market_context,atr,errors,net,paths} . modules/database.py . data_sync/rate_limiter.py
```

**主数据流（自下而上）**：数据源(Composite 自动回退) → DataFetcher/data_sync 落库(SQLite + DuckDB) → indicators/analyze_stock 算指标(带 SQLite+内存缓存) → strategies/信号 → loop_engine/backtest/simulator 交易模拟 → core.metrics/statistics 统计 → report/commentary/harness_updater 产出报告与 Guardrails → notifier 推送。

**辅助子系统**：`self_optimizer/*`（参数寻优：baseline→hillclimb→report）、`verify/*`（策略验证 gates/pool/pipeline）、`statistics/*`（显著性检验/集成/敏感性）。

---

## 3. 设计模式/亮点与坑点

**亮点**
- **策略模式 + 抽象协议**：`datasource.py` 用 `DataSource Protocol` 统一 6 个数据源接口，`CompositeDataSource` 按 preferred="auto" 依序尝试，实现无缝降级——这是全系统最重要的解耦点。
- **分级降级**：Bridge 不通→本地 SQLite（`bridge_client`）；DuckDB 优先→SQLite 回退（`market_timing/index_sync`）；Rust PyO3 不可用→Python（`core/_rust_compat.py`、`backtest/_rust_bridge.py`，全部 silent fallback）；LLM 超时→`ZettarancError`。
- **限流 + 重试**：`data_sync/rate_limiter.py`（全局+进程内、multiprocessing 计数）；各 client 自带 `_rate_limit()`；`tushare_client._call_api_with_retry()`（指数退避）；`syncer._call_api_with_retry()`。
- **分层缓存**：`active_market_value.py` 用 `@lru_cache` + mtime 失效；`indicators/data_layer.py` 用 SQLite 指标缓存表 + 内存缓存（`_indicator_memory_cache`、`clear_indicator_memory_cache()`）；`commentary_service` 用 SQLite 缓存 LLM 输出；参数用 `param_registry.get_active_param()` 支持全局调参。
- **状态机范式**：`loop_engine` 六步闭环 `LoopState`；`kirin_detector` 吸拉派落四阶段；逻辑清晰、可回放。
- **性能优化**：`strategies/vectorized.py` 向量化 ~60x；`precompute_kdj_sequence()` 避免重复计算；`precompute_market_contexts()` ~6.3x；多线程(WAL)同步。
- **自优化闭环**：self_optimizer(基线→爬坡→LLM judge) + review_generator + harness_updater 把复盘结果回写 Guardrails，形成"用结果改策略参数"的飞轮。
- **向后兼容 re-export**：`indicators/__init__.py` re-export ~154 个名字、`strategies/__init__.py` 复用、`core/__init__.py` 用 `__all__`——拆分重构不破坏旧 import。

**坑点**
- **大量裸 except**：180 处宽泛 `except ...:` 分布在 53 个文件，部分吞异常（难排查），如 `loop_engine`、`intent_chat`(2)、`notifier`(3)；`# noqa` 38 处。
- **全局单例/环境副作用**：包 `__init__.py` 一次性加载 .env；`indevs_client` 安装全局 DNS monkeypatch（`_install_dns_fallback`），对其它请求有潜在污染。
- **数据源同名接口退化**：部分数据源对低频 API（如 stk_factor）仅返回空/降级实现，`CompositeDataSource` 需靠 health_check + 逐源 try 保证一致性。
- **魔法数字**：大量阈值散落在策略函数内（虽已拉出 `constants.py`，但纯数学阈值仍在使用点），不利参数调优；靠自优化 registry 弥补。
- **Rust 桥双实现漂移**：Python 与 Rust（`_rust_bridge.py`）回测逻辑需人工保持同步，存在"结果不一致"风险。
- **缓存一致性**：指标缓存键为 (ts_code, trade_date)，历史 K 线更新需显式 `clear_indicator_memory_cache()`，否则可能读到陈旧指标。
- **模块体积**：`datasource.py`(1131)、`cli_commands.py`(1161)、`data_layer.py`(918)、`backtest/portfolio.py`(869)、`indicators/core.py`(859) 已偏大，部分是"上帝文件"倾向；`data_sync` 与 `monitor` 职责重叠。
- **SKILL 领域指代密集**：策略命名（B1/B2/SB1、卤煮、白线黄线、麒麟会、娜娜）依赖外部 knowledge/*.md 语义，新读者需对照文档。

---

## 4. TODO/FIXME / 已知问题

- **业务代码零残留**：全仓 `*.py` 只有 `tests/test_a_stock_data_client.py` 有 2 处 `XXX`，无 `TODO/FIXME/HACK`；待办集中在 `docs/TODO.md`。
- **docs/TODO.md（v4.1.0）待实现**：
  - v3.11.0 监控告警闭环：止损/止盈触发告警、市场环境切换告警、告警冷却+级别去重、`notifier` 扩 SMTP 邮件。
  - v3.11.1 数据质量检查：交易日缺失检测、价格跳变/成交量异常检测、自动重拉修复。
  - M1 传播产物：3 个展示 GIF/截图 + 结果卡片入 `assets/`；`test-*` 覆盖补全。
- **建议补登记**：`datasource` 降级成功率监控、`self_optimizer` 迁移稳定性、Rust/Python 数值一致性 均未见专项 TODO。

---

## 5. 代码质量评价

**测试覆盖 — 强**：`tests/` 下约 100+ 个测试文件，覆盖数据库、数据源、指标、策略、引擎、回测、模拟器、self_optimizer、verify、CLI、错误码、rust_compat、限流器等；含 `conftest.py` + `pyproject.toml` 配置 pytest；有 `m4_*` 模块专项测试与 `realdata` 真实数据用例。历史基线"1179 passed / 15 skipped 无回归"——测试资产是该项目最强的质量支柱。

**文档质量 — 良好**：几乎每个模块都有中文 docstring（文件名/目的/数据源/规则注释），`core/`、`datasource`、`loop_engine`、`a_stock_data_client` 首段即说明设计意图；仓库含 `docs/`（CONFIG_GUIDE/USER_GUIDE/CONTRIBUTING/CHANGELOG/ROADMAP/STATISTICS_VALIDATION）与 70+ 篇知识库 md、`SKILL.md`。短板：`indicators/price_patterns/*`、`strategies/*`、`verify/*`、`simulator/*` 多为"无文件级 docstring"（仅函数注释），形态/战法语义需外链 knowledge 才能理解。

**类型标注 — 全面但非强制**：`datasource.py`(116 defs 几乎全带返回注解)、`indicators/core.py`(23/23 带返回)、`loop_engine`(19/19)、`metrics`(6/6)、`market_context/walk_forward` 均全带返回类型与参数 hint；大量使用 `from __future__ import annotations`、`| None`、`Protocol`、`dataclass`、`StrEnum`。个别文件（`constants.py`）为纯常量无类型；`simulator/simulator.py`、`strategies/compound_strategies.py` 等偏"少注解"。整体类型密度属中上水平，无 mypy 强制门禁，靠 pytest + lint 兜底。

**综合评价**：这是一个**工程化程度较高、面向"Z哥交易体系"的量价量化框架**。强于抽象数据源(Protocol+Composite 降级)、分层缓存/限流、自优化闭环与庞大测试库；主要风险点是过多宽泛 except 吞异常、数据源"同名但质量参差"的降级、Rust/Python 双实现漂移，以及个别"上帝文件"体积过大。若后续方向是稳定发布，建议优先补：数据源降级成功率监控、缓存失效一致性、Rust 一致性回归，以及将裸 except 收敛为 `ZettarancError`。
