# 复刻记录：个股详情页 + 5GB SQLite 数据仓库（2026-08）

> 将 zettaranc-perspective（Z_G 仓库）的**个股详情页**与**本地 5GB SQLite 数据仓库**复刻进 ZK（pml9119/zettaranc-skill）项目。
> 目标页面：`http://localhost:5173/stock/601318.SH`（现为 ZK :5200 端口 —— 其前端 dev-server 端口与 API 端口见下）。

---

## 1. 交付内容

### 1.1 数据层（5GB SQLite 仓库）

| 文件 | 来源 | 说明 |
|------|------|------|
| `data/stock_data.db`（3.4GB） | Z_G `data/stock_data.db` 原样复制 | 22 张表：daily_kline（363 万行）、indicator_cache（363 万行）、daily_valuation（**359.9 万行**，含 turnover）、stock_basic（5299 只）、daily_kline_hfq、workflow_*、method_pool_* 等 |
| `data/ths_qfq.db`（1.45GB） | Z_G `data/ths_qfq.db` 原样复制 | 同花顺后复权数据（hfq 回测用） |

**关键**：ZK 原有 `modules/database.py` 的 `get_db_connection()` / `get_kline_data()` 直接兼容读取该库（表结构超集，UNIQUE(ts_code, trade_date) 等约束一致；indicator_cache 有更多列但 SELECT * 兼容）。ZK 原有 393KB 空库被替换（原库仅 450 行 K 线）。

### 1.2 后端（FastAPI）

| 文件 | 改动 |
|------|------|
| `api/services/stock_service.py` | **升级**：新增 TTL 缓存（5 分钟，`_cache_get_or_compute`）；`get_full_analysis` 用共享信号缓存 + 新增 `industry` 字段；`get_kline_chart_data` 新增：**`turnovers` 换手率补源**（左连 daily_valuation）、**`indicator_series` 逐日指标序列**（RSI/WR/量比/DMI/卖出分/综合评分五维，支持前端悬停联动）、`industry` 字段 |
| `api/routes/stock.py` | 新增 **`GET /api/v1/stock/search/all`**（按代码/名称正则搜索，供详情页搜索框） |
| `api/models/stock.py` | `StockAnalysisResponse` 加 `industry`；`KlineChartResponse` 加 `industry/turnovers/indicator_series`（新增 `IndicatorSeries` 模型） |

### 1.3 前端（React）

| 文件 | 说明 |
|------|------|
| `pages/StockAnalysis.tsx` | 换成 Z_G 增强版（22KB）：自选按钮/快照格/MA/搜索框/悬停联动/信号时间线/诊断卡/评分卡/雷达/点评 |
| `components/charts/KlineChart.tsx` | 换成 Z_G 悬停联动版（46KB）：周期切换、KDJ/MACD/砖型/呼吸波面板开关、信号 markPoint、悬停 onHover 回调 |
| `components/stock/IndicatorPanel.tsx` | 升级：随主图悬停联动（`series + hoverIdx`） |
| `components/stock/ScoreCard.tsx` / `DiagnosisCard.tsx` / `charts/RadarChart.tsx` | 升级：支持 `hover` 悬停值 |
| `components/stock/StockSearchInput.tsx` | **新增**（搜索框组件） |
| `hooks/useWindowWidth.ts` | **新增**（响应式高度） |
| `lib/diagnosisHover.ts` | **新增**（悬停诊断推导，快照口径对齐） |
| `lib/EChartsReact.tsx` + `lib/echarts.ts` | **新增**（自研轻量 ECharts 封装，按需注册；替代 echarts-for-react 的互操作问题） |
| `api/stock.ts` | 加 `searchStocks()` |
| `api/types.ts` | KlineChart 加 `industry/turnovers/indicator_series`；ChartOverlays 加 `ma6/ma24_green/ma24_cyan`（可选）；新增 `StockSearchItem/StockSearchResponse`；StockAnalysis 加 `industry` |

### 1.4 未改动（保持 ZK 原版）

- `lib/constants.ts`（**已从 git HEAD 恢复**——移植时曾误用 Z_G 版覆盖，已还回含 `STRATEGIES`/ZK 版 `NAV_ITEMS` 的原版）
- 其余页面（Dashboard/Screener/Backtest/Simulator/Watchlist/Trades/Settings）不动
- `components/charts/EquityCurveChart.tsx` / `SimulatorEquityCurveChart.tsx`（仍用 echarts-for-react，与新版 KlineChart 的 EChartsReact 并存无冲突）

---

## 2. 验证结果

