#!/usr/bin/env python3
"""
砖型图序列原语测试（02 号 ticket v2 §6.5 / F1 交付）

核心是「回归锚点」：序列末值必须等于既有的单点函数值，
且必须用 >=12 根 K 线（n<12 时 calculate_brick_value 提前返回 0，锚点不成立）。
"""

import pytest

from modules.indicators.core import DailyData
from modules.indicators.price_patterns.brick import (
    BRICK_GREEN,
    BRICK_RED,
    BRICK_YELLOW,
    brick_color_at,
    calculate_brick_colors,
    calculate_brick_series,
    calculate_brick_value,
    calculate_brick_history,
    detect_four_brick_system,
)


# ---------------------------------------------------------------- 测试数据

def _mk(closes, highs=None, lows=None):
    """由收盘价序列构造 DailyData 列表（可选指定 high/low）。"""
    out = []
    for i, c in enumerate(closes):
        h = highs[i] if highs else c * 1.01
        l = lows[i] if lows else c * 0.99
        out.append(DailyData(
            ts_code="600519.SH",
            trade_date=f"2025{i // 21 + 1:02d}{i % 21 + 1:02d}",
            open=c * 0.995, high=h, low=l, close=c,
            vol=10000.0, amount=1.0e7, pct_chg=0.0, prev_close=c * 0.995,
        ))
    return out


def _wave(n=120, base=100.0, amp=8.0, period=20):
    """正弦波动价格，保证 high/low 有区分度且不出现 hhv==llv。"""
    import math
    return [base + amp * math.sin(2 * math.pi * i / period) for i in range(n)]


# ---------------------------------------------------------------- 锚点测试

class TestAnchor:
    """★ 最关键：序列末值 == 单点值（n >= 12）"""

    @pytest.mark.parametrize("n", [12, 13, 20, 60, 120, 250])
    def test_last_equals_single_point(self, n):
        k = _mk(_wave(n))
        series = calculate_brick_series(k)
        assert len(series) == n
        assert series[-1] == calculate_brick_value(k), (
            f"锚点失败 n={n}: series[-1]={series[-1]} value={calculate_brick_value(k)}"
        )

    def test_anchor_holds_on_uptrend(self):
        from tests.conftest import generate_uptrend_klines
        rows = generate_uptrend_klines(n=120)
        k = [DailyData(**{f: r[f] for f in DailyData.__dataclass_fields__ if f in r})
             for r in rows]
        assert calculate_brick_series(k)[-1] == calculate_brick_value(k)

    def test_anchor_breaks_below_12(self):
        """⚠️ 记录已知边界：n<12 时锚点【不】成立（单点函数提前返回 0）"""
        for n in (4, 8, 11):
            k = _mk(_wave(n))
            assert calculate_brick_value(k) == 0          # 提前返回
            s = calculate_brick_series(k)
            # 序列在 n>=4 时已产出真值，故末值可能非 0
            assert len(s) == n
            assert s[:3] == [None, None, None]


# ---------------------------------------------------------------- 结构测试

class TestStructure:

    def test_length_matches_input(self):
        for n in (0, 1, 3, 4, 5, 12, 100):
            k = _mk(_wave(max(n, 0))) if n else []
            assert len(calculate_brick_series(k)) == n

    def test_first_three_are_none(self):
        k = _mk(_wave(30))
        assert calculate_brick_series(k)[:3] == [None, None, None]

    def test_values_are_non_negative(self):
        """砖型图 = IF(VAR6A>4, VAR6A-4, 0) → 恒 >= 0"""
        s = calculate_brick_series(_mk(_wave(120)))
        for v in s[3:]:
            assert v is not None and v >= 0

    def test_short_input_all_none(self):
        for n in (1, 2, 3):
            assert calculate_brick_series(_mk(_wave(n))) == [None] * n

    def test_empty(self):
        assert calculate_brick_series([]) == []


# ---------------------------------------------------------------- 数值测试

