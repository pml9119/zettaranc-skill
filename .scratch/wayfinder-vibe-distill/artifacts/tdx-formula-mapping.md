# 通达信公式 → Python 探测器 映射研究（v2 · 重做版）

> **本版为 02 号 ticket 的完整重做**，取代 v1。
> **重做动机**：v1 含**一处会导致实现直接卡死的事实错误**（详见 §二），并遗漏 4 处公式缺陷、1 处性能缺陷、1 组过滤器不一致。
> **⚠️ v1 未存档（本次重做的操作失误）**：v1 被**就地覆盖**，未另存副本；`.scratch/` 未纳入 git，无历史可恢复。
> 补救：v1 的**全部可验证断言已在 §〇 逐条列出并给出核实结论**，其成立部分（9 公式语义翻译）已完整并入 §一 → 审计实质保留，但**逐字原文不可回溯**。
> **核实原则**（承 01 v3）：凡断言必对照源文件或源码；核实不了的写「未核实」。
> **来源**：`E:\Z哥逐字稿\战法\`（9 个公式，实测 20.0 KB）｜**目标仓库**：`zettaranc-skill/modules/`

---

## 〇、重做说明：v1 断言核实结果

对 v1 的**可验证断言**逐条回源核对（公式源文件 + 仓库源码）：

| # | v1 断言 | 核实结果 | 证据 |
|---|---|---|---|
| 1 | 9/9 公式翻译完成 | ✅ **成立** | 9 个文件全部实读，语义拆解与源码一致 |
| 2 | ⑤j选 标题写「砖型图后3日确认」但 XG 未接线 | ✅ **成立** | `j选.txt:55` XG = `J_SIGNAL AND NOT_KC AND NOT_ST AND CIRC_MV AND C_ABV_Y` |
| 3 | ⑧白线附近 J_SIGNAL/J_BEFORE3/砖买入2 未接入 | ✅ **成立** | `白线附近.txt:78` XG 用 `砖买入`，未用另三者 |
| 4 | ⑨超级b1 是唯一真正接入 J_BEFORE3 的 | ✅ **成立** | `超级b1.txt:65` XG 含 `J_BEFORE3` |
| 5 | ⑥k选 COND_1 声明未接入 XG | ✅ **成立** | `k选.txt:59` XG 无 `COND_1` |
| 6 | `calculate_sma_series` 与 TDX 递推一致 | ✅ **成立** | `indicators/core.py:325-354`，Y[0]=X[0]，`sma = v*M/N + sma*(1-M/N)` |
| 7 | `precompute_bbi_sequence` 仓库已有 | ✅ **成立** | `indicators/core.py:499` |
| 8 | `StrategyType.BRICK_EXIT/REDUCE/BOUNCE` 已存在 | ✅ **成立** | `strategies/core.py` Enum 尾部 |
| 9 | 砖型图值 = `calculate_brick_value` | ⚠️ **半对**（见下） | 单点值确实一致；**但序列版不存在** |
| 10 | 「复用 calculate_brick_value 的**全序列版**」 | ❌ **推翻** | 仓库**没有**任何砖型图序列函数（全库 grep 确认）→ §二 |
| 11 | 探测器签名 `detect_b1(klines, index, **overrides)` | ❌ **不准确** | 实际 `detect_b1(klines, index, kirin_context: dict\|None = None)`（`base_strategies.py:12`） |
| 12 | StrategySignal 字段清单 | ⚠️ **不全** | 实际还有 `target_price/risk_ratio/price/reason`（`strategies/core.py`） |
| 13 | 「公式与标题不一致」共 **4 处** | ❌ **少算** | 实测 **8 处**（v1 漏 4 处）→ §三 |

**结论**：v1 的公式语义拆解质量高、可复用；**但它的实现路径建立在一个不存在的函数上**，且漏了半数缺陷。本版保留 v1 的译文结论，重写实现路径与缺陷清单。

---

## 一、九公式译文（保留 v1 结论，已回源复核）

> 统一变量：C=close、O=open、H=high、L=low、V=vol。**brick** = 砖型图序列。
> 全部 9 个公式共用同一段砖型图计算（VAR1A…VAR6A），已逐一比对确认**逐字一致**。

| # | 文件 | 类型 | 最终信号（XG/抽取条件） | 参数 |
|---|---|---|---|---|
| ① | 砖型图.txt | 副图 | `XG = CC>0` = 首次翻红（crossover）；黄柱 = 昨绿∧今红∧高度达标 | — |
| ② | 5日知行b1选.txt | 主图 | `GOLDEN_COND` = `EXIST(J<15 ∧ chg∈[-2,1.8], 22)` ∧ 今日同条件 | J_LOW=15 |
| ③ | 真实换手率.txt | 副图 | `CYYZ` = 活跃∧累计换手≥50；`GOLD_COND` = 历史J ∧ 今J<15 ∧ 量能地量 | TH=50 |
| ④ | b2特扑.txt | 选股 | `COND_1 ∧ J<55 ∧ EXIST(J<15,22) ∧ 四重过滤` | UPPCT=4, WICKMAX=0.15, N=30, VOLMULT=1.1, **J_TODAY=55** |
| ⑤ | j选.txt | 选股 | `J_SIGNAL ∧ 四重过滤 ∧ C>黄线` | J=15 |
| ⑥ | k选.txt | 选股 | `COND_2 ∧ COND_3 ∧ COND_4 ∧ COND_5 ∧ 二重过滤` | WICKMAX=0.03, VOLMULT=1.5, ZXMULT=1.15 |
| ⑦ | 板砖.txt | 选股 | `昨绿 ∧ 今红 ∧ 高度达标 ∧ C>黄线 ∧ 三重过滤` | 高度 2/3 |
| ⑧ | 白线附近.txt | 选股 | `砖买入 ∧ EVERY(C>黄线,5) ∧ EVERY(C>白线×0.97,15) ∧ 三重过滤` | 0.97, 5, 15 |
| ⑨ | 超级b1.txt | 选股 | `砖买入 ∧ J_BEFORE3 ∧ C>黄线 ∧ 三重过滤` | J=15 |

**⑨ 为何叫「超级b1」**：它是把「J 信号（B1 的本质）」与「砖型图买入（板砖）」**叠加确认**的唯一公式 —— J 低点后 3 日内出现砖买入，即「B1 + 砖型确认」。这与 Z 哥 20260415 总图里说的「砖形图可**嫁接**在 B1/B2/B3/单针下三十里」完全对应（M1 模块原话，第4部分 00:35:56）。**这条映射关系是本版新增的骨架呼应**。

---

## 二、★ 核心修正：砖型图**序列**原语（v1 的致命错误）

### 2.1 问题

**全部 9 个公式里有 5 个（①⑤⑦⑧⑨）依赖 `REF(砖型图,1)` / `REF(砖型图,2)`，即必须拿到砖型图的完整序列。**

而仓库现状（实测）：

```
modules/indicators/price_patterns/brick.py:5
    def calculate_brick_value(klines: list[DailyData]) -> float:   # ← 只返回单点 float