| 检查 | 结果 |
|------|------|
| Python 语法 | `ast.parse` OK |
| `api.main` import | OK |
| `get_full_analysis('601318.SH', 120)` | **2.14s**，返回 13 字段（含 industry/signals=20） |
| `get_kline_chart_data('601318.SH', 120)` | **1.63s**，120 日期 / 120 换手率 / indicator_series 6 组全有 |
| HTTP `/api/v1/stock/analyze/601318.SH?days=60` | OK（price=51.75, signals=18） |
| HTTP `/api/v1/stock/analyze/601318.SH/klines?days=60` | OK（60 日期/60 换手率/series 存在） |
| HTTP `/api/v1/stock/search/all?q=601318` | OK（1 结果） |
| `npx tsc -b --noEmit`（前端） | **0 错误** |
| `npx vite build`（前端） | **成功**（StockAnalysis chunk 67.5KB，532ms） |

---

## 3. 已知差异 / 限制

1. **industry 字段：拷贝的 stock_basic 中 5299 只仅 1 只有 industry 值**（EM 源未提供行业分类，历史已知限制）。详情页行业徽标会显示为空缺省（页面已优雅处理 `analysis.industry && ...`）。
2. **换手率 turnover_ 口径**：daily_valuation 中 turnover 为百分比数值（如 0.82），前端显示 `toFixed(2)%`；快照截止 2026-07-03 之后的日期 turnover 为 0（页面取最近非零值兜底）。
3. **data/stock_data.db 是完整拷贝（3.4GB），非增量**——ZK 仓库存量数据（watchlist/trade_records 等用户数据表）若需保留，注意该库已整体替换；用户表（watchlist/trade_records）为**空表**（从 Z_G 拷贝，原库也无用户数据）。
4. industry 徽标、换手率副图数据真实可用，但**行业徽标可能不显示**（见 #1）。

---

## 4. 端口说明（ZK 本地开发配置）

ZK `api/config.py`（未提交改动）与 `frontend/vite.config.ts`（未提交改动）本地已将端口调为 **api:8001 / frontend:5200**（原 8000/5173）。若用默认端口启动：
- 后端：`python -m api.main`（:8000）或 `zt-web`（:8000）
- 前端：`cd frontend && npm run dev`（:5173，代理 /api → :8000）

> 若前端代理目标/后端端口不匹配，改 `frontend/vite.config.ts` 的 proxy target 或 `api/config.py` 的 api_port 即可（均已在本地改为 8001/5200）。

---

## 4.5 追加修复：主图指标线全灭（2026-08 二轮）

**现象**：详情页主图图例中「白线/黄线/MA6/MA6+8%/MA24」全部显示 `--`，仅布林带/BBI 可见。

**根因**（两个）：
1. **ZK 单点函数签名不匹配**：`stock_service.py` 调用 `calculate_zg_white(all_klines, i)`（2 参），但 ZK `modules/indicators/price_patterns/base.py` 的 `calculate_zg_white(klines)` 只接受 1 参 → 抛 TypeError → 白线/黄线全部 None。
2. **窗口内计算无预热**：MA/布林/白线/黄线只在展示窗口内逐点计算，短周期档位（60/120 日）左侧预热不足；且逐点调用 O(n²) 慢。

**修复**：
- `modules/indicators/price_patterns/base.py`：新增 `calculate_zg_white_series()`（真·双 EMA O(n) 全序列递推）与 `calculate_dg_yellow_series()`（O(n) 前缀和），并在 `__init__.py` 导出。
- `api/services/stock_service.py`：叠加指标改为**全量历史预热 + `slice_window` 截取**（MA5/10/20/60、新增 MA6/MA24 分段绿/青、BBI、布林、白线/黄线全部 O(n) 一次性算全序列）。

**验证结果（601318.SH, 120 日）**：
| 指标 | len | nonzero | 末 3 值 |
|------|-----|---------|---------|
| white_line | 120 | 120 | 53.51/53.46/53.38 |
| yellow_line | 120 | 120 | 53.17/53.15/53.12 |
| ma6 | 120 | 120 | 53.23/53.02/52.73 |
| ma24_green | 120 | 87 | — |
| ma24_cyan | 120 | 22 | — |
| bbi / boll_mid | 120 | 120 | — |

耗时 2.33s（含 indicators 全链），`api.main` import + 前端 tsc 均通过。

---

## 5. 复刻过程中的修复记录

1. **误覆盖 `lib/constants.ts`**：移植时用 Z_G 版覆盖了 ZK 版（丢失 `STRATEGIES`/ZK 版 `NAV_ITEMS`），已从 `git show HEAD:frontend/src/lib/constants.ts` 恢复原版。**教训：移植前先备份，恢复优先用 git 而非人工重写。**
2. **ChartOverlays 类型缺 ma6/ma24**：Z_G 版 KlineChart 引用可选字段，已给 ZK types.ts 补上（可选，不破坏现有）。
3. **Screener.tsx 的 STRATEGIES 报错**：恢复 constants 后消除（Screener 页面未改动）。
4. **ZK 无 test_api_stock.py**：ZK 测试文件命名不同（test_api_* 系列），跳过——用真实 HTTP 端到端验证替代。

---

*执行人：DSH agent ｜ 未做任何 git commit/push（用户要求）。文件改动均在工作区内，可随时 `git diff` 审查或 `git checkout` 回退。*
