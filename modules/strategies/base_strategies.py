from typing import Optional
from ..indicators import DailyData
from .core import StrategyType, StrategySignal, Priority, Action, _get_kdj, _get_bbi, _ensure_daily_klines
from modules.self_optimizer.param_registry import get_active_param


def _safe_num(val, default=0):
    """Return val if it's a real number, otherwise default."""
    return val if val is not None else default


def detect_b1(klines: list[DailyData], index: int, kirin_context: dict | None = None) -> StrategySignal | None:
    """
    检测 B1 买点（已升级 MDC 多维验证 + 麒麟阶段背景）

    B1 核心条件：
    1. J < 13（三档结构见下）
    2. 缩量回调（最佳）
    3. 非绿砖状态（连续下跌 < 4天）

    J 值三档结构（2026-09-12 裁决，语料 [1006] 回放1 01:43:08「往下打到十三以下都算是B一」）：
    - J < 13   ：B1 入场门槛（含负值），本函数 default
    - J <= -10 ：质量优选档（负值区更佳，不再是入场硬门槛）
    - J < -13  ：两天复合战法专用（见 compound_strategies.detect_changan），语义不同

    MDC 加分项：
    - 价格处于麒麟会“吸筹”阶段 (+20%)
    - 价格处于麒麟会“回落”阶段末期 (+10%)
    - 处于“派发”阶段 (-30%, 一票否决)
    - 价格触及或低于布林下轨 (+15%)
    - 主力大单净流入为正 (+10%)
    - RSI6 < 20 (极度超卖, +10%)
    - ADX 高位动能竭尽 (+10%)
    - MACD 0轴之下底背离 (+15%)
    """
    if index < 10:
        return None

    klines = _ensure_daily_klines(klines)
    today = klines[index]

    k, d, j = _get_kdj(klines, index)

    # 1. 核心条件判断（参数可被 self-optimizer 覆盖）
    #    默认 +13 = B1 入场门槛（语料口径：J 打到十三以下都算 B1，含负值）
    #    J <= -10 为质量优选档，不再是硬门槛；J < -13 归两天复合战法
    j_threshold = get_active_param("b1", "j_threshold", 13)
    if j >= j_threshold:  # J 必须低于 threshold（默认 +13）
        return None

    # 检查是否在连续下跌中（绿砖状态）
    recent_4 = klines[index - 3 : index + 1]
    yin_count = sum(1 for k in recent_4 if k.is_yinxian)
    green_brick_limit = get_active_param("b1", "green_brick_limit", 4)
    if yin_count >= green_brick_limit:
        return None

    # 2. 基础置信度
    is_suoliang = today.is_suoliang
    confidence = 0.5 + (0.1 if is_suoliang else 0)

    mdc_details = []

    # 3. 麒麟阶段背景验证 (Contextual Validation)
    if kirin_context:
        stage = kirin_context.get("stage")
        if stage == "吸筹":
            confidence += 0.20
            mdc_details.append("处于主力吸筹期(高安全)")
        elif stage == "回落":
            confidence += 0.10
            mdc_details.append("处于回落寻底期")
        elif stage == "派发":
            confidence -= 0.30  # 处于派发阶段的 B1 极度危险
            mdc_details.append("处于主力派发期(高风险)")

    # 4. MDC 验证 - 布林带 (超跌验证)
    boll_lower = getattr(today, "boll_lower", None)
    if boll_lower and today.close <= boll_lower * 1.02:
        confidence += 0.15
        mdc_details.append("触及布林下轨(超跌)")

    # 5. MDC 验证 - 资金流 (主力意图)
    large_inflow = getattr(today, "large_inflow", None)
    large_outflow = getattr(today, "large_outflow", None)
    if _safe_num(large_inflow) > _safe_num(large_outflow):
        confidence += 0.10
        mdc_details.append("主力大单净流入")

    # 6. MDC 验证 - RSI (极端超卖，参数可被覆盖)
    rsi6_ceiling = get_active_param("b1", "rsi6_ceiling", 25)
    rsi6 = getattr(today, "rsi6", None)
    if (rsi6 or 50) < rsi6_ceiling:
        confidence += 0.05
        mdc_details.append("RSI极端超卖")

    # 7. MDC 验证 - DMI (趋势动能，参数可被覆盖)
    adx_floor = get_active_param("b1", "adx_floor", 40)
    adx = getattr(today, "adx", None)
    if _safe_num(adx) > adx_floor:
        confidence += 0.10
        mdc_details.append(f"ADX高位动能竭尽({_safe_num(adx):.1f})")

    # 8. MDC 验证 - MACD 0轴之下底背离 (中期动能衰竭+反转信号)
    # detect_divergence 已保证 min_dif < 0（0轴之下），直接使用即可
    if getattr(today, "is_bottom_divergence", False):
        confidence += 0.15
        mdc_details.append("MACD0轴下底背离(反转确认)")

    confidence = max(0.1, min(confidence, 0.98))

    return StrategySignal(
        ts_code=today.ts_code,
        trade_date=today.trade_date,
        strategy=StrategyType.B1,
        confidence=round(confidence, 2),
        description=f"B1买点 J={j:.2f} " + ", ".join(mdc_details),
        details={
            "j": j,
            "k": k,
            "d": d,
            "is_suoliang": is_suoliang,
            "yin_count_4": yin_count,
            "price": today.close,
            "mdc": mdc_details,
            "kirin_stage": kirin_context.get("stage") if kirin_context else None,
        },
        action=Action.BUY.value,
        stop_loss=today.low,
        priority=Priority.OPPORTUNITY,
    )