```

**全仓库不存在任何砖型图序列函数。** v1 的伪代码通篇写 `brick_vec(df)   # 复用 calculate_brick_value 的全序列版` —— 该函数**不存在**，实现者按 v1 动手会直接卡死。

### 2.2 仓库现有的绕过方式（及其真实代价）

仓库现有两处需要砖序列的地方，都用**前缀重算**绕过：

| 位置 | 做法 |
|---|---|
| `brick.py:75 calculate_brick_history` | `for i in range(8, len(klines)+1): calculate_brick_value(klines[:i])` |
| `brick.py:163 detect_four_brick_system` | 同上，`range(8, len(klines)+1)` |

**两个隐藏缺陷**（实测推导，v1 未发现）：

**缺陷 A — 序列头部被污染**：`calculate_brick_value` 开头有 `if len(klines) < 12: return 0`。前缀循环从 `i=8` 起，故 `i=8,9,10,11` **一律返回 0.0**，`i=12` 起才是真值。于是序列前 4 个元素是伪造的 0，红绿判定（比较相邻元素）在前段产生**虚假红砖**。当前从尾部往前数连续砖数，短序列时会被这道污染影响。

**缺陷 B — O(n³) 性能（已核实调用链，确在热路径）**：

实际调用链（行号实测）：

```
strategies/__init__.py:83   detect_all_strategies(ts_code, days=120, ...)
  └─ :133  for i in range(20, len(klines)):                 # O(n) 次
       └─ :209  detect_brick_signals(daily_klines, i)
            ├─ sell_signals.py:275  detect_four_brick_system(klines[:i+1])   # 每次都跑 → O(i²)
            └─ sell_signals.py:283  detect_four_brick_system(klines[:i])     # 仅状态变化日（提前返回可跳过）
                 └─ brick.py:190  for j in range(8, i+1): calculate_brick_value(klines[:j])   # 每次 O(j)
```