class TestNumeric:

    def test_flat_price_uses_50_fallback(self):
        """
        4 日内 high==low（一字板/停牌式平坦）时的行为，与单点函数保持一致。

        ⚠️ 实测发现（期望值随实现走，非凭空假设）：
          rng==0 → VAR3A 取 50.0、VAR1A 取 -90.0（沿用 calculate_brick_value 口径）
          → VAR4A/VAR5A = 50/150，VAR2A = 10 → VAR6A = 140 → 砖值 = **136.0**
        即**平坦价格产生异常高的砖值 136**，而非 0。这是既有实现的既定行为
        （本函数与之一致），但意味着**红绿判定在平坦区间会失真**，探测器层需注意
        （对应 02 v2 §七-13「0/0 除零分支」与停牌/一字板问题）。
        """
        n = 20
        k = _mk([100.0] * n, highs=[100.0] * n, lows=[100.0] * n)
        s = calculate_brick_series(k)
        assert s[-1] == calculate_brick_value(k)     # ★ 与单点函数一致（锚点）
        assert s[-1] == 136.0, f"平坦价格实测砖值 = {s[-1]}，与既定口径不符"

    def test_monotonic_up_gives_small_values(self):
        """单边上涨：VAR1A→0、VAR3A→100，砖值应稳定且非负"""
        n = 60
        closes = [100.0 * (1.01 ** i) for i in range(n)]
        s = calculate_brick_series(_mk(closes))
        assert all(v is not None for v in s[3:])
        assert all(v >= 0 for v in s[3:])

    def test_deterministic(self):
        k = _mk(_wave(80))
        assert calculate_brick_series(k) == calculate_brick_series(k)

    def test_matches_prefix_recompute_for_tail(self):
        """尾部应与「前缀重算」一致（i>=11 区间）"""
        k = _mk(_wave(60))
        s = calculate_brick_series(k)
        for i in (11, 20, 40, 59):
            assert s[i] == calculate_brick_value(k[: i + 1]), f"i={i} 与前缀重算不一致"


# ---------------------------------------------------------------- 性能测试

class TestPerformance:

    def test_linear_scale(self):
        """O(n)：250 根的耗时不应是 120 根的 8 倍以上（O(n³) 会是）"""
        import time
        k1 = _mk(_wave(120))
        k2 = _mk(_wave(250))

        t = time.perf_counter()
        for _ in range(20):
            calculate_brick_series(k1)
        d1 = time.perf_counter() - t

        t = time.perf_counter()
        for _ in range(20):
            calculate_brick_series(k2)
        d2 = time.perf_counter() - t

        ratio = d2 / d1 if d1 > 0 else 1.0
        assert ratio < 4.0, f"疑似非线性：n=250/n=120 耗时比 {ratio:.2f}"


# ---------------------------------------------------------------- 与既有函数共存

class TestCoexistence:
    """未改造的既有函数必须保持可调用（本次只新增，不改行为）"""

    def test_existing_functions_still_work(self):
        k = _mk(_wave(30))
        assert callable(calculate_brick_value)
        assert calculate_brick_history(k)[0] in ("RED", "GREEN", "NEUTRAL")
        assert isinstance(detect_four_brick_system(k), dict)


# ---------------------------------------------------------------- 砖色三态（2026-09-12 新增）

class TestBrickColors:
    """砖色三态：-1 绿 / 0 黄(★砖买入转折点) / +1 红

    依据：9 张砖型图参考图的十字线（信号日）**9/9 全部落在转折点**上
    （``brick[i] >= brick[i-1] and brick[i-1] < brick[i-2]``），
    而软件把该转折点画成**黄色**；此前后端只产 ±1，黄砖数学上不可达。
    """

    def test_constants(self):
        assert (BRICK_GREEN, BRICK_YELLOW, BRICK_RED) == (-1, 0, 1)

    def test_yellow_is_the_turn_point(self):
        """由降转升的第一根 = 黄（砖买入）"""
        s = [None, 10.0, 8.0, 9.0, 9.5]
        c = calculate_brick_colors(s)
        assert c[3] == BRICK_YELLOW, "转折点必须是黄"
        assert c[4] == BRICK_RED, "转折点之后继续升 → 红"

    def test_green_on_decline(self):
        s = [None, 10.0, 9.0, 8.0]
        c = calculate_brick_colors(s)
        assert c[2] == BRICK_GREEN and c[3] == BRICK_GREEN

    def test_no_yellow_without_a_prior_decline(self):
        """单调上升序列不应出现黄砖"""
        s = [None] + [float(i) for i in range(1, 12)]
        c = calculate_brick_colors(s)
        assert BRICK_YELLOW not in c

    def test_none_alignment(self):
        """砖值未定义处颜色也必须是 None，且长度对齐"""
        s = [None, None, None, 5.0, 6.0]
        c = calculate_brick_colors(s)
        assert len(c) == len(s)
        assert c[:3] == [None, None, None]

    def test_default_red_at_series_head(self):
        """序列头部（无前值可比）沿用旧行为：默认红"""
        s = [None, 5.0, 6.0]
        assert brick_color_at(s, 1) == BRICK_RED

    def test_yellow_iff_turn_point_on_real_series(self):
        """黄 ⟺ 转折点，在全序列上逐点校验"""
        s = calculate_brick_series(_mk(_wave(120)))
        c = calculate_brick_colors(s)
        checked = 0
        for i in range(2, len(s)):
            if s[i] is None or s[i - 1] is None or s[i - 2] is None:
                continue
            checked += 1
            is_turn = s[i] >= s[i - 1] and s[i - 1] < s[i - 2]
            assert (c[i] == BRICK_YELLOW) == is_turn, f"i={i} 与转折点定义不符"
        assert checked > 100, f"校验点太少（{checked}），测试没意义"