def detect_b2(klines: list[DailyData], index: int, kirin_context: dict | None = None) -> StrategySignal | None:
    """
    检测 B2 买点（已升级 MDC 多维验证 + 麒麟阶段背景）

    .. deprecated::
        v4.3+ 推荐使用 :func:`modules.strategies.b1_b2_confirm.is_b2_signal` + 配套
        :class:`~modules.strategies.b1_b2_confirm.B1B2Config` + 回测入口
        ``zt backtest b2-confirm``。本函数保留仅用于向后兼容(被 5 个 wiring 点引用,
        见 modules/strategies/__init__.py:135、modules/screener/criteria.py:110、
        modules/backtest/portfolio.py:25、modules/loop_engine_enhanced.py:100),
        行为差异:本函数 B1 lookback 5-15 天硬编码 + 依赖麒麟阶段 + MDC 加分;
        新函数 B1 lookback 3-5 天可配 + 忽略麒麟阶段 + 无 MDC。
        新旧函数对同一只股票同一天会输出不同信号 — 选哪条路径用
        ``zt backtest multi``(旧) vs ``zt backtest b2-confirm``(新)。

    B2 条件（B1后的确认信号）：
    1. 前几日有B1（J < -10，即"质量优选档"；注意此处**不是** B1 入场门槛 +13）
    2. 放量长阳（涨幅>=4%）
    3. J值拐头（>-10）

    关于条件 1 的门槛（有意与 B1 入场门槛解耦）：
    B1 入场门槛放宽到 J < 13 后，B2 的 B1 回看门槛**保持 -10 不变**（可由
    ``get_active_param("b2", "confirm_j_threshold", -10)`` 覆盖）。理由：
      a) B2 的语义是"B1 深跌后放量确认"，第 1 天必须深跌；+13 会让"回看窗口内
         存在 B1"几乎恒真（实测 11301 个 (票,日) 中 has_b1 从 1230 → 6965），
         B2 将退化成"放量长阳 + J<55"，失去确认意义；
      b) 实测把该门槛放宽到 +13 会让 B2 信号从 22 → 156（约 7x），远超本次裁决范围。
    实测：仅放宽 B1 入场门槛时 B2 信号数 22 → 22（不变），确认两者无耦合副作用。

    MDC 加分项：
    - 处于麒麟会“拉升”阶段 (+20%)
    - 处于麒麟会“吸筹”末期突破 (+10%)
    - 处于麒麟会“派发”阶段 (-40%, 高位诱多)
    - 有效突破布林中轨 (+15%)
    - 主力大单强力净流入比例高 (+15%)
    - DMI 趋势金叉 (+10%)
    - 布林开口向上 (+10%)
    """
    if index < 15:
        return None

    klines = _ensure_daily_klines(klines)
    today = klines[index]
    yesterday = klines[index - 1]

    # 1. 核心条件：检查是否有B1在前几日
    #    门槛保持 -10（质量优选档）而非 B1 入场门槛 +13 —— 理由见上方 docstring。
    #    参数化以便回测/自优化可调；默认值刻意维持 -10 = 改动前行为。
    confirm_j_threshold = get_active_param("b2", "confirm_j_threshold", -10)
    has_b1 = False
    for i in range(5, min(15, index)):
        pk, pd, pj = _get_kdj(klines, index - i)
        if pj < confirm_j_threshold:
            has_b1 = True
            break

    if not has_b1:
        return None

    # 放量长阳
    is_beidou = today.is_beidou
    pct_chg = today.pct_chg
    b2_min_pct = get_active_param("b2", "min_pct", 4.0)
    is_long_yang = pct_chg >= b2_min_pct

    if not (is_long_yang and is_beidou):
        return None

    # 2. 基础置信度
    k, d, j = _get_kdj(klines, index)
    confidence = 0.60
    mdc_details = []

    # 3. 麒麟阶段背景验证
    if kirin_context:
        stage = kirin_context.get("stage")
        if stage == "拉升":
            confidence += 0.20
            mdc_details.append("处于主力拉升期(顺势)")
        elif stage == "吸筹":
            confidence += 0.10
            mdc_details.append("处于吸筹突破期")
        elif stage == "派发":
            confidence -= 0.40  # 派发阶段的假突破非常多
            mdc_details.append("处于主力派发期(假突破风险)")

    # 4. MDC 验证 - 布林带 (突破验证)
    boll_mid_today = getattr(today, "boll_mid", None)
    boll_mid_yesterday = getattr(yesterday, "boll_mid", None)
    if boll_mid_today and boll_mid_yesterday and yesterday.close < boll_mid_yesterday and today.close > boll_mid_today:
        confidence += 0.15
        mdc_details.append("突破布林中轨(走强)")

    boll_upper_today = getattr(today, "boll_upper", None)
    boll_lower_today = getattr(today, "boll_lower", None)
    boll_upper_yesterday = getattr(yesterday, "boll_upper", None)
    boll_lower_yesterday = getattr(yesterday, "boll_lower", None)
    if boll_upper_today and boll_lower_today and boll_upper_yesterday and boll_lower_yesterday:
        # 简单判断开口：width 增加
        today_width = (boll_upper_today - boll_lower_today) / boll_mid_today if boll_mid_today else 0
        prev_width = (boll_upper_yesterday - boll_lower_yesterday) / boll_mid_yesterday if boll_mid_yesterday else 0
        if today_width > prev_width * 1.05:
            confidence += 0.05
            mdc_details.append("布林开口向上")

    # 5. MDC 验证 - 资金流 (强力买入)
    total_amount = today.amount
    large_inflow = getattr(today, "large_inflow", 0)
    large_outflow = getattr(today, "large_outflow", 0)
    net_inflow = large_inflow - large_outflow
    if net_inflow > 0 and total_amount > 0:
        inflow_ratio = net_inflow / total_amount
        if _safe_num(inflow_ratio, 0) > 0.05:
            confidence += 0.15
            mdc_details.append(f"主力大单强力净流入({inflow_ratio * 100:.1f}%)")

    # 6. MDC 验证 - DMI (金叉验证)
    dmi_plus_today = getattr(today, "dmi_plus", None)
    dmi_minus_today = getattr(today, "dmi_minus", None)
    dmi_plus_yesterday = getattr(yesterday, "dmi_plus", None)
    dmi_minus_yesterday = getattr(yesterday, "dmi_minus", None)
    if dmi_plus_today and dmi_minus_today and dmi_plus_yesterday and dmi_minus_yesterday:
        if _safe_num(dmi_plus_yesterday) < _safe_num(dmi_minus_yesterday) and _safe_num(dmi_plus_today) > _safe_num(
            dmi_minus_today
        ):
            confidence += 0.10
            mdc_details.append("DMI趋势金叉")

    confidence = max(0.1, min(confidence, 0.98))

    return StrategySignal(
        ts_code=today.ts_code,
        trade_date=today.trade_date,
        strategy=StrategyType.B2,
        confidence=round(confidence, 2),
        description=f"B2确认 涨{pct_chg:.2f}% " + ", ".join(mdc_details),
        details={
            "j": j,
            "pct_chg": pct_chg,
            "is_beidou": is_beidou,
            "price": today.close,
            "mdc": mdc_details,
            "kirin_stage": kirin_context.get("stage") if kirin_context else None,
        },
        action=Action.BUY.value,
        stop_loss=today.low,
        priority=Priority.OPPORTUNITY,
    )