量级估算（`calculate_brick_value` 单次约 `5j` 次 Python 级递推）：
- `days=120`（默认）：Σ ≈ `5 × 120³/6` ≈ **144 万次** → 约 0.5–1.5 秒
- `days=365`（**CLI 文档化用法** `zt analyze --days 365`）：Σ ≈ `5 × 365³/6` ≈ **4,000 万次** → 约 **10–40 秒**

> 即：这不是理论隐患 —— **`zt analyze --days 365 --json` 这条常规命令就会踩到**。新增 `calculate_brick_series` 后，该链条降为 O(n)，且原语可跨调用缓存。

### 2.3 修正方案：新增单一序列原语（本版核心交付）

```python
# modules/indicators/price_patterns/brick.py（新增）

def calculate_brick_series(klines: list[DailyData]) -> list[float | None]:
    """
    通达信砖型图【全序列】，单遍 O(n)，与 TDX SMA 递推逐点一致。

    对齐：
      VAR3A/VAR1A 自 index=3 起有效（HHV/LLV 需 4 根 K 线）
      → 返回序列的前 3 个元素为 None（显式声明，不伪造 0）

    与 calculate_brick_value 的关系（★ 回归测试锚点）：
      len(klines) >= 12 时：calculate_brick_series(klines)[-1] == calculate_brick_value(klines)
      len(klines) <  12 时：⚠️ 锚点【不成立】—— calculate_brick_value 有
        `if len(klines) < 12: return 0` 的提前返回，而本函数在 n>=4 即产出真值。
        故锚点测试必须用 >=12 根 K 线（见下方「边界陷阱」）。

    与现有前缀重算的关系：
      brick[i] 与前缀重算值数学等价（TDX SMA 由序列首点确定性递推，前缀共享起点）
      —— 但【仅限 i >= 11】（即前缀长度 >= 12）。
      前缀长度 8..11 时 calculate_brick_value 返回 0，故现有实现序列的
      前 4 个元素是伪造的 0，本函数产出真值 → **替换是行为修正，不是纯重构**。
    """
```

**⚠️ 边界陷阱（v1 与本版初稿都会踩）**

| 区间 | `calculate_brick_value` | `calculate_brick_series` | 是否等价 |
|---|---|---|---|
| `n < 4` | 0（提前返回） | 全 `None` | ❌ 语义不同（但有意义：序列无定义 vs 数值 0） |
| `4 ≤ n < 12` | **0**（提前返回） | **真值** | ❌ **锚点失败** |
| `n ≥ 12` | 真值 | 真值 | ✅ **锚点成立** |

**由此修正两点实现要求**：

1. **回归锚点测试必须用 ≥12 根 K 线**（`generate_uptrend_klines(120)` 之类），否则会误判实现错误。
2. **替换 `calculate_brick_history` / `detect_four_brick_system` 不是「行为保持型重构」，而是「行为修正」** —— 现有实现因前缀循环从 `i=8` 起，序列前 4 个元素恒为伪造的 `0`（§2.2 缺陷 A）。替换后这些位置的数值会改变，**必须重新验证这两个函数的输出，并重跑其调用方测试**，不能假装是等价重构。
   若要求严格行为保持，可让 `calculate_brick_series` 在 `n < 12` 时返回 `None`、并由调用方把 `None` 当 `0` —— 但这等于把 bug 固化，**不推荐**；建议直接修，并在 CHANGELOG 标注行为变更。

**实现要点**（供实现者直接落地）：

```python
n = len(klines)
if n < 4:
    return [None] * n
highs, lows, closes = [k.high for k in klines], [k.low for k in klines], [k.close for k in klines]

var3a, var1a = [], []
for i in range(3, n):
    hhv4 = max(highs[i-3:i+1]); llv4 = min(lows[i-3:i+1])
    rng = hhv4 - llv4
    if rng == 0:                       # ★ 见 §三-9：TDX 为 0/0，此处需与 TDX 对齐
        var3a.append(0.0); var1a.append(-90.0)
    else:
        var3a.append((closes[i] - llv4) / rng * 100)
        var1a.append((hhv4 - closes[i]) / rng * 100 - 90.0)

var4a = calculate_sma_series(var3a, 6, 1)
var5a = [v + 100 for v in calculate_sma_series(var4a, 6, 1)]
var2a = [v + 100 for v in calculate_sma_series(var1a, 4, 1)]

series: list[float | None] = [None, None, None]
for a, b in zip(var5a, var2a):
    v6 = a - b
    series.append(round(v6 - 4, 2) if v6 > 4 else 0)
return series
```

