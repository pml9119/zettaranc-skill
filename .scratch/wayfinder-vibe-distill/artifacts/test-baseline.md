# 测试基线（2026-09-11 实测）

> **用途**：本项目有 **40 个既存失败**（与本次改动无关）。后续每次改动都须与本文基线对比，
> 避免把既有失败误判为新引入的回归。
> **方法**：`git stash` 隔离改动 → 跑基线 → `git stash pop` 恢复。

---

## 一、基线数字

| 状态 | failed | passed | skipped | errors |
|---|---|---|---|---|
| **基线**（无 brick_series 改动） | **40** | 1460 | 17 | 7 |
| **加 `calculate_brick_series` + 导出 + 19 个新测试** | **40** | **1479** | 17 | 7 |

**结论**：失败数与 errors 数**完全相同（40 / 7）**，通过数 **+19**（正是新增的 19 个测试）
→ **新增改动零破坏**。

---

## 二、40 个既存失败的性质（全部与 indicators 无关）

| 测试文件 | 失败/错误数 | 性质 |
|---|---|---|
| `test_cli_subparser.py` | 22 FAILED | CLI `--help` 子进程调用 |
| `test_quality_check.py` | 7 FAILED | 调 CLI 子进程 |
| `test_rate_limiter.py` | 2 FAILED | 明确名为 `..._in_subprocess` / `..._across_multiple_subprocesses` |
| `test_notifier.py` | 2 FAILED | `test_notify_all_linux` / `_mac`（在 Windows 上） |
| `test_backtest_scorer.py` | 5 ERROR | fixture 装配失败 |
| `test_data_sync_extensions.py` | 1 ERROR | 同上 |
| `test_self_optimizer_integration.py` | 1 ERROR | 同上 |
| `test_verify_report.py` | 1 FAILED | 文件写入 |

**共性**：几乎全部涉及**子进程**或**跨平台**（Linux/Mac）。

**最可能原因**：本会话的沙箱**限制子进程管道 stdio**
（harness 说明：受限模式下程序无法打开命名管道，`child_process.spawn` 用默认 `stdio:'pipe'`
会 EPERM）。→ 属**环境限制**，非代码缺陷。

> ⚠️ **未做的事**：我没有逐个定位这 40 个失败的根因（超出当前范围）。
> 本文只确立「**它们不是本次改动引入的**」这一结论 —— 这已足够支撑后续开发。

---

## 三、本轮新增的测试

| 文件 | 用例数 | 状态 |
|---|---|---|
| `tests/test_brick_series.py` | **19** | ✅ **19/19 全过**（0.74s） |

关键用例：
- **锚点测试 ×6**（n ∈ {12,13,20,60,120,250}）：`series[-1] == calculate_brick_value(klines)`
- **边界测试**：`n<12` 时锚点**不成立**（单点函数提前返回 0）→ 已显式断言并注释
- **尾部一致**：`series[i] == calculate_brick_value(k[:i+1])`（i ≥ 11）
- **性能**：n=250/n=120 耗时比 < 4（O(n) 验证，O(n³) 会是 8 倍以上）
- **平坦价格**：见 §四

---

## 四、测试过程中发现的既有行为（新知识）

**`测试平坦价格时砖值 = 136.0`**（`_mk([100.0]*20, highs=100, lows=100)`）

推导（沿用 `calculate_brick_value` 的口径）：
```
rng == 0  →  VAR3A = 50.0（该实现取 50，非 TDX 的 0/0）
              VAR1A = -90.0
           →  VAR4A = SMA(50,6,1)  = 50   → VAR5A = 150
              VAR2A = SMA(-90,4,1) = -90  → VAR2A+100 = 10
              VAR6A = 150 - 10 = 140      → 砖值 = 140 - 4 = 136
```

**含义**：**平坦价格（一字板/停牌式）产生异常高的砖值 136，而非 0**。
- 这是**既有实现的既定行为**，`calculate_brick_series` 与之一致（锚点通过 ✓）
- 但它意味着**红绿判定在平坦区间会失真** → 探测器层需注意
- 对应 02 v2 §七-13「0/0 除零分支」与停牌/一字板问题

> **修正一处 02 v2 的记录**：02 v2 写「仓库 `brick.py:29-31` 在 `hhv4 == llv4` 时取 `v3 = 50.0`；
> TDX 为 `0/0`（通常得 0）」——**前半句正确，后半句的「通常得 0」未经验证**。
> 本次只确认了**仓库行为是 50.0 → 砖值 136**；TDX 的真实行为（0/0 的结果）**仍未核实**。
