# knowledge/ 覆盖盘点（A1 相关概念）

> 盘点范围：`D:\Users\pml\Desktop\ZK\zettaranc-skill\knowledge\` 全部 *.md（32 篇）
> 方法：ripgrep 同义词组检索 + 命中处人工读上下文
> 结论口径：**完整定义** = 有判定标准/操作含义；**顺带一提** = 只在行文中出现一次且无展开；**仅词表收录** = 只在词典/术语表里有一行；**无** = 0 命中

---

## 一、总表

| # | 组 | 概念 | 判定 | 命中文件:行 | 覆盖内容摘要（≤60 字） |
|---|---|---|---|---|---|
| A1 | A · B2 系列 | B1/B2/B3 三件套（含「三件套」一词） | 完整定义 | `trading-core.md:121-132,232`；`advanced-patterns.md:142-167,154`；`thresholds.md:84-110`；`stock-glossary.md:100-124`；`signal_dictionary.md:145-168` | 三件套定义表+入场条件+仓位策略+胜率/确定性排序+衰竭点；「三件套」字面 2 处 |
| A2 | A · B2 系列 | B2 的定义（接 B1 的确认阳线） | 完整定义 | `advanced-patterns.md:151`；`trading-core.md:128`；`thresholds.md:94-102` | 「B1 后的放量中长阳线，确认 B1/SB1 低点」；另有「趋势确认买点」定位 |
| A3 | A · B2 系列 | B2 选股条件（钩/涨幅≥4%/放量/钩<55/无上影线） | 完整定义 | `advanced-patterns.md:38-43`；`thresholds.md:94-102,100,101,102`；`trading-core.md:128,230`；`choppy-market-sop.md:130` | 五项量化指标齐全：B1后拐头、涨幅≥4%（底线3.9%）、比前日放量、J<55、无上影线最佳 |
| A4 | A · B2 系列 | 三大暴力图形（平行重炮/灾后重建/跃跃欲试） | 完整定义 | `advanced-patterns.md:25-43,47-53,57-63`；`stock-glossary.md:104-109`；`trading-core.md:213-215` | 三个图形各有独立小节+定义+前提；「三大暴力图形」归类词本身 0 命中 |
| A5 | A · B2 系列 | B2 的止损设置 | 完整定义 | `trading-core.md:227`；`advanced-patterns.md:158`；`thresholds.md:61-65` | B2 止损=B1最低价；B3 止损=B2阳线中间或当天最低；清单所列「20厘米大阳线中线」0 命中 |
| A6 | A · B2 系列 | 三件套的盈亏比/确定性排序 | 完整定义 | `advanced-patterns.md:148-152`；`trading-core.md:132,225-228` | 确定性 B1最低→B2中等→B3最高；盈亏比 B1最高→B3最低；胜率 B1>B2>B3 |
| A7 | A · B2 系列 | 补票（补票胜率不如 B2） | 完整定义 | `advanced-patterns.md:84-88`；`stock-glossary.md:40`；`sell-discipline.md:33` | 单针下20补票战法有形态/胜率37%/盈亏比3:1；「胜率不如B2」这句对比 0 命中 |
| A8 | A · B2 系列 | B2 综合判断 / B2 不是单一信号 | 顺带一提 | `trading-core.md:128,131,230`；`advanced-patterns.md:38-43` | 多条件量化列示存在；「B2 不是单一信号」这一元表述 0 命中 |
| A9 | A · B2 系列 | 倍量柱 / 背量柱（含 ASR 变体） | 顺带一提 | `trading-core.md:22,41`；`indicators.md:198-199`；`signal_dictionary.md:137`；`advanced-patterns.md:176` | 「倍量柱」字面仅橙色判断依据清单收录；「倍量」有定义；「背量柱」0 命中 |
| A10 | A · B2 系列 | B 点 / 钩 / J 值 13 以下 | 顺带一提 | `trading-core.md:100,128`；`thresholds.md:88,100,303`；`advanced-patterns.md:19`；`heuristics.md:21` | 「钩」=KDJ钩值<55 有；J 阈值有 -10/-13/≤12 三种；「B 点」字面 0 命中 |
| B11 | B · 关键K | 关键K（含 ASR 变体） | 完整定义 | `key-candles.md:1,14,33,44-47,68-70`；`signal_dictionary.md:191-198`；`stock-glossary.md:114`；`heuristics.md:58`；`four-rhythms.md:18,31`；`trading-core.md:22,41` | 独立文件 `key-candles.md` 全篇 70 行；ASR 变体「关健K」0 命中 |
| B12 | B · 关键K | 关键K 的定义与判定标准、画法 | 完整定义 | `key-candles.md:12-16,33,42-51` | 定义+6 种趋势转换+管辖范围+5 条核心规则；「画法/怎么画/如何画」字面 0 命中 |
| B13 | B · 关键K | 关键K 的操作意义（支撑/买点/大资金信号） | 完整定义 | `key-candles.md:33,48-51,68-70`；`heuristics.md:58`；`signal_dictionary.md:195` | 与 B1 关系（确认信号）、与出货五式、与对称战法三条关联均写明 |
| B14 | B · 关键K | 暴力K | 顺带一提 | `signal_dictionary.md:191-198`；`trading-core.md:22,41` | 有输出字段（is_violence_k/大暴力/小暴力/实体涨幅），无判定标准与操作含义 |
| B15 | B · 关键K | 区间管理 / 区间顶底 | 无 | 0 命中 | 跑了 `区间管理\|区间顶\|区间底\|箱体`；等价表述在 `key-candles.md:33`、`heuristics.md:58` |
| C16 | C · 沉舟千帆 | 沉舟千帆 / 步步为营 | 无 | 0 命中 | 跑了 `沉舟\|千帆\|步步为营\|步步\|为营`，全部 0 命中 |
| C17 | C · 沉舟千帆 | 稳健进取 / 稳健与进取的取舍 | 顺带一提 | `portfolio-management.md:16`；`six-tracks-2026.md:124` | 仅在「配置逻辑」一行出现「稳健进取」；无任何展开 |
| C18 | C · 沉舟千帆 | 财政绑定 | 无 | 0 命中 | 跑了 `财政\|绑定`，两个词在 32 篇中均 0 命中 |
| C19 | C · 沉舟千帆 | 对称结构 / 对称理论（目标位预测） | 完整定义 | `advanced-patterns.md:125-138`；`trading-core.md:187-193`；`stock-glossary.md:115-116`；`heuristics.md:59`；`key-candles.md:70` | 三种对称（时间/空间/形态）+ 铁律 + 目标价计算（中心对称/祖冲之法 2a-b） |
| C20 | C · 沉舟千帆 | A 杀（一字/A 字杀跌） | 顺带一提 | `key-candles.md:29`；`advanced-patterns.md:134-135`；`trading-core.md:71,192`；`stock-glossary.md:115`；`indicators.md:64,151,170,178`；`sell-discipline.md:85` | 出现 10+ 处但全为行文用词，无独立定义段；「一字杀/A字杀」字面 0 命中 |
| C21 | C · 沉舟千帆 | 红绿黄策略 | 无 | 0 命中 | 跑了 `红绿灯\|红绿黄\|红黄绿`；等价物在 `portfolio-management.md:25-29`、`position-management.md:112` |
| D22 | D · 基础设施 | 活跃市值 ±2.3% / ±4% 阈值 | 完整定义 | `market-macro.md:21-26`；`thresholds.md:160-165,299-300`；`trading-core.md:20,38`；`heuristics.md:63`；`sell-discipline.md:102`；`position-management.md:30,78` | 阈值+概率框架+一致性铁律（卖用-2.3%买必用+4%）+准确率约70% |
| D23 | D · 基础设施 | 白线（牵牛绳）/ 黄线（主力成本） | 完整定义 | `trend-lines.md:12-27,57-63`；`stock-glossary.md:93-98`；`signal_dictionary.md:69-81,183-185`；`indicators.md:55-58,90-91`；`thresholds.md:145-146,172-174` | 公式（EMA(EMA(C,10),10) / BBI 4参变体）+三道防线+牛绳理论+碗 |
| D24 | D · 基础设施 | 击穿对手盘 / 忍一根 | 顺带一提 | `trading-core.md:48`；`trading-psychology.md:127-131`；`life-decision.md:162,275`；`life-decision-research.md:107,215,250`；`framework-extraction.md:129` | 有独立小节名但只有 3 条 bullet 无定义；「忍一根」仅 `trading-core.md:48` 一处 |
| D25 | D · 基础设施 | S1 / 滴滴 / 阶梯量 | 完整定义 | `exit-strategies.md:1,18,24-41,105-107`；`sell-discipline.md:114-145,165-179`；`thresholds.md:127-140`；`indicators.md:93-98`；`trading-core.md:45-46,70` | S1/滴滴各自独立文件级定义；「阶梯量」仅 1 处（trading-core:70）无展开 |
| D26 | D · 基础设施 | 四分之一量线 / 四分之三阴量 | 完整定义 | `advanced-patterns.md:97-108`；`heuristics.md:56`；`trading-core.md:217`；`choppy-market-sop.md:55` | 四分之三阴量有定义+成功率90%+；「四分之一量线」0 命中 |
| D27 | D · 基础设施 | 填坑出坑 / 第一目标价 | 完整定义 | `advanced-patterns.md:67-80`；`trading-core.md:22,216` | 坑里起好货/祖冲之法完整（目标价 2a-b、应用、容错）；「第一目标价」0 命中 |
| D28 | D · 基础设施 | N 型结构 / ABC 结构 | 完整定义 | `indicators.md:30,200,201`；`four-rhythms.md:16,29`；`trend-lines.md:35,36`；`trading-core.md:22,100,189,220`；`portfolio-management.md:138`；`position-management.md:117` | N 型（低点抬高）多处作判断依据；ABC 三阶段建仓法有独立小节 |
| D29 | D · 基础设施 | 建仓波 / 拉升波 / 冲刺波 | 完整定义 | `indicators.md:12-20`；`heuristics.md:34`；`trading-core.md:22,127`；`signal_dictionary.md:149,155` | 三波理论表：各波特征+对应 B1 策略+循环顺序；heuristics 有独立铁律 |
| D30 | D · 基础设施 | 四块砖 / 砖型图（专精图） | 完整定义 | `trading-core.md:109-117`；`thresholds.md:239-246`；`signal_dictionary.md:111-129`；`indicators.md:100-106`；`breathing-theory.md:54-56`；`sell-discipline.md:157` | 四块砖法则+砖型图字段+MACD共振表+呼吸理论映射；「专精图」及全部 ASR 变体 0 命中 |

---

## 二、逐条明细

### A 组 · B2 系列买点

#### A1. B1 / B2 / B3 三件套
- 判定：**完整定义**
- 命中：`knowledge/trading-core.md:121`（3.3 B1/B2/B3 战役确认体系，表 125-129）、`:131`（核心原则）、`:132`（胜率/确定性排名）、`:232`（三重确认）；`knowledge/advanced-patterns.md:142`（B2/B3 完整体系）、`:148-152`（定义表）、`:154`（三重确认）、`:156-167`（B3 规则+建仓方式）；`knowledge/reference/thresholds.md:84-110`（B1/B2/B3 量化标准）；`knowledge/stock-glossary.md:100-124`（B2/B3 战法术语表）；`knowledge/signal_dictionary.md:145-168`（代码字段）
- 「三件套」字面命中 2 处：`advanced-patterns.md:154`、`trading-core.md:232`
- 原文引证：
  - `trading-core.md:127-129`：「**B1 建仓波** | 回调波首次买点 | J ≤ -10、缩量回调、不破 60 日线或 BBI 黄线 | 慢慢买，5k/5k 分批，开盘一笔+水下补一笔」
  - `trading-core.md:232`：「**三重确认**：B1→B2→B3 三件套齐全，大概率进入沿白线的流畅上涨趋势。三天内没出现三件套，降低预期。」

#### A2. B2 的定义（B1 起来后第一根阳线 / 接 B1 的确认阳线）
- 判定：**完整定义**
- 命中：`knowledge/advanced-patterns.md:151`；`knowledge/trading-core.md:128`；`knowledge/reference/thresholds.md:94-102`
- 原文引证：
  - `advanced-patterns.md:151`：「| **B2** | B1 后的放量中长阳线，**确认** B1/SB1 低点 | 中等 | 中等 |」
  - `trading-core.md:128`：「| **B2 突破确认** | 趋势确认买点 | 一阳穿多线、放量长阳、突破对称区间。B1 后 3 交易日内，涨幅 ≥ 4%，KDJ 钩 < 55 | 舒服买，开盘一半+下杀补一半 |」
  - 注：清单表述「第一根阳线」在原文中是「放量中长阳线」；「阳线」与「中长阳线」口径存在差异。

#### A3. B2 选股条件（钩/J 值拐头、涨幅≥4%、比前日放量、钩<55、无上影线）
- 判定：**完整定义**
- 命中：`knowledge/advanced-patterns.md:38-43`（B2 量化指标 5 项）；`knowledge/reference/thresholds.md:94-102`（B2确认条件表）、`:100`（KDJ钩值<55）、`:102`（上影线）、`:303`（关键数字速查 KDJ钩<55）、`:302`（B2涨幅≥4%）；`knowledge/trading-core.md:128`（KDJ 钩 < 55）、`:230`；`knowledge/strategies/choppy-market-sop.md:130`
- 原文引证：
  - `advanced-patterns.md:38-43`：「**B2 量化指标**：- B1 之后拐头 - 涨幅 ≥ 4%（底线 3.9%） - 比前一交易日放量（平量也行） - J < 55 - 无上影线最好（光头最佳）」
  - `trading-core.md:230`：「**B2 量化指标**：B1之后拐头 + 涨幅≥4% + 比前一日放量 + J<55 + 无上影线最佳。」
  - 注：清单写「钩<55」，原文为「KDJ 钩 < 55」「KDJ钩值 <55」，一致。

#### A4. 三大暴力图形：平行重炮（双枪/三门重炮）、灾后重建、跃跃欲试
- 判定：**完整定义**（三个图形各自都有独立小节）
- 命中：
  - 平行重炮：`knowledge/advanced-patterns.md:25`（## 平行重炮 / 多门重炮）、`:29`（定义）、`:31-36`（多门重炮特征+双枪）、`:38-43`；`knowledge/stock-glossary.md:104`（词表行）；`knowledge/trading-core.md:213`（快速索引行）
  - 三门重炮/多门重炮：`knowledge/stock-glossary.md:106`；`advanced-patterns.md:31`（多门重炮特征）
  - 双枪：`knowledge/trading-core.md:181-183`（3.7 双枪战法独立小节）；`advanced-patterns.md:36`；`stock-glossary.md:105`；`signal_dictionary.md:177-180`（is_double_gun 等字段）
  - 灾后重建：`knowledge/advanced-patterns.md:47`（## 灾后重建）、`:51`（定义）、`:53`；`stock-glossary.md:107`；`trading-core.md:214`；`four-rhythms.md:64`；`heuristics.md:18`；`trend-lines.md:37`
  - 跃跃欲试：`knowledge/advanced-patterns.md:57`（## 跃跃欲试）、`:61`（定义）、`:63`（前提）；`stock-glossary.md:108`；`trading-core.md:215`
- 原文引证：
  - `advanced-patterns.md:29`：「**定义**：B2 战法四类图形之一。相对平行位置的两根及以上放量长阳，不用看 N 型结构。」
  - `advanced-patterns.md:51`：「**定义**：放量金叉后**缩量回踩黄线**，交易价值最大，是最后拉升前的震仓动作。」
  - `advanced-patterns.md:61`：「**定义**：横盘期间放巨大量，红长绿短、红肥绿瘦，出现至少三次后越往后突破概率越大。」
  - 注：`advanced-patterns.md:29` 称「B2 战法四类图形之一」，但文件内只展开了 3 个图形小节（平行重炮/灾后重建/跃跃欲试）+ 双枪作为平行重炮子项。「三大暴力图形」这个词组本身 0 命中，跑了 `三大|暴力图形|三大暴力`；`三大` 命中 `trading-psychology.md:79`、`position-management.md:62`、`choppy-market-sop.md:18`，均与本主题无关。**存疑：第四类图形是哪一类，knowledge/ 内未写。**

#### A5. B2 的止损设置（N 型前低、20 厘米大阳线中线、买入 K 下方）
- 判定：**完整定义**（但清单所列的三个具体口径只覆盖到部分）
- 命中：`knowledge/trading-core.md:227`（B2 止损 = B1最低价）、`:43`（止损三选一）、`:101`（少妇战法第 4 步止损）；`knowledge/advanced-patterns.md:158`（B3 止损 = B2 大阳线中间位置 或 B3 当天最低点）；`knowledge/reference/thresholds.md:56`（B1止损 3-5%）、`:61-65`（止损位置三选一）、`:110`（B3 止损位置）；`knowledge/strategies/choppy-market-sop.md:161`、`:217`
- 原文引证：
  - `trading-core.md:227`：「| B2 | 中等 | 中等 | B1最低价 | B2后2个交易日不大幅拉升→拍掉 |」
  - `thresholds.md:61-65`：「### 止损位置三选一\n\n1. 买入K线最低价\n2. N型结构前低\n3. 横盘平台下沿」
  - 注：清单写「N 型前低 / 20 厘米大阳线中线 / 买入 K 下方」。跑了 `厘米|20厘米` → **0 命中**；「N 型前低」命中 `thresholds.md:64`；「买入 K 下方」近似命中 `thresholds.md:63`（买入K线最低价）。原文给 B2 的止损是「B1最低价」，给 B3 的是「B2 阳线中间」——「大阳线中线」出现在 B3 而非 B2。**存疑：清单所列 B2 止损口径与 knowledge/ 内 B2 行不一致。**

#### A6. 三件套的盈亏比 / 确定性排序（B1>B2>B3 等）
- 判定：**完整定义**
- 命中：`knowledge/advanced-patterns.md:148-152`（定义表，含确定性/盈亏比两列）；`knowledge/trading-core.md:132`（胜率排名+确定性排名）、`:225-228`（确定性/盈亏比/止损/衰竭点四列表）
- 原文引证：
  - `trading-core.md:132`：「- **胜率排名**：B1 > B2 > B3。**确定性排名**：B3 > B2 > B1。」
  - `advanced-patterns.md:150-152`：「| **B1** | 不同时间周期下，相对低点的位置 | 最低 | 最高 |」/「| **B2** | B1 后的放量中长阳线，**确认** B1/SB1 低点 | 中等 | 中等 |」/「| **B3** | B2 上涨后的中继小阳线，分歧转一致 | 最高 | 最低（风险最大） |」
  - 注：清单写「B1>B2>B3」——原文是**胜率** B1>B2>B3，**确定性**是 B3>B2>B1（反向）。两者均已写明。

#### A7. 补票（补票胜率不如 B2）
- 判定：**完整定义**（补票战法本身）；「补票胜率不如 B2」这句对比 **存疑**
- 命中：`knowledge/advanced-patterns.md:84`（## 单针下 20 补票战法）、`:86`（来源）、`:88`（胜率37%、盈亏比3:1）、`:90-93`（三种形态）；`knowledge/stock-glossary.md:40`（赛赛「补票机会」=洗盘后短线）；`knowledge/sell-discipline.md:33`（按少妇战法/补票战法纪律办）
- 原文引证：
  - `advanced-patterns.md:84-88`：「## 单针下 20 补票战法\n\n**来源**：知行小菜鸟 07、知行课代表 11\n\n**胜率**：37%（但盈亏比 3:1）」
  - `stock-glossary.md:40`：「| 赛赛 | 赛力斯 | 华为合作热点，"补票机会"=洗盘后短线 |」
  - 注：跑了 `补票` 全文 → 3 处，均无与 B2 的胜率对比。**存疑：「补票胜率不如 B2」在 knowledge/ 内无原文支撑。**

#### A8. B2 综合判断 / B2 不是单一信号
- 判定：**顺带一提**
- 命中：`knowledge/trading-core.md:128`（B2 行含 4 项入场条件）、`:131`（"牛逼的 b1 后必有 b2 确认，b2 有 b3 确认"）、`:230`（5 项量化指标）；`knowledge/advanced-patterns.md:38-43`（同 5 项）
- 原文引证：
  - `trading-core.md:131`：「- **核心原则**：牛逼的 b1 后必有 b2 确认，b2 有 b3 确认。不要在 b1 没玩明白时就捣鼓 b2b3。新手先学会 b1。」
  - 注：多条件量化列示存在（可视为综合判断的素材），但「B2 不是单一信号 / 需综合判断」这一元表述在 32 篇中 **0 命中**。跑了 `B2.*不是|不是单一|综合判断` 对应的同义检索。

#### A9. 倍量柱 / 背量柱（含 ASR 变体）
- 判定：**顺带一提**（「倍量柱」字面仅清单收录；「倍量」有定义）；「背量柱」**无**
- 命中：`knowledge/trading-core.md:22`（橙色判断依据清单列名「倍量柱」）、`:41`（12 步流程第 4 步橙色过滤清单列名）；`knowledge/indicators.md:198`（量柱类型表：倍量）、`:199`（天量）；`knowledge/signal_dictionary.md:137`（is_beidou 倍量——今日量≥昨日量×2）；`knowledge/advanced-patterns.md:176`（新路径放量判定 `vol/yesterday.vol >= 2.0`）
- 原文引证：
  - `indicators.md:198-199`：「| **倍量** | 底部第一根超过 2 倍量的量柱 | 大哥来了 |」/「| **天量** | 倍量之后再倍量 | 出现天量柱时尽量放飞 |」
  - `signal_dictionary.md:137`：「| `is_beidou` | bool | 倍量——今日量≥昨日量×2 |」
  - 注：跑了 `倍量柱|背量柱|倍量|背量`。**「背量柱」「背量」全部 0 命中**——「倍量柱」的 ASR 变体在 knowledge/ 内未收录。

#### A10. B 点 / 钩 / J 值 13 以下
- 判定：**顺带一提**（分散出现，无独立小节）；「B 点」**无**
- 命中：
  - 「钩」：`knowledge/trading-core.md:128`（KDJ 钩 < 55）、`knowledge/reference/thresholds.md:100`（KDJ钩值 <55）、`:303`（KDJ钩 <55）
  - J 值阈值：`knowledge/trading-core.md:100`（J ≤ 12（最好负值））、`:127`（J ≤ -10）、`knowledge/advanced-patterns.md:19`（J < -13）、`:42`（J < 55）、`knowledge/reference/thresholds.md:88`（J值 ≤-10）、`:297`（J值 ≤-10）、`knowledge/heuristics.md:21`（J 值打到 -10 以下）、`knowledge/signal_dictionary.md:49`（j < -10）
- 原文引证：
  - `trading-core.md:100`：「| **3. 等 B1** | KDJ J 值买入信号 | KDJ 参数 (9,3,3)。J ≤ 12（最好负值）+ N 型上移结构 + 缩量回调。主线票看周线 B1，主题票看日线 B1 |」
  - `advanced-patterns.md:19`：「1. 第一天为 B1（J < -13）」
  - 注：跑了 `B点|B 点` → **0 命中**。清单「J 值 13 以下」在原文对应三条不同阈值：`J ≤ 12`（trading-core:100）、`J < -13`（advanced-patterns:19）、`J ≤ -10`（多处）。**存疑：清单的「13 以下」在 knowledge/ 内无单一对应阈值，存在 12/-13/-10 三套并行数字。**

---

### B 组 · 关键K

#### B11. 关键K（含 ASR 变体：关键 K / 关健K / 关键 K 线）
- 判定：**完整定义**
- 命中：`knowledge/key-candles.md:1`（# 关键 K 理论 · key-candles）、`:3`（题记）、`:6`（加载时机）、`:14`（核心定义）、`:33`、`:44-47`（核心规则 5 条）、`:68-70`（三条关联）；`knowledge/signal_dictionary.md:191`（## 十一、关键K/暴力K）、`:195`（key_k_list 字段）；`knowledge/stock-glossary.md:114`（关键 K 词表行）；`knowledge/heuristics.md:58`（第 29 条）；`knowledge/four-rhythms.md:18`（洗盘节奏关键识别）、`:31`（关键 K 线出现）；`knowledge/trading-core.md:22`、`:41`（橙色判断依据清单）
- 原文引证：
  - `key-candles.md:14`：「**关键 K**：走势中绝大多数 K 线都没有意义，它们服从少数几根 K 线的管理。关键 K = 关键位置的**放量长中阳/阴**，代表主力在搞事情。」
  - `key-candles.md:3`：「> 「走势中绝大多数 K 线都没有意义，它们服从少数几根 K 线的管理。」」
  - 注：跑了 `关键K|关键 ?K|关健K|关键 ?K 线|关键K线`，共 21 处命中。**「关健K」（ASR 错字变体）0 命中**——knowledge/ 内统一写作规范形「关键 K」（带空格）。

#### B12. 关键K 的定义与判定标准、画法
- 判定：**完整定义**（定义/判定标准齐全；「画法」无）
- 命中：`knowledge/key-candles.md:12-16`（核心定义）、`:20-31`（两个核心意义之一的 6 种趋势转换表）、`:33`（管辖范围）、`:42-51`（核心规则 5 条 + 主力打明牌的 3 个前提）
- 原文引证：
  - `key-candles.md:33`：「**关键 K 的管辖范围**：后续走势在其上下沿之间震荡，缩量洗盘最佳。」
  - `key-candles.md:44-47`：「1. **关键 K 对港股意义不大**（没有涨跌停限制），T+1 A 股专用\n2. 长上影的关键 K 对股价支撑较弱，**最强势的是放量涨停实体**\n3. 前面有向下关键 K（放量大阴）的，后面 B1 大概率熄火\n4. 关键 K 可以是个股、ETF、大盘指数、活跃市值」
  - 注：跑了 `画法|怎么画|如何画` → **0 命中**。knowledge/ 内有关键 K 的**定义与判定规则**，但无「怎么在图上标画关键 K」的绘图步骤说明。

#### B13. 关键K 的操作意义（支撑 / 买点依据 / 大资金入场离场信号）
- 判定：**完整定义**
- 命中：`knowledge/key-candles.md:33`（管辖范围=支撑语义）、`:48-51`（主力打明牌 3 前提，含「洗盘一般洗到攻击性阳线的一半左右（主力成本位）」）、`:68`（与 B1 关系=确认信号）、`:69`（与出货五式=出货信号，对应 S1 逃顶）、`:70`（与对称战法）；`knowledge/heuristics.md:58`；`knowledge/signal_dictionary.md:195`
- 原文引证：
  - `key-candles.md:68-70`：「- **与 B1 的关系**：关键 K 是 B1 的确认信号——关键 K 出现后缩量回调到 B1 才是好买点\n- **与出货五式的关系**：向下的关键 K（放量大阴）= 出货信号，对应 S1 逃顶\n- **与对称战法的关系**：关键 K 打破对称 = 跟随操作的时机」
  - `heuristics.md:58`：「29. **关键 K 的上下沿 = 后续走势管辖范围**」

#### B14. 暴力K
- 判定：**顺带一提**
- 命中：`knowledge/signal_dictionary.md:191`（## 十一、关键K/暴力K，与关键K 共用一节）、`:196`（is_violence_k）、`:197`（violence_k_type 大暴力/小暴力）、`:198`（violence_k_body 实体涨幅%）；`knowledge/trading-core.md:22`、`:41`（橙色判断依据清单列名）
- 原文引证：
  - `signal_dictionary.md:196-198`：「| `is_violence_k` | bool | 最新这天是否出现暴力K |\n| `violence_k_type` | str | `大暴力` / `小暴力` |\n| `violence_k_body` | float | 实体涨幅（%） |」
  - 注：跑了 `暴力 ?K|暴力K|暴力图形`。暴力K 在 knowledge/ 内**只有输出字段定义，无任何判定标准（多大实体算暴力K）与操作含义**。无独立文件、无独立小节。

#### B15. 区间管理 / 区间顶底
- 判定：**无**
- 命中：**0 命中**
- 跑的正则：`区间管理|区间顶|区间底|箱体`（另跑了更宽的 `区间` 作为对照）
- 对照说明：「区间」作为普通词命中 34 处，但均为「多头区间/空头区间/区间震荡/白黄区间」等用法，无「区间管理」这一战法名。与「区间顶底」语义最接近的等价表述在：
  - `knowledge/key-candles.md:33`：「**关键 K 的管辖范围**：后续走势在其上下沿之间震荡，缩量洗盘最佳。」
  - `knowledge/heuristics.md:58`：「29. **关键 K 的上下沿 = 后续走势管辖范围**」
  - 「箱体」0 命中。

---

### C 组 · 沉舟千帆主题

#### C16. 沉舟千帆 / 步步为营（作为策略名的任何出现）
- 判定：**无**
- 命中：**0 命中**
- 跑的正则：`沉舟|千帆|步步为营|步步|为营`（其中「步步」「为营」为放宽变体，确保漏检为假阴性）
- 对照说明：32 篇中无任何文件出现「沉舟」「千帆」「步步为营」，「步步」「为营」作为子串也 0 命中。最接近的「策略名」类内容为 `knowledge/portfolio-management.md:12`（新曼城 4231 体系）与 `knowledge/strategies/choppy-market-sop.md`（震荡市 SOP），但名称无关。

#### C17. 稳健进取 / 稳健与进取的取舍
- 判定：**顺带一提**
- 命中：`knowledge/portfolio-management.md:16`（唯一一次「稳健进取」）；`knowledge/six-tracks-2026.md:124`（「后卫（稳健）」— 配置角色，非同一术语）
- 原文引证：
  - `portfolio-management.md:16`：「**配置逻辑**：稳健进取、主升波段+长线估值、慢就是快、纯血+混血。」
  - `six-tracks-2026.md:124`：「| **后卫（稳健）** | 消费升级 + 周期资源 | 25% |」
- 注：「稳健进取」出现在「新曼城 4231 体系」的配置逻辑一句话中，所在小节（`:12-36`）展开的是 4231 配置、三阶段标注、阵容变化，**未对「稳健 vs 进取」的取舍做任何展开**。跑了 `稳健|进取` 共 3 处命中。

#### C18. 财政绑定
- 判定：**无**
- 命中：**0 命中**
- 跑的正则：`财政|绑定`（两个词分别检索，均为 0）
- 对照说明：「财政」在 32 篇中 0 命中；「绑定」0 命中。相关但不同的宏观表述出现在 `knowledge/market-macro.md:21-26`（活跃市值概率框架）、`:28-33`（顺周期轮动顺序），无财政绑定内容。

#### C19. 对称结构 / 对称理论（目标位预测）
- 判定：**完整定义**
- 命中：`knowledge/advanced-patterns.md:125`（## 对称 VA 战法）、`:127`（来源 `[202601111030]独门对称VA战法`）、`:129`（核心原理）、`:131-136`（三种对称）、`:138`（铁律）；`knowledge/trading-core.md:187-193`（3.8 对称 VA 战法）、`:219`（快速索引）；`knowledge/stock-glossary.md:115-116`（直接对称/间接对称词表行）；`knowledge/heuristics.md:59`（第 30 条）；`knowledge/key-candles.md:70`；`knowledge/strategies/choppy-market-sop.md:263`
- 原文引证：
  - `advanced-patterns.md:131-136`：「**三种对称**：\n1. **时间对称**：上升周期对应下降周期，活跃市值 +4% 对应 -2.3%\n2. **空间对称**：\n   - 直接对称 = A 杀，上涨下跌完全对称\n   - 间接对称 = 回调一半，没有完全 A 杀下来\n3. **形态对称**：中心对称（挖坑目标价计算）、轴对称」
  - `advanced-patterns.md:138`：「**铁律**：不要买对称还在下跌途中的赌明天反弹，而是做那些已经企稳甚至反弹的 B2。只有守恒被破坏的位置才有交易价值。」
- 目标位预测：`advanced-patterns.md:136`（中心对称 → 挖坑目标价计算）；配套的填坑目标价公式在 `advanced-patterns.md:73-76`（祖冲之法 2a-b）。

#### C20. A 杀（一字 / A 字杀跌）
- 判定：**顺带一提**
- 命中：`knowledge/key-candles.md:29`（趋势转换表：上涨→下跌 / A 杀反转）；`knowledge/advanced-patterns.md:134-135`（直接对称 = A 杀）；`knowledge/trading-core.md:71`（顶部放量后 A 杀下来）、`:192`（空间对称：直接对称（A 杀））；`knowledge/stock-glossary.md:115`（直接对称：完全 A 杀）；`knowledge/indicators.md:64`（A 杀三天就 -20%~-30%）、`:151`（见顶在即，A 杀概率高）、`:170`（直接破位 A 杀）、`:178`（高位横盘+筹码快速分散=A 杀前兆）；`knowledge/iron-butterfly.md:57`（单顶 A 杀，速度快）；`knowledge/sell-discipline.md:85`（盘子越小越容易一把 A 杀走人）；`knowledge/market-macro.md:54`（重演 A 杀）
- 原文引证：
  - `key-candles.md:29`：「| 上涨 → 下跌 | A 杀反转 | A 杀反转 |」
  - `advanced-patterns.md:134`：「   - 直接对称 = A 杀，上涨下跌完全对称」
  - 注：跑了 `A杀|A 杀|一字杀|A字杀`。「A 杀」命中 12 处，**全部为行文用词**，无独立定义段、无判定标准（如跌幅阈值/几根 K 线）。**「一字杀」「A字杀」字面 0 命中**。

#### C21. 红绿黄策略
- 判定：**无**
- 命中：**0 命中**
- 跑的正则：`红绿灯|红绿黄|红黄绿|红绿黄策略`
- 对照说明：knowledge/ 内存在**两套颜色体系**，但不是「红绿黄策略」这个名称：
  - `knowledge/portfolio-management.md:23-29`：「### 三阶段标注」表 → 「**绿色** | 筑底阶段 | 有估值优势的埋伏」「**黄色** | 趋势中 | 用右侧方式做」「**红色** | 过热板块 | 高位博傻，区间震荡里找 B1 做小反弹」
  - `knowledge/position-management.md:112`：「| **新曼城4231** | 70%主配置+30%量化灵动，绿/黄/红三阶段标注 |」
  - `knowledge/trading-core.md:16-23`：「Z 哥把整套交易体系分成**四层颜色模块**」→ 🟥红色=择时 / 🟦蓝色=买入 / 🟧橙色=判断依据 / 🟨黄色=应对
  - `knowledge/harness.md:49,58`：「可以做的（绿灯）」「不可以做的（红灯）」（行为约束用色，非策略）

---

### D 组 · 相关基础设施

#### D22. 活跃市值 ±2.3% / ±4% 阈值
- 判定：**完整定义**
- 命中：`knowledge/market-macro.md:21-26`（活跃市值概率框架，完整）；`knowledge/reference/thresholds.md:160-165`（活跃市值阈值表）、`:299-300`（关键数字速查）；`knowledge/trading-core.md:20`（第一层红色择时）、`:38`（12 步第 1 步）；`knowledge/heuristics.md:63`（第 31 条）；`knowledge/sell-discipline.md:102`（每日五步第 1 步）；`knowledge/position-management.md:30`、`:78`；`knowledge/workflow.md:137`、`:143`；`knowledge/advanced-patterns.md:132`（时间对称）；`knowledge/indicators.md:125-130`（活跃市值本质）；`knowledge/strategies/choppy-market-sop.md:87`、`:214`
- 原文引证：
  - `market-macro.md:22-25`：「- 活跃市值（指南针）不是选股工具，是大盘概率指标。\n- **+4% 以上**：市场从空转多，赚钱概率高，开始逐步建仓…\n- **-2.3% 以下**：市场从多转空，赚钱概率极低，开始减仓…\n- **一致性铁律**：卖的时候用了-2.3%，买的时候必须用+4%。不能下跌按信号跑，上涨凭感觉不敢买。」
  - `thresholds.md:164-165`：「| 多头 | +4% | 单根红柱>4%或累计>4% |」/「| 空头 | -2.3% | 波段内 |」

#### D23. 白线（牵牛绳）/ 黄线（主力成本）
- 判定：**完整定义**
- 命中：`knowledge/trend-lines.md:12`（## 知行趋势线（白线 + 黄线 / 大哥线））、`:20-21`（定义+公式表）、`:25-27`（三道防线）、`:33-37`（五种玩法）、`:41-49`（操作纪律）、`:53`（完整循环）、`:57-58`（牛绳理论）、`:63`（迪迪图）、`:89`（失效条件）；`knowledge/stock-glossary.md:93-98`（碗/碗小/牵牛绳/大哥线/迪迪图/牛绳理论）；`knowledge/signal_dictionary.md:69-81`（双线战法字段）、`:183-185`（黄金碗字段）；`knowledge/indicators.md:55-58`（白线位置区间属性表）、`:90-91`（白线/黄线位置买点）；`knowledge/reference/thresholds.md:145-146`、`:172-174`；`knowledge/trading-core.md:47-48`；`knowledge/sell-discipline.md:159-160`
- 原文引证：
  - `trend-lines.md:20-21`：「| **白线** | 短期趋势线 | 流畅波段的"牵牛绳"，短期止损警戒线 | `EMA(EMA(CLOSE,10),10)` |」/「| **黄线** | 大哥线 / 知行多空线 | 主力是否入场的标志、极限洗盘极限位、大哥控盘成本线 | 4 参数 BBI 变体（比 BBI 周期更长） |」
  - `stock-glossary.md:95-96`：「| **牵牛绳** | 白线=强势股的短期趋势支撑，不下不卖 | 双线战法 |」/「| **大哥线** | 黄线=知行多空线，主力成本线 | 双线战法 |」

#### D24. 击穿对手盘 / 忍一根
- 判定：**顺带一提**
- 命中：
  - 击穿对手盘：`knowledge/trading-psychology.md:127`（### 击穿对手盘小节）、`:129-131`；`knowledge/trading-core.md:48`（12 步第 11 步破黄线）；`knowledge/life-decision.md:162`（来源：Z 哥文章《击穿对手盘》）、`:275`；`knowledge/life-decision-research.md:107`（来源 `[202601290133]46击穿对手盘`）、`:215`、`:250`；`knowledge/framework-extraction.md:129`（场景1: 《击穿对手盘》）
  - 忍一根：`knowledge/trading-core.md:48`（唯一一处）
- 原文引证：
  - `trading-psychology.md:127-131`：「### 击穿对手盘\n\n- 如何度过买入后最令人作呕的那根 K 线\n- 2025 年最难的一课：无声的博弈\n- 站在对手盘的对立面」
  - `trading-core.md:48`：「| 11 | **破黄线** | 黄线之上大哥在，黄线之下大哥不在；击穿对手盘可忍一根，新人别赌 |」
  - 注：跑了 `对手盘|忍一根|忍一|击穿`。「击穿对手盘」虽有同名小节，但小节内容仅 3 条 bullet，**无定义、无判定标准、无操作规则**；「忍一根」仅 1 处且无展开。原始出处（`[202601290133]46击穿对手盘`）在 `life-decision*.md` 中被引用为**认知类**素材（赚小钱 vs 博暴利 / 大碗理论 / 与庄共舞），非交易规则。

#### D25. S1（顶部放量阴线）/ 滴滴 / 阶梯量
- 判定：**完整定义**（S1、滴滴）；「阶梯量」顺带一提
- 命中：
  - S1：`knowledge/exit-strategies.md:1`（# S1/S2/S3 逃顶体系）、`:18`（S1 行）、`:24`（## S1：初级逃顶信号）、`:35`（100 亿以下小票直接清仓）、`:37`（大盘 S1）、`:41`（出货五式）、`:105-107`（## 大盘 S1）；`knowledge/sell-discipline.md:165`（## S1/S2/S3 逃顶体系）、`:175`（S1 定义）、`:158`（S1 一票否决）；`knowledge/reference/thresholds.md:131`（S1 阈值行）；`knowledge/indicators.md:98`（S1 信号优先级凌驾一切）；`knowledge/key-candles.md:38`（买盘枯竭→S1 卖出信号）、`:69`；`knowledge/trading-core.md:45`（第 8 步）；`knowledge/strategies/choppy-market-sop.md:52`、`:163`；`knowledge/four-rhythms.md:19`、`:53`、`:85`、`:98`
  - 滴滴：`knowledge/sell-discipline.md:114`（## 3.17 滴滴战法精确执行）、`:116`（14:55 闹钟战法定义）、`:138-145`（场景表+原话）；`knowledge/reference/thresholds.md:135-140`（滴滴战法阈值表）；`knowledge/trading-core.md:46`（第 9 步没 S1 看滴滴）；`knowledge/indicators.md:93-96`（金叉空+滴滴共振）；`knowledge/strategies/choppy-market-sop.md:164`
  - 阶梯量：`knowledge/trading-core.md:70`（唯一一处）
- 原文引证：
  - `sell-discipline.md:175`：「| **S1** | 流畅上涨后出现丑陋的大绿帽（假阴真阳也算） | 必走，100亿以下小票直接清仓 |」
  - `sell-discipline.md:116`：「「滴滴」= 14:55 闹钟战法，专治「持仓不知道该不该走」的纠结。」
  - `trading-core.md:70`：「| **2. 上方有没有标准压力？** | 上涨空间是否被压制 | 顶部有 S1、阶梯量、次高点放量出货等压力，反弹空间不足 |」
  - 注：跑了 `S1|滴滴|阶梯量|台阶量`。「阶梯量」仅 1 处、在 B1 入场三问的举例中出现，**无定义**；「台阶量」0 命中。

#### D26. 四分之一量线 / 四分之三阴量
- 判定：**完整定义**（仅指四分之三阴量）；「四分之一量线」**无**
- 命中：`knowledge/advanced-patterns.md:97`（## 四分之三阴量战法（卖出/逃顶））、`:99`（定位）、`:101`（来源 `[202508240730]四分之三阴量B2战法上`、`[202508250000]四分之三阴量B2战法下`）、`:103`（核心定义）、`:105-108`（用法）；`knowledge/heuristics.md:56`（第 27 条）；`knowledge/trading-core.md:217`（快速索引）；`knowledge/strategies/choppy-market-sop.md:55`（减仓信号）
- 原文引证：
  - `advanced-patterns.md:103`：「**核心定义**：判断真假突破的核心工具。突破大阳线次日，若收阴线且成交量为前日阳量的 3/4，则为假突破，主力在出货。成功率 90%+。」
  - `heuristics.md:56`：「27. **四分之三阴量（卖点）：次日阴量 ≤ 阳量 3/4 = 真突破，> 3/4 = 假突破卖出/清仓**」
  - 注：跑了 `四分之一量线|四分之一|四分之三|四分之`。「四分之一量线」**0 命中**；「四分之一」作为子串 0 命中。

#### D27. 填坑出坑 / 第一目标价
- 判定：**完整定义**（填坑出坑）；「第一目标价」**无**
- 命中：`knowledge/advanced-patterns.md:67`（## 坑里起好货 / 祖冲之法）、`:69`（来源 `[20250629]坑里起好货`）、`:71`（核心逻辑）、`:73-76`（祖冲之法 2a-b 公式）、`:78-80`（应用）；`knowledge/trading-core.md:22`（橙色清单列名「填坑出坑」）、`:216`（快速索引行）
- 原文引证：
  - `advanced-patterns.md:71`：「**核心逻辑**：填坑意味着解放前期所有套牢盘，主力进场不是做慈善的，大概率是先知先觉资金入场准备做一波大的。」
  - `advanced-patterns.md:73-76`：「**祖冲之法**：主力大致要拉到 **2a - b** 的位置再出货才有足够利润空间。\n- a = 近期高点\n- b = 近期低点\n- 是模糊的正确」
  - 注：跑了 `第一目标|目标价|目标位`。**「第一目标价」0 命中**；文件中的目标位表述为「祖冲之法 2a-b」（`advanced-patterns.md:73`）、「中心对称（挖坑目标价计算）」（`advanced-patterns.md:136`）、「宁子目标价 35」（`portfolio-management.md:33`）。

#### D28. N 型结构 / ABC 结构
- 判定：**完整定义**
- 命中：
  - N 型：`knowledge/indicators.md:30`（吸阶段特征）、`:200`（长阴短柱（上涨N型回调阶段））、`:201`（下降N型阴线）；`knowledge/four-rhythms.md:16`（建仓节奏关键识别）、`:29`（N 型结构逐步抬高）；`knowledge/trend-lines.md:35`（玩法三）、`:36`（玩法四）；`knowledge/trading-core.md:22`、`:100`、`:189`、`:220`；`knowledge/signal_dictionary.md:176`（超级B1 定义含 N型回调）、`:187`（breath_n_type）；`knowledge/iron-butterfly.md:28`；`knowledge/strategies/choppy-market-sop.md:115`；`knowledge/reference/thresholds.md:64`（止损位置：N型结构前低）；`knowledge/market-macro.md:81`；`knowledge/portfolio-management.md:81`；`knowledge/macro/etf-strategy.md:59`、`:67`
  - ABC：`knowledge/portfolio-management.md:138`（### ABC 三阶段建仓法）；`knowledge/position-management.md:117`（ABC三阶段建仓 | A止跌试水→B横盘重仓→C突破持股）；`knowledge/trading-core.md:22`、`:41`（橙色判断依据清单列名「ABC」）
- 原文引证：
  - `indicators.md:16-18`（三波理论表中「N 型」相关）：见 D29
  - `position-management.md:117`：「| **ABC三阶段建仓** | A止跌试水→B横盘重仓→C突破持股 |」
  - `signal_dictionary.md:187`：「| `breath_n_type` | bool | N 型结构（低点抬高） |」
  - 注：`data_dictionary.md:112`「class DataSource(ABC):」为 Python 抽象基类，与本主题无关（已排除）。

#### D29. 建仓波 / 拉升波 / 冲刺波
- 判定：**完整定义**
- 命中：`knowledge/indicators.md:12`（## 三波理论）、`:16-18`（三波表）、`:20`（循环顺序）；`knowledge/heuristics.md:34`（第 14 条）；`knowledge/trading-core.md:22`（橙色清单列名「建仓/拉升/冲刺波」）、`:127`（B1 建仓波）、`:31`（三波理论归位）；`knowledge/signal_dictionary.md:149`（is_b1 = B1 建仓波信号）、`:155`（b1_rally_pct 建仓波涨幅）；`knowledge/iron-butterfly.md:3`、`:72`（铁蝴蝶在拉升波）；`knowledge/position-management.md:91`；`knowledge/stock-glossary.md:84`
- 原文引证：
  - `indicators.md:14-18`：「| 波次 | 特征 | B1 策略 |\n|------|------|---------|\n| **建仓波** | 底部 25-50% 涨幅，连续中/大阳线，无涨停 | B1 可干，高概率 |\n| **拉升波** | 快速脱离成本区，有涨停 | 第一个 B1 不碰，等回调一半或 SB1 |\n| **冲刺波** | 最后主升浪 | 不看 |」
  - `heuristics.md:34`：「14. **建仓波 b1 可干，拉升波第一个 b1 不干**」

#### D30. 四块砖 / 砖型图（专精图）
- 判定：**完整定义**
- 命中：`knowledge/trading-core.md:109`（## 3.2 四块砖法则）、`:111-117`（法则 5 条）；`knowledge/reference/thresholds.md:239-246`（四块砖法则表）；`knowledge/signal_dictionary.md:111`（## 七、砖型图）、`:115-123`（字段表）、`:125-129`（四块砖规则）；`knowledge/indicators.md:100-106`（砖型图与 MACD 共振表）；`knowledge/breathing-theory.md:54-56`（与四块砖法则的关系）；`knowledge/sell-discipline.md:157`（绿砖绝不抄底）；`knowledge/strategies/choppy-market-sop.md:89`、`:114`、`:162`；`knowledge/workflow.md:131`、`:135`、`:339`；`knowledge/portfolio-management.md:179`；`knowledge/data_dictionary.md:164`（砖型图趋势 115天）；`knowledge/life-decision.md:273`、`knowledge/life-decision-research.md:213`（三长一短选最短=砖型图"蒙题技巧"）；`knowledge/harness.md:54`、`:77`
- 原文引证：
  - `trading-core.md:111-115`：「源于威尔斯·威尔德 Delta 理论，A 股短期每 4 天一个情绪循环。\n\n- **红砖上涨循环**：第 1 块红砖确认入场 → 持有 → 第 4 块红砖走完至少减仓一半\n- **绿砖下跌循环**：绿砖出现绝不抄底 → 先数满 4 块 → 翻红且不创新低才轻仓试错\n- **第 4 砖加速定律**：如果第 4 块红砖向上加速，那下跌周期里第 4 块绿砖也会向下加速」
  - 注：跑了 `四块砖|砖型图|砖形图|专精图|专行图|专情图|专型图|专赢图|专景图|专一图|砖块`。**「专精图」及全部 6 个 ASR 变体 0 命中**；knowledge/ 内统一使用「砖型图」（signal_dictionary/indicators/data_dictionary/portfolio-management/choppy-market-sop/workflow）与「砖形图」（trading-core/choppy-market-sop/workflow）两种写法并存。

---

## 三、意外发现

盘点过程中发现的、不在上面 30 条清单里但与本主题相关的覆盖：

1. **「B2 战法四类图形之一」但只展开了 3 个图形** — `knowledge/advanced-patterns.md:29` 明写「B2 战法四类图形之一」，但该文件内只有「平行重炮 / 多门重炮」（`:25`）、「灾后重建」（`:47`）、「跃跃欲试」（`:57`）三个图形小节，双枪（`:36`）是平行重炮的子项。第 4 类图形在 knowledge/ 内未命名。

2. **两套 B2 量化实现并存（代码层事实）** — `knowledge/advanced-patterns.md:169-183` 记录了量化代码里两个 B2 函数并存且参数不同：旧路径 `modules.strategies.base_strategies.detect_b2`（B1 lookback 5-15 天硬编码 / 放量判定 `is_beidou` / 必传 kirin_context）vs 新路径 `modules.strategies.b1_b2_confirm.is_b2_signal`（3-5 天可配 / `vol/yesterday.vol >= 2.0` / 忽略麒麟阶段），并注明「同一天可能出/不出与旧路径相反」。

3. **长安战法 = B3 的另一个名字** — `knowledge/trading-core.md:129` 把 B3 的「入场条件」直接标为「长安战法」；`knowledge/advanced-patterns.md:12-21` 给出长安战法完整三条件（75% 胜率，年初至今全 A 约 20 次）。即 B3 有一份独立命名与独立胜率数据。

4. **超级 B1 / SB1 / 娜娜图形 / 单针下 20 / 单针下 30 是一组未在清单内的 B 系买点家族** — 超级 B1：`advanced-patterns.md:187-195`、`trading-core.md:145-151`、`signal_dictionary.md:176`、`thresholds.md:216`；SB1：`trading-core.md:155-160`、`signal_dictionary.md:182`；娜娜图形：`advanced-patterns.md:199-209`、`signal_dictionary.md:181`；单针下 20/30：`advanced-patterns.md:84`、`signal_dictionary.md:91-92`。这组与 B1/B2/B3 同属「买入层」，但清单 A 组未列。

5. **`signal_dictionary.md` 里「关键K」与「暴力K」共用第十一节，但两者完备度差一个量级** — `signal_dictionary.md:191-198`：关键K 有 `key_k_list`（60 日内列表，含 date/type/body_pct/vol_ratio），暴力K 只有 3 个字段（is_violence_k / violence_k_type 大暴力·小暴力 / violence_k_body）且无阈值。

6. **醒目的「颜色体系」有三套且互不相同** — ①`portfolio-management.md:25-29` 绿=筑底/黄=趋势中/红=过热（三阶段标注）；②`trading-core.md:18-23` 🟥红=择时/🟦蓝=买入/🟧橙=判断依据/🟨黄=应对（四层模块）；③`harness.md:49,58` 绿灯=可做/红灯=不可做（行为约束）。三者都不是清单里的「红绿黄策略」。

7. **`key-candles.md` 给出了关键K 与出货五式的桥接** — `key-candles.md:69`：「向下的关键 K（放量大阴）= 出货信号，对应 S1 逃顶」，即 M4（理论武器库）的关键K 直接挂到了 M3（卖点）的 S1 上，是 A1 主题内少见的跨模块显式链接。

8. **`four-rhythms.md:64` 用了「灾区重建」这个异写** — 该处写作「可能出现「灾区重建」形态：放量金叉后缩量回踩黄线」，而全库其余位置（`advanced-patterns.md:47` 等 6 处）均写「灾后重建」。属同一概念的错字变体，已按 A4 合并计入。

9. **`life-decision.md` / `life-decision-research.md` 把《击穿对手盘》归入人生决策语料而非交易规则** — `life-decision.md:162`、`life-decision-research.md:107,250` 显示原始文件 `[202601290133]46击穿对手盘…` 被提炼为「赚小钱 vs 赚大钱逻辑、大碗理论、与庄共舞」；`framework-extraction.md:129` 也把它列在「场景1」。而 `trading-psychology.md:127-131` 把它放在「空头思维」下但只有 3 条 bullet。同一素材在 knowledge/ 内归属三个不同模块。

10. **「活跃市值」除阈值外还有一层本质论述** — `indicators.md:125-130` 有 2026-04-06 直播核心：「活跃市值的每一次跳动，本质都是钱与筹码的双向流动，也是市场财富的再分配过程」，并给出 2014-2015 杠杆牛市案例（16000 → 18 万 → 跌回原位）。`framework-extraction.md:338` 也收录该句。超出清单 D22 的「±2.3%/±4% 阈值」范围。

11. **`thresholds.md` 是最密集的数值落点** — 该文件 307 行内集中了 B1/B2/B3 量化标准（`:84-110`）、活跃市值（`:160-165,299-300`）、KDJ钩（`:100,303`）、B2涨幅（`:302`）、四块砖（`:239-246`）、换手率（`:229-236`），是 30 条概念中数值口径的主要出处。

12. **`key-candles.md` 的 3 条核心规则含一条明确的否证边界** — `key-candles.md:44`：「关键 K 对港股意义不大（没有涨跌停限制），T+1 A 股专用」；`key-candles.md:46`：「前面有向下关键 K（放量大阴）的，后面 B1 大概率熄火」。即关键K 理论自带适用市场边界与失效条件。