**配套改造（消除重复与 O(n³)）**：

| 现有 | 改为 |
|---|---|
| `calculate_brick_history` 前缀循环 | 内部改用 `calculate_brick_series`，取尾部 |
| `detect_four_brick_system` 前缀循环 | 同上 |
| `detect_brick_signals` 每次重算两遍 | 接收预计算序列（或由调用方传入），消除 O(n³) |
| `detect_all_strategies` 日循环 | 走 `__init__.py` 既有预计算模式（同 `kdj_sequence`/`bbi_sequence`），新增 `brick_sequence` |

> **注意**：改造**不是行为保持型重构，而是行为修正**（见上方「边界陷阱」）—— 现有实现序列前 4 位是伪造的 `0`。必须：① 用 ≥12 根 K 线的回归锚点验证序列数学正确性；② **重新验证** `calculate_brick_history` / `detect_four_brick_system` 的输出（预期会变）；③ 重跑其调用方（`sell_signals.detect_brick_signals` 等）测试；④ 在 `docs/CHANGELOG.md` 标注行为变更。

### 2.4 为什么这不是「仓库已有，无需重复实现」

v1 §五 结论写：「仓库已有 `calculate_brick_value`/`calculate_zg_white`/`calculate_dg_yellow`/`precompute_kdj_sequence`/`calculate_bbi`，**无需重复实现**」。

实测：

| 原语 | 单点版 | **序列版** | 结论 |
|---|---|---|---|
| 白线 `EMA(EMA(C,10),10)` | `calculate_zg_white` | ✅ `calculate_zg_white_series`（`base.py:18`） | 齐备 |
| 黄线 `(MA14+28+57+114)/4` | `calculate_dg_yellow` | ✅ `calculate_dg_yellow_series`（`base.py:66`） | 齐备 |
| KDJ | `calculate_kdj` | ✅ `precompute_kdj_sequence`（`core.py:456`） | 齐备 |
| BBI | `calculate_bbi` | ✅ `precompute_bbi_sequence`（`core.py:499`） | 齐备 |
| **砖型图** | `calculate_brick_value` | ❌ **无** | **必须新增** |

**砖型图是唯一「只有单点版」的原语，而它恰是 5/9 公式的核心。** v1 把它和其余四项并列成「已齐备」，是本版最重要的修正。

---

## 三、新发现的公式缺陷（v1 记 4 处 → 实为 **8 处**）

> 类别：**标题/注释与实际代码不符**，或**声明未使用**。这类缺陷直接影响「按公式行实现，还是按标题意图实现」的判断。

| # | 文件 | 缺陷 | 证据 | 处理建议 |
|---|---|---|---|---|
| 1 | ⑤ j选 | 标题「+ 砖型图后3日确认」，但 XG 未引用 `砖买入`，且**该文件根本未声明** `J_BEFORE3` | `j选.txt:1` vs `:55` | 按 **XG 行**实现（纯 J_SIGNAL+黄线+过滤）；标题意图应由 ⑨ 承接 |
| 2 | ⑥ k选 | `COND_1` 声明未接入 XG → 连带 `UPPCT/WICKMAX/N/VOLMULT/ZXMULT` **5 个参数全部失效** | `k选.txt:17` vs `:59` | 按 XG 行实现；参数不暴露为可调项（否则是假开关） |
| 3 | ⑨ 超级b1 | **整段单日强势形态缺失**，但 `UPPCT/WICKMAX/N/VOLMULT/ZXMULT` 5 个参数仍声明 → 全部死参数 | `超级b1.txt:4-9` vs `:65` | 同上 |
| 4 | ⑤⑨ | 注释写「红柱大于前一日绿柱的**三分之四**」，代码实为 **2/3** | `j选.txt:29`、`超级b1.txt:34` vs `:41`/`:46` | 以 **2/3** 为准（⑦板砖同值，且 ⑦ 无注释冲突） |
| 5 | ⑧ 白线附近 | `砖买入2`（与 `砖买入` 双口径）、`J_SIGNAL`、`J_BEFORE3` 三者声明未接入 | `白线附近.txt:54,59` vs `:78` | 按 XG 行实现（用 `砖买入`） |
| 6 | ④ b2特扑 | `MV_THRESHOLD := 30` 声明，但 `COND_MV` 内**硬编码 30** | `b2特扑.txt:10` vs `:54` | 改为读参数，否则阈值不可调 |
| 7 | ③ 真实换手率 | 注释写「涨跌幅在 **[−1.27%, 1.8%]**」，代码实为 **−2** | `真实换手率.txt:67` vs `:69` | 以 **−2** 为准（②④⑤同值，四处一致，注释是错的） |
| 8 | ③ 真实换手率 | `GOLD_COND` 把 `J<J_LOW` 重复写 3 次（冗余但语义等价） | `真实换手率.txt:81-83` | 实现时化简为单条件，**行为不变** |