def detect_b3(klines: list[DailyData], index: int) -> StrategySignal | None:
    """
    检测 B3 中继买点

    B3 条件：
    1. B2后出现
    2. 分歧转一致（小阳线）
    3. 涨幅<2%
    4. 振幅<7%
    """
    if index < 20:
        return None

    klines = _ensure_daily_klines(klines)
    today = klines[index]

    # 检查前几日是否有B2
    has_b2 = False
    for i in range(3, min(10, index)):
        if klines[index - i].pct_chg >= 4 and klines[index - i].is_beidou:
            has_b2 = True
            break

    if not has_b2:
        return None

    # B3：小阳线，分歧转一致
    pct_chg = today.pct_chg
    amplitude = (today.high - today.low) / today.prev_close * 100

    if not (0 < pct_chg < 2 and amplitude < 7):
        return None

    return StrategySignal(
        ts_code=today.ts_code,
        trade_date=today.trade_date,
        strategy=StrategyType.B3,
        confidence=0.7,
        description=f"B3中继 涨{pct_chg:.2f}% 振幅{amplitude:.2f}%",
        details={
            "pct_chg": pct_chg,
            "amplitude": amplitude,
            "price": today.close,
        },
        action=Action.BUY.value,
        stop_loss=today.low,
        priority=Priority.OPPORTUNITY,
    )