**新增的 4 处（v1 未记）：#3、#4、#6、#7。**

> ⚠️ **落地原则**：**一律以 `XG` 实际表达式为准**，标题与注释只作意图参考。`j选`/`k选`/`超级b1` 的「强势启动」参数不得暴露为可调参数 —— 暴露即等于提供了无效开关。

---

## 四、★ 新增：过滤器在 9 个公式间**并不一致**

v1 把过滤条件合并表述为「非科创 ∧ 非ST ∧ 市值>30亿」。**实测各公式口径不同**，直接照抄会出错：

| 公式 | 科创板 | ST 变体 | 流通市值 | 北交所 |
|---|---|---|---|---|
| ⑤ j选 | `NOT(INBLOCK('科创板'))` | ST, *ST | >30亿 ∧ 股本>1e7 | — |
| ⑨ 超级b1 | 同 ⑤ | ST, *ST | 同 ⑤ | — |
| ⑧ 白线附近 | 同 ⑤ | ST, *ST | 同 ⑤ | — |
| ⑦ 板砖 | 同 ⑤ | ST, *ST | 同 ⑤ | — |
| ⑥ k选 | 同 ⑤ | ST, *ST | **无** | — |
| ④ b2特扑 | **`NOT(CODELIKE('688')) AND NOT(INBLOCK('科创板'))`** | **ST, *ST, S*ST, SST** | 同 ⑤ | **`NOT(83/87/43)`** |

**三点差异必须显式建模**：

1. **科创板判定**：只有 ④ 同时用代码前缀 + 板块名双保险，其余仅板块名。
2. **ST 变体**：只有 ④ 覆盖 `S*ST`/`SST`；其余仅 `ST`/`*ST`。
3. **北交所**：只有 ④ 排除；⑥ 连市值条件都没有。

**建议实现为可组合过滤**，而非一个 `board_filter()` 黑盒：

```python
def pass_filter(
    ts_code: str, name: str, float_share: float, close: float,
    *, exclude_kc: bool = True, kc_strict: bool = False,   # ④ 用 True（双保险）
    st_variants: int = 2,                                  # ④ 用 4
    min_float_mv: float | None = 30e8,                     # ⑥ 传 None
    exclude_bjs: bool = False,                             # ④ 用 True
) -> tuple[bool, str]:
```

---

## 五、TDX→pandas 原语对照（保留 v1，补 2 处）

v1 §1.1 的函数级对照表**复核无误**，原样沿用（REF/HHV/LLV/MA/EMA/SMA/CROSS/IF/EXIST/EVERY/SUM/BARSLAST/HHVBARS/MAX/MIN/NOT/AND/OR/INTPART/ROUND/STICKLINE/DRAW*/DRAWNULL/行情字段）。

补充两处 v1 未强调的陷阱：

| 陷阱 | 说明 |
|---|---|
| **INTPART 取整方向** | TDX `INTPART` = 向零取整 = `np.trunc`。**负 J 值**时与 `np.floor` 结果不同（J 可为负）。③ 的 `ACC_INT`、②③ 的 `J_VALUE` 均用到。**绝不用 `int()`**（对 float 虽也向零，但对 NaN 抛异常）。 |
| **`EXIST` 含当根** | TDX `EXIST(X,N)` 窗口含当前 K 线。故 ② 的 `GOLDEN_COND` 中 `EXIST(...)  ∧ 今日同条件` 里，「今日」被 `EXIST` 覆盖了一层 —— 语义为「**近 22 日内至少一次**（含今日）」而非「历史 22 日 + 今日」。v1 写作 `hist_cond = j_sig.rolling(22).max() > 0` **是正确的**（pandas rolling 含当根），但文字描述写「过去 22 个交易日内存在」易被误读为不含当根。 |

**BARSLAST 配方**（v1 提供）复核可用，但 ③ 的 `SUM(HSL, BARSLAST(NOT(YZX))+1)` 是**逐日变窗累加**，pandas 无直接等价，需 `np.add.reduceat` 或显式循环；v1 标注为「需逐日验证」**成立**，保留在 §七。

---

## 六、探测器规范（修正 v1 §三）

### 6.1 签名 —— 按仓库**实际**约定（修正 v1）

```python
# ✅ 仓库实际约定（base_strategies.py:12）
def detect_b1(klines: list[DailyData], index: int, kirin_context: dict | None = None) -> StrategySignal | None:

# ✅ 新探测器建议签名（与 detect_b1 风格一致，不引入 v1 杜撰的 **overrides）
def detect_brick_buy(
    klines: list[DailyData],
    index: int,
    kirin_context: dict | None = None,
    *,
    yellow_ok: bool = True,
    height_ratio: float = 2 / 3,
) -> StrategySignal | None:
```

> v1 写「签名统一 `(klines, index, **overrides)`」并称「沿用现有元素型探测器约定」——**与源码不符**。`detect_b1` 第三参是 `kirin_context`。新探测器应**跟随实际约定**。
> 参数覆盖机制：仓库用 `modules/self_optimizer/param_registry`（见 `base_strategies.py` 的 `get_active_param` 用法），**不是** `**overrides`。

### 6.2 输出 —— StrategySignal 完整字段（补全 v1）

```python
ts_code: str; trade_date: str; strategy: StrategyType; confidence: float
description: str; details: dict[str, Any] = field(default_factory=dict)
action: str = "WATCH"                  # BUY/SELL/HOLD/WATCH
target_price: float | None = None      # ← v1 漏
stop_loss: float | None = None
risk_ratio: float | None = None        # ← v1 漏
price: float | None = None             # ← v1 漏
reason: str | None = None              # ← v1 漏
priority: Priority = Priority.OBSERVE
```

### 6.3 StrategyType 扩展

现有砖相关成员：`BRICK_EXIT`（四块砖翻绿）/`BRICK_REDUCE`（四块砖减仓）/`BRICK_BOUNCE`（四块砖反弹）—— **全部是卖出侧**。

**买入侧完全空缺**，需新增（勿与现有语义混淆）：

```python
BRICK_BUY = "板砖买入"        # ⑦ 昨绿+今红+高度达标+黄线
BRICK_TURN_RED = "砖型图翻红"  # ① 弱信号 CC>0
SUPER_B1 = "超级B1"            # ⑨ 砖买入 ∧ J_BEFORE3
WHITE_LINE_NEAR = "白线附近"    # ⑧
STRONG_START = "综合强势启动"   # ④⑥ 系
J_LOW_SIGNAL = "J低信号"       # ②⑤ B1 本质
```

#### 6.3.1 ★ 重要补充：黄柱逻辑**已有等价实现**，只是没接进策略层（03 核实）

03 号试点复核源码时发现：**`modules/indicators/price_patterns/screener_helper.py:6 detect_fanbao(klines) -> bool` 就是公式黄色柱的等价实现**。

```python
# screener_helper.py:6-34（实测全读）
is_red              = brick_today > brick_yesterday        # 今天红柱
is_green_yesterday  = brick_yesterday < brick_before        # 昨天绿柱
lzgd = max(昨,前) - min(昨,前)                              # 昨日绿柱实体高度
fbwz = min(昨,前) + lzgd * 2 / 3                            # 反包阈值 = 2/3 位置
is_fanbao = brick_today > fbwz if lzgd > 0 else False
return is_red and is_green_yesterday and is_fanbao
```

**与公式 ⑦板砖/①黄柱的关系**：`砖买入 = 红柱高 > (2/3)*REF(绿柱高,1) ∧ 昨日绿柱`。两者判据在数学上等价（前者用「绝对 2/3 位置」表述，后者用「高度比」表述），**差异仅在于**：`detect_fanbao` **不含黄线达标**（`CLOSE > 多空线`）与**不含板块过滤**。

**接线状态（实测 grep 全仓）**：

| 位置 | 状态 |
|---|---|
| `indicators/data_layer.py:458` | ✅ **已接入**：`result.is_fanbao = detect_fanbao(klines)`（作为指标字段） |
| `indicators/__init__.py` / `price_patterns/__init__.py` | ✅ 已导出 |
| `data_sync/indicator_cache.py:119` | ✅ 已在缓存层调用 |
| **`modules/strategies/`** | ❌ **零调用** —— 未进 `detect_all_strategies` |
| **`StrategyType`** | ❌ **无 `FANBAO`/`反包` 成员**（实测 grep 为空） |