def detect_sb1(klines: list[DailyData], index: int) -> StrategySignal | None:
    """
    检测超级B1

    超级B1条件：
    1. 缩量回调到极致
    2. 突然放量下跌（震仓）
    3. 继续缩量企稳
    4. J出现负值
    """
    if index < 10:
        return None

    klines = _ensure_daily_klines(klines)
    today = klines[index]
    prev_1 = klines[index - 1] if index >= 1 else None

    prev_2 = klines[index - 2] if index >= 2 else None

    if not (prev_1 and prev_2):
        return None

    # 检查前2天是否有放量下跌
    is_drop_vol = prev_2.close < prev_2.open and prev_2.vol > klines[index - 3].vol * 1.5

    if not is_drop_vol:
        return None

    # 今日缩量企稳
    is_suoliang = today.is_suoliang

    # J值
    k, d, j = _get_kdj(klines, index)

    sb1_j_threshold = get_active_param("sb1", "j_negative_threshold", -5)
    if j >= sb1_j_threshold:
        return None

    # 超级B1确认
    stop_loss = prev_2.low

    return StrategySignal(
        ts_code=today.ts_code,
        trade_date=today.trade_date,
        strategy=StrategyType.SB1,
        confidence=0.9,
        description=f"超级B1 J={j:.2f} 放量跌后缩量企稳",
        details={
            "j": j,
            "drop_vol": prev_2.vol,
            "is_suoliang": is_suoliang,
            "price": today.close,
        },
        action=Action.BUY.value,
        stop_loss=stop_loss,
        priority=Priority.OPPORTUNITY,
    )