**结论（对 §6.3 的精确化）**：
- 「买入侧 StrategyType 空缺」**成立** —— 确实没有任何买入侧砖型图策略类型。
- 但**「黄柱判定原语」并非空缺**：`detect_fanbao` 已实现且已作为**指标字段**跑在分析管线上。
- 因此 F2 的工作量**低于**本报告初稿估计：**`detect_brick_buy` 应在 `detect_fanbao` 之上补齐「黄线达标 + 可组合过滤 + StrategyType 暴露 + 进 detect_all_strategies」**，而**不是重写 2/3 判据**。
- 03 建议的验证断言（**待 `calculate_brick_series` 落地后补**）：
  ```
  detect_fanbao(klines) == (今天红柱 ∧ 昨天绿柱 ∧ brick_today > min(昨,前) + |昨-前| * 2/3)
  ```
  注意：`detect_fanbao` 内部走的是 `calculate_brick_value` 前缀重算（**继承了 §2.2 的 O(n²) 与序列头部污染**）→ 改造时应一并切换到序列原语。

### 6.4 落位与接线

| 探测器 | 文件 | 接入 |
|---|---|---|
| `detect_brick_buy` | `modules/strategies/brick_buy.py`（新） | `detect_all_strategies` 日循环 |
| `detect_brick_turn_red` | 同上 | 同上 |
| `detect_super_b1` | `modules/strategies/super_b1.py`（新） | 同上 |
| `detect_white_line_near` | `modules/strategies/white_line.py`（新） | 同上 |
| `detect_strong_start` | `modules/strategies/strong_start.py`（新） | 同上（④⑥ 共用一个核心，参数区分） |
| `detect_j_low_signal` | 并入 `base_strategies.py`（B1 家族） | 同上 |
| **`calculate_brick_series`** | `indicators/price_patterns/brick.py`（新增） | 预计算挂 `DailyData`，供全部上述探测器复用 |

**预计算接线**（照 `__init__.py` 既有模式）：新增 `brick_sequence` / `white_yellow_sequence`，与现有 `kdj_sequence`/`bbi_sequence` 并列。

### 6.5 pytest 对齐

- **数学正确性锚点（最关键）**：`assert calculate_brick_series(klines)[-1] == calculate_brick_value(klines)` —— **必须用 ≥12 根 K 线**（`n<12` 时 `calculate_brick_value` 提前返回 0，锚点不成立）
- **行为变更验证（非等价重构）**：改造 `calculate_brick_history`/`detect_four_brick_system` 后，序列前 4 位数值**预期改变**（原为伪造 0）→ 重跑调用方测试并在 CHANGELOG 标注
- **信号构造**：用 `tests/conftest.py` 的 `make_kline_row`/`make_daily_data`/`generate_uptrend_klines` 构造「昨绿→今红→高度达标→收盘>黄线」，断言非 None；反例（今绿/高度不达标/收盘<黄线）断言 None
- **数据不足**：板砖需 ≥12 根（砖序列 3+6+... 预热），白线需 ≥115 根（`detect_brick_trend` 现用 115）
- **过滤器**：逐一覆盖 §四 的 6 种口径组合，防止「一个 filter 打天下」
- **④⑥ 负例**：显式断言「参数改了但信号不变」——即 **死参数回归测试**（防后人误以为可调）

---

## 七、无法直接翻译清单（修正为 **11 项**）

v1 列 10 项，复核后 **9 项成立、1 项拆分、新增 2 项**：

| # | 问题 | 状态 |
|---|---|---|
| 1 | ST 区分需股票名称（非 K 线） | ✅ 成立 |
| 2 | 科创板/北交所需板块或代码前缀元数据 | ✅ 成立 |
| 3 | 流通市值/股本（`FINANCE(46)`）需基本面数据 | ✅ 成立 |
| 4 | 停牌/一字板无法成交 | ✅ 成立 |
| 5 | 「高度达标」偏视觉，需人工看图 | ✅ 成立 |
| 6 | 公式与标题/注释不一致 | ✅ 成立，**由 4 处修正为 8 处**（§三） |
| 7 | `BARSLAST` 变窗累加边界（③ ACC） | ✅ 成立 |
| 8 | `INTPART` 取整方向 | ✅ 成立 |
| 9 | **VOL 单位（手/股）** | ✅ 成立 —— **且是本项目最危险的一项**：`HSL = VOL/(FINANCE(46)/100)*100`，若数据源 VOL 为**股**而非**手**，换手率差 **100 倍**，③ 的全部信号失真。**实现前必须先实测数据源 VOL 单位** |
| 10 | 展示性绘图（DRAWNUMBER/STICKLINE/COLOR*/板块文字） | ✅ 成立 |
| 11 | **🆕 砖型图序列原语缺失** | 见 §二 —— 属**工程缺口**而非语义缺口，但同样阻塞实现 |
| 12 | **🆕 序列头部对齐口径** | `calculate_brick_value` 的 `len<12` 门槛 vs TDX「不足 N 用可用根数」。需**明确声明**序列前 3 根为 None，并决定是否与 TDX 逐点对齐 |
| 13 | **🆕 0/0 除零分支** | 仓库 `brick.py:29-31` 在 `hhv4 == llv4` 时取 `v3 = 50.0`；TDX 为 `0/0`（通常得 0）→ **数值偏差**。仅在 4 日内高低点完全重合（一字板连板）时触发 |

---

## 八、交付摘要与结论

### 8.1 结论

1. **9/9 公式语义翻译成立**，v1 这部分可继承。
2. **v1 的实现路径是断的**：`砖型图` 序列函数不存在，而 5/9 公式依赖它 → **新增 `calculate_brick_series` 是本 ticket 的第一优先交付**。
   **但工作量小于初估**（03 核实，§6.3.1）：黄柱判据**已有等价实现** `detect_fanbao`（已作为指标字段接入 `data_layer.py:458`），缺的只是「黄线达标 + 过滤 + StrategyType + 进 `detect_all_strategies`」这层接线。
3. **公式缺陷实为 8 处**（v1 记 4 处）→ 落地**一律以 `XG` 行为准**，标题/注释只作意图参考。
4. **过滤器在 6 个选股公式间有 3 类差异** → 必须可组合，不能一个黑盒。
5. **仓库现有砖型图实现有 2 个隐藏缺陷**（序列头部污染、O(n³) 性能）→ 随序列原语一并修掉。
6. **③ 的 VOL 单位是最高风险项** —— 差 100 倍，实现前必须实测。

### 8.2 与 01 v3 骨架的挂接（新增）

| 公式 | 对应模块 | 说明 |
|---|---|---|
| ⑦板砖 / ①砖型图 | **M1 买点** | Z 哥 20260415 的「砖形图（专精图）」五大买点之一 |
| ⑨超级b1 | **M1** | 印证「砖形图可嫁接在 B1 上」的原话 |
| ②5日知行b1选 / ⑤j选 | **M1** | B1 的量化定义（J<15 ∧ chg∈[−2,1.8]） |
| ④b2特扑 | **M1** | B2 系列（对应 20251006/20260107 两场 B2 专题课） |
| ⑥k选 / ⑧白线附近 | **M1 / M3** | 强势启动系 + 白线纪律 |
| ③真实换手率 | **M4 武器库** | 量能维度（对应「四分之一量线」缺口的同族） |

> 即：**9 个公式全部落在 M1/M3/M4**，与 01 v3 报告的「专精图体系缺失」「关键K 薄弱」两个最大缺口**正好互补** —— 这批公式是把 M1/M4 从「文字描述」升级为「可执行定义」的关键资产。

### 8.3 下一步建议

1. 先落 `calculate_brick_series` + 回归测试（锁住与 `calculate_brick_value` 的一致性）
2. 实测数据源 VOL 单位（阻塞 ③）
3. 按 §6.4 落 6 个探测器 + 死参数回归测试
4. 与 03（砖型图试点蒸馏）合流：**公式给数值定义，语料给用法语境**（何时用、用在哪、配什么仓位）

---

## 九、完整性校验

- 9/9 公式**逐字实读**（不是摘录）：砖型图 28 行、5日知行b1选 82 行、真实换手率 88 行、b2特扑 62 行、j选 55 行、k选 59 行、板砖 40 行、白线附近 78 行、超级b1 65 行。
- 仓库断言全部回源码核对：`brick.py`(261 行全读)、`indicators/core.py:325-354`、`strategies/core.py`、`base_strategies.py:12`、`sell_signals.py:262+`。
- 13 条 v1 断言逐条给出核实结果（§〇），其中 **2 条推翻、3 条修正**。
- 未核实项已显式标注（无）。
- v1 **未存档**（就地覆盖，见头部说明）；其断言核实结论见 §〇，成立部分并入 §一。
