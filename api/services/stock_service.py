"""股票分析服务 — 封装 modules 层的分析逻辑"""

import logging
import time
from typing import Any, Callable, TypeVar

logger = logging.getLogger(__name__)

_T = TypeVar("_T")

# ── 响应级 TTL 缓存（5 分钟）──
# 个股分析的计算链（战法识别/诊断/评分/序列计算）较重，
# 前端每 60s 轮询 + 页面切换会反复触发，用 (ts_code, days) 维度缓存摊薄。
_CACHE_TTL = 300  # 秒


def _cache_get_or_compute(
    cache: dict[tuple[str, int], tuple[float, _T]], key: tuple[str, int], compute: Callable[[], _T]
) -> _T:
    """TTL 缓存：命中且在有效期内直接返回，否则重算并写入"""
    now = time.monotonic()
    hit = cache.get(key)
    if hit is not None and now - hit[0] < _CACHE_TTL:
        return hit[1]
    value = compute()
    cache[key] = (now, value)
    return value


_full_analysis_cache: dict[tuple[str, int], tuple[float, dict[str, Any]]] = {}
_kline_chart_cache: dict[tuple[str, int], tuple[float, dict[str, Any]]] = {}
_signals_cache: dict[tuple[str, int], tuple[float, list[dict]]] = {}


def _get_cached_signals(ts_code: str, days: int) -> list[dict]:
    """
    战法信号缓存：/analyze 与 /klines 两个端点共享，避免同一次页面加载重复检测。

    信号检测（30+ 战法逐日管线）是响应耗时大头，而页面只展示最近 20 个信号、
    图表标注最多 30 个——检测窗口固定取 min(days, 120)，
    避免 250/500 日周期切换时信号检测随 days 线性放大。
    """
    return _cache_get_or_compute(_signals_cache, (ts_code, days), lambda: _detect_signals(ts_code, min(days, 120)))


def _detect_signals(ts_code: str, days: int) -> list[dict]:
    from modules.strategies import detect_all_strategies

    try:
        signals = detect_all_strategies(ts_code, days=days)
    except Exception:
        logger.exception("策略信号检测失败: %s", ts_code)
        signals = []
    return _build_signals(signals)


def get_full_analysis(ts_code: str, days: int = 120) -> dict[str, Any]:
    """
    全量分析：指标 + 三波 + 麒麟会 + 战法信号 + 诊断 + 评分
    复刻 modules/cli.py 的 _analyze_core() 逻辑，返回结构化 dict
    """
    from modules.indicators import analyze_stock, detect_three_waves, detect_kirin_stage
    from modules.indicators.data_layer import get_kline_data, DailyData
    from modules.strategies import detect_all_strategies
    from modules.portfolio_diagnosis import diagnose_stock
    from modules.screener import analyze_stock as screener_analyze

    # 1. 指标分析
    result = analyze_stock(ts_code, days=days)

    # 1.1 取最近 K 线，计算真实的 prev_close 和当日涨跌幅
    prev_close = 0.0
    pct_chg = 0.0
    try:
        from modules.indicators.data_layer import get_kline_data as _gl
        klines_for_pct = _gl(ts_code, days=5)
        if klines_for_pct and len(klines_for_pct) >= 2:
            prev_close = klines_for_pct[-2].close
            pct_chg = getattr(klines_for_pct[-1], "pct_chg", 0.0) or 0.0
        elif klines_for_pct:
            prev_close = klines_for_pct[-1].close
    except Exception:
        logger.warning("获取 prev_close 失败: %s", ts_code, exc_info=True)

    # 2. 三波 + 麒麟会
    wave_data = None
    kirin_data = None
    try:
        klines = get_kline_data(ts_code, days=days)
        if klines:
            daily_klines = []
            for i, k in enumerate(klines):
                prev_close = klines[i - 1].close if i > 0 else k.close
                daily_klines.append(DailyData(
                    ts_code=k.ts_code, trade_date=k.trade_date,
                    open=k.open, high=k.high, low=k.low, close=k.close,
                    vol=k.vol, amount=k.amount, pct_chg=k.pct_chg,
                    prev_close=prev_close,
                ))
            wave_data = detect_three_waves(daily_klines)
            kirin_data = detect_kirin_stage(daily_klines)
    except Exception:
        logger.warning("三波/麒麟会分析失败: %s", ts_code, exc_info=True)

    # 3. 策略信号（共享缓存，/klines 端点复用同一份结果）
    signals = _get_cached_signals(ts_code, days)

    # 4. 诊断
    diagnosis = diagnose_stock(ts_code, days=days)

    # 5. 评分
    score = screener_analyze(ts_code)

    # ── 组装响应 ──
    return {
        "ts_code": ts_code,
        "name": getattr(diagnosis, "name", ts_code),
        "industry": _get_stock_industry(ts_code),
        "price": getattr(diagnosis, "price", 0),
        "prev_close": prev_close,
        "pct_chg": pct_chg,
        "trade_date": result.trade_date,
        "indicators": _build_indicators(result, diagnosis),
        "waves": _build_waves(wave_data),
        "kirin": _build_kirin(kirin_data),
        "signals": signals,
        "score": _build_score(score),
        "diagnosis": _build_diagnosis(diagnosis),
    }


def get_kline_chart_data(ts_code: str, days: int = 120) -> dict[str, Any]:
    """获取 K 线图表数据（ECharts 列式格式）"""
    from modules.indicators.data_layer import get_kline_data
    from modules.indicators.core import (
        calculate_ma, calculate_bbi, calculate_bollinger,
        calculate_kdj, calculate_macd,
    )
    from modules.indicators.price_patterns import (
        calculate_zg_white, calculate_dg_yellow,
    )
    from modules.strategies import detect_all_strategies

    # 多取历史数据用于指标计算（黄线需要 114 天 MA114）
    # 展示最近 days 天，但用更多历史数据计算指标
    extra_days = max(days + 130, 250)
    all_klines = get_kline_data(ts_code, days=extra_days)
    if not all_klines:
        return {"ts_code": ts_code, "dates": [], "ohlc": [], "volumes": [],
                "pct_chgs": [], "overlays": {}, "signal_markers": [],
                "kdj": {"k": [], "d": [], "j": []}, "macd": {"dif": [], "dea": [], "hist": []}}

    # 只取最近 days 天用于展示
    klines = all_klines[-days:]
    if not klines:
        return {"ts_code": ts_code, "dates": [], "ohlc": [], "volumes": [],
                "pct_chgs": [], "overlays": {}, "signal_markers": [],
                "kdj": {"k": [], "d": [], "j": []}, "macd": {"dif": [], "dea": [], "hist": []}}

    # 获取股票名称
    name = _get_stock_name(ts_code)

    dates = []
    ohlc = []
    volumes = []
    pct_chgs = []
    closes = []
    highs = []
    lows = []
    opens = []

    for k in klines:
        dates.append(k.trade_date)
        ohlc.append([k.open, k.close, k.low, k.high])
        volumes.append(k.vol)
        pct_chgs.append(k.pct_chg)
        closes.append(k.close)
        highs.append(k.high)
        lows.append(k.low)
        opens.append(k.open)

    # 计算叠加指标（全部在全量历史数据上计算，避免短周期档位左侧预热空白）
    n = len(closes)
    overlays: dict[str, list[float | None]] = {}

    # 全量收盘价序列（用于预热计算）
    all_closes = [k.close for k in all_klines]
    all_highs = [k.high for k in all_klines]
    all_lows = [k.low for k in all_klines]
    m_total = len(all_closes)
    offset = m_total - n  # 全量索引 → 窗口索引的偏移

    def slice_window(full: list[float | None]) -> list[float | None]:
        """全量序列截取为窗口（右侧 n 个）；数据不足时右对齐补 None"""
        if offset >= len(full):
            return full
        if offset > 0:
            return full[offset:]
        # 全量比窗口短：右对齐，前面补 None
        return [None] * (-offset) + full

    # MA5/10/20/60（全量计算后截取）
    for period, key in [(5, "ma5"), (10, "ma10"), (20, "ma20"), (60, "ma60")]:
        ma_full: list[float | None] = [None] * m_total
        for i in range(period - 1, m_total):
            ma_full[i] = round(sum(all_closes[i - period + 1:i + 1]) / period, 2)
        overlays[key] = slice_window(ma_full)

    # MA6（通达信主图紫线）+ MA24 分段（绿/青）
    ma6_full: list[float | None] = [None] * m_total
    for i in range(5, m_total):
        ma6_full[i] = round(sum(all_closes[i - 5:i + 1]) / 6, 2)
    overlays["ma6"] = slice_window(ma6_full)

    ma24_full: list[float | None] = [None] * m_total
    for i in range(23, m_total):
        ma24_full[i] = round(sum(all_closes[i - 23:i + 1]) / 24, 2)
    ma24_green_full: list[float | None] = [None] * m_total
    ma24_cyan_full: list[float | None] = [None] * m_total
    for i in range(23, m_total):
        v = ma24_full[i]
        b = (all_closes[i] - v) / v * 100 if v else 0
        if b < 0:
            ma24_green_full[i] = v
        elif b < 5:
            ma24_cyan_full[i] = v
    overlays["ma24_green"] = slice_window(ma24_green_full)
    overlays["ma24_cyan"] = slice_window(ma24_cyan_full)

    # BBI（全量计算后截取）
    bbi_full: list[float | None] = [None] * m_total
    for i in range(23, m_total):
        ma3 = sum(all_closes[i - 2:i + 1]) / 3
        ma6 = sum(all_closes[i - 5:i + 1]) / 6
        ma12 = sum(all_closes[i - 11:i + 1]) / 12
        ma24 = sum(all_closes[i - 23:i + 1]) / 24
        bbi_full[i] = round((ma3 + ma6 + ma12 + ma24) / 4, 2)
    overlays["bbi"] = slice_window(bbi_full)

    # 布林带（全量计算后截取）
    boll_mid_full: list[float | None] = [None] * m_total
    boll_upper_full: list[float | None] = [None] * m_total
    boll_lower_full: list[float | None] = [None] * m_total
    for i in range(19, m_total):
        window = all_closes[i - 19:i + 1]
        mid = sum(window) / 20
        std = (sum((x - mid) ** 2 for x in window) / 20) ** 0.5
        boll_mid_full[i] = round(mid, 2)
        boll_upper_full[i] = round(mid + 2 * std, 2)
        boll_lower_full[i] = round(mid - 2 * std, 2)
    overlays["boll_mid"] = slice_window(boll_mid_full)
    overlays["boll_upper"] = slice_window(boll_upper_full)
    overlays["boll_lower"] = slice_window(boll_lower_full)

    # 白线 / 黄线（双线战法）——O(n) 全序列一次性递推，替代逐点 O(n²) 重算
    try:
        from modules.indicators.price_patterns import (
            calculate_zg_white_series, calculate_dg_yellow_series,
        )
        white_full: list[float] = calculate_zg_white_series(all_klines)
        yellow_full: list[float] = calculate_dg_yellow_series(all_klines)
        overlays["white_line"] = [round(v, 2) if v else None for v in slice_window(white_full)]
        overlays["yellow_line"] = [round(v, 2) if v else None for v in slice_window(yellow_full)]
    except Exception:
        logger.warning("白线/黄线计算失败: %s", ts_code, exc_info=True)
        overlays["white_line"] = [None] * n
        overlays["yellow_line"] = [None] * n

    # ── KDJ 时间序列 ── 用全量历史数据计算
    kdj_k: list[float | None] = [None] * n
    kdj_d: list[float | None] = [None] * n
    kdj_j: list[float | None] = [None] * n
    try:
        from modules.indicators.core import precompute_kdj_sequence
        kdj_full = precompute_kdj_sequence(all_klines)
        # 截取最后 days 天
        for i, (k_val, d_val, j_val) in enumerate(kdj_full[-days:]):
            kdj_k[i] = round(k_val, 2)
            kdj_d[i] = round(d_val, 2)
            kdj_j[i] = round(j_val, 2)
    except Exception:
        for i in range(8, n):
            low9 = min(lows[i - 8:i + 1])
            high9 = max(highs[i - 8:i + 1])
            rsv = 50 if high9 == low9 else (closes[i] - low9) / (high9 - low9) * 100
            k_val = 50 if i == 8 else (kdj_k[i - 1] or 50) * 2 / 3 + rsv / 3
            d_val = 50 if i == 8 else (kdj_d[i - 1] or 50) * 2 / 3 + k_val / 3
            j_val = 3 * k_val - 2 * d_val
            kdj_k[i] = round(k_val, 2)
            kdj_d[i] = round(d_val, 2)
            kdj_j[i] = round(j_val, 2)

    # ── MACD 时间序列 ── 用全量历史数据计算
    macd_dif: list[float | None] = [None] * n
    macd_dea: list[float | None] = [None] * n
    macd_hist: list[float | None] = [None] * n
    try:
        from modules.indicators.core import precompute_macd_sequence
        dif_full, dea_full, macd_full = precompute_macd_sequence(all_klines)
        for i in range(n):
            idx = len(all_klines) - days + i
            if dif_full[idx] is not None:
                macd_dif[i] = round(dif_full[idx], 4)
            if dea_full[idx] is not None:
                macd_dea[i] = round(dea_full[idx], 4)
            if macd_full[idx] is not None:
                macd_hist[i] = round(macd_full[idx] * 2, 4)
    except Exception:
        pass

    # ─ 砖型图时间序列
    brick_values: list[float | None] = [None] * n
    brick_colors: list[int | None] = [None] * n
    try:
        from modules.indicators.price_patterns import calculate_brick_value
        for i in range(n):
            idx = len(all_klines) - days + i
            sub_klines = all_klines[:idx + 1]
            try:
                val = calculate_brick_value(sub_klines)
                brick_values[i] = round(val, 2) if val else None
                # 判断红绿：大于等于前一天为红(1)，小于为绿(-1)
                if i > 0 and brick_values[i] is not None and brick_values[i - 1] is not None:
                    brick_colors[i] = 1 if brick_values[i] >= brick_values[i - 1] else -1
                else:
                    brick_colors[i] = 1 # 默认红色
            except Exception:
                pass
    except Exception:
        logger.warning("砖型图计算失败: %s", ts_code, exc_info=True)

    # 信号标注（走共享缓存，固定 min(days,120) 窗口，避免 250 日档位 O(n²) 重算）
    signal_markers = []
    try:
        signals = _get_cached_signals(ts_code, days)
        date_set = set(dates)
        for s in signals[:30]:  # 最多取 30 个信号
            if s.get("date") in date_set:
                signal_markers.append({
                    "date": s["date"],
                    "type": s.get("strategy", ""),
                    "price": s.get("price") or 0,
                    "action": s.get("action", ""),
                })
    except Exception:
        logger.warning("信号标注获取失败: %s", ts_code, exc_info=True)

    # ── 计算主力阶段序列与多空呼吸波 ──
    waves_sequence = []
    kirin_sequence = []
    raw_breathing = []

    try:
        from modules.indicators.wave_theory import detect_three_waves
        from modules.indicators.kirin_detector import detect_kirin_stage

        for i in range(days):
            idx = len(all_klines) - days + i
            sub_klines = all_klines[:idx+1]

            # 1. 三波理论阶段
            try:
                w_res = detect_three_waves(sub_klines)
                waves_sequence.append(w_res.get("wave", "未知"))
            except Exception:
                waves_sequence.append("未知")

            # 2. 麒麟会阶段
            try:
                k_res = detect_kirin_stage(sub_klines)
                kirin_sequence.append(k_res.get("stage", "未知"))
            except Exception:
                kirin_sequence.append("未知")

            # 3. 呼吸波原始分值
            if len(sub_klines) < 2:
                raw_breathing.append(0.0)
                continue

            today_bar = sub_klines[-1]
            prev_bar = sub_klines[-2]

            if prev_bar.vol <= 0:
                raw_breathing.append(0.0)
                continue

            vol_ratio = today_bar.vol / prev_bar.vol
            pct = today_bar.pct_chg if today_bar.pct_chg is not None else 0.0

            if pct > 0 and vol_ratio > 1:
                # 放量涨：呼气
                raw_breathing.append(min(vol_ratio - 1.0, 3.0))
            elif pct < 0 and vol_ratio < 1:
                # 缩量跌：吸气
                raw_breathing.append(-min((1.0 / vol_ratio) - 1.0, 3.0))
            elif pct < 0 and vol_ratio >= 1:
                # 放量跌：派发/恐慌
                raw_breathing.append(-0.5 * min(vol_ratio, 2.0))
            else:
                # 缩量涨（量价背离）
                raw_breathing.append(0.1)
    except Exception:
        logger.exception("计算主力阶段序列与多空呼吸波失败: %s", ts_code)
        waves_sequence = ["未知"] * days
        kirin_sequence = ["未知"] * days
        raw_breathing = [0.0] * days

    # 4. 对呼吸原始分值做 5 日平滑
    breathing_wave = []
    for i in range(len(raw_breathing)):
        start = max(0, i - 4)
        window = raw_breathing[start:i+1]
        avg = sum(window) / len(window)
        breathing_wave.append(round(avg, 2))

    # 换手率补源（2026-08-16）：daily_kline 无 turnover 字段，
    # 从 daily_valuation 按 (ts_code, trade_date) 左连补齐，供图表副图与统计卡显示。
    turnovers: list[float] = []
    if dates:
        try:
            from modules.database import get_connection
            with get_connection() as conn:
                conn.row_factory = __import__("sqlite3").Row
                rows = conn.execute(
                    "SELECT trade_date, turnover FROM daily_valuation "
                    "WHERE ts_code = ? AND trade_date >= ? AND trade_date <= ?",
                    (ts_code, dates[0], dates[-1]),
                ).fetchall()
            turnover_map = {r["trade_date"]: r["turnover"] for r in rows if r["turnover"]}
            if turnover_map:
                turnovers = [turnover_map.get(d, 0.0) for d in dates]
            else:
                turnovers = [0.0] * len(dates)
        except Exception:
            logger.warning("换手率补源失败 %s", ts_code, exc_info=True)
            turnovers = [0.0] * len(dates)
    else:
        turnovers = []

    # ── 逐日指标序列（供技术指标卡/评分卡/雷达随主图悬停联动）──
    # 各指标最大预热窗口（RSI/KDJ 递推收敛 + BBI 24 + DMI 滚动），
    # 超过后截断最近 WARMUP 根计算，避免逐日对增长前缀重算的 O(n²)
    indicator_series: dict[str, Any] = {
        "rsi": {"rsi6": [], "rsi12": [], "rsi24": []},
        "wr": {"wr5": [], "wr10": []},
        "vol_ratio": [],
        "dmi": {"plus": [], "minus": [], "adx": []},
        "sell_score": [],
        "score": {"total": [], "b1": [], "trend": [], "volume": [], "risk": [], "reasons": [], "warnings": []},
    }
    try:
        from modules.indicators import calculate_rsi_multi, calculate_wr_multi, calculate_vol_ratio
        from modules.indicators.price_patterns import calculate_dmi
        from modules.indicators.volume_patterns import calculate_sell_score
        from modules.screener.engine import analyze_stock as score_stock_engine

        WARMUP = 60
        SCORE_WINDOW = 150
        n_total = len(all_klines)
        for i in range(days):
            idx = n_total - days + i
            window = all_klines[max(0, idx + 1 - WARMUP): idx + 1]
            try:
                rsi6, rsi12, rsi24 = calculate_rsi_multi(window)
                wr5, wr10 = calculate_wr_multi(window)
                vr = calculate_vol_ratio(window)
                dmi_plus, dmi_minus, adx = calculate_dmi(window)
                sell_score, _, _ = calculate_sell_score(window)
            except Exception:
                rsi6 = rsi12 = rsi24 = wr5 = wr10 = vr = dmi_plus = dmi_minus = adx = None
                sell_score = None
            indicator_series["rsi"]["rsi6"].append(rsi6)
            indicator_series["rsi"]["rsi12"].append(rsi12)
            indicator_series["rsi"]["rsi24"].append(rsi24)
            indicator_series["wr"]["wr5"].append(wr5)
            indicator_series["wr"]["wr10"].append(wr10)
            indicator_series["vol_ratio"].append(vr)
            indicator_series["dmi"]["plus"].append(dmi_plus)
            indicator_series["dmi"]["minus"].append(dmi_minus)
            indicator_series["dmi"]["adx"].append(adx)
            indicator_series["sell_score"].append(sell_score)

            # 综合评分逐日序列（滑动窗口截断，供综合评分卡/雷达随悬停联动）
            score_window = all_klines[max(0, idx + 1 - SCORE_WINDOW): idx + 1]
            if len(score_window) >= 20:
                try:
                    sc = score_stock_engine(ts_code, score_window)
                    indicator_series["score"]["total"].append(round(sc.score, 1))
                    indicator_series["score"]["b1"].append(round(sc.b1_score, 1))
                    indicator_series["score"]["trend"].append(round(sc.trend_score, 1))
                    indicator_series["score"]["volume"].append(round(sc.volume_score, 1))
                    indicator_series["score"]["risk"].append(round(sc.risk_score, 1))
                    indicator_series["score"]["reasons"].append(list(sc.reasons))
                    indicator_series["score"]["warnings"].append(list(sc.warnings))
                except Exception:
                    for arr in indicator_series["score"].values():
                        arr.append(None)
            else:
                for arr in indicator_series["score"].values():
                    arr.append(None)
    except Exception:
        logger.warning("逐日指标序列计算失败: %s", ts_code, exc_info=True)
        indicator_series = {
            "rsi": {"rsi6": [], "rsi12": [], "rsi24": []},
            "wr": {"wr5": [], "wr10": []},
            "vol_ratio": [],
            "dmi": {"plus": [], "minus": [], "adx": []},
            "sell_score": [],
            "score": {"total": [], "b1": [], "trend": [], "volume": [], "risk": [], "reasons": [], "warnings": []},
        }

    return {
        "ts_code": ts_code,
        "name": name,
        "industry": _get_stock_industry(ts_code),
        "dates": dates,
        "ohlc": ohlc,
        "volumes": volumes,
        "turnovers": turnovers,
        "pct_chgs": pct_chgs,
        "overlays": overlays,
        "signal_markers": signal_markers,
        "kdj": {"k": kdj_k, "d": kdj_d, "j": kdj_j},
        "macd": {"dif": macd_dif, "dea": macd_dea, "hist": macd_hist},
        "brick": {"values": brick_values, "colors": brick_colors},
        "waves_sequence": waves_sequence,
        "kirin_sequence": kirin_sequence,
        "breathing_wave": breathing_wave,
        "indicator_series": indicator_series,
    }



def get_signals(ts_code: str, days: int = 120) -> list[dict]:
    """获取战法信号列表（共享缓存，启动时已由 analyze/klines 填充）"""
    return _get_cached_signals(ts_code, days)


def get_score(ts_code: str) -> dict:
    """获取综合评分"""
    from modules.screener import analyze_stock

    score = analyze_stock(ts_code)
    return _build_score(score)


# ── 内部辅助 ──

def _get_stock_name(ts_code: str) -> str:
    try:
        from modules.database import get_connection
        with get_connection() as conn:
            row = conn.execute(
                "SELECT name FROM stock_basic WHERE ts_code=?", (ts_code,)
            ).fetchone()
            if row:
                return row[0]
    except Exception:
        pass
    return ts_code


def _get_stock_industry(ts_code: str) -> str:
    """获取股票所属行业/地域板块（对应通达信 HYBLOCK/DYBLOCK 标注）"""
    try:
        from modules.database import get_connection
        with get_connection() as conn:
            row = conn.execute(
                "SELECT industry, area FROM stock_basic WHERE ts_code=?", (ts_code,)
            ).fetchone()
            if row:
                parts = [p for p in (row["industry"], row["area"]) if p]
                return " · ".join(parts)
    except Exception:
        pass
    return ""


def _build_indicators(result, diagnosis) -> dict:
    return {
        "kdj": {"k": result.k, "d": result.d, "j": result.j},
        "macd": {
            "dif": result.dif, "dea": result.dea, "hist": result.macd_hist,
            "veto": getattr(result, "macd_veto", False),
            "gold_cross": getattr(result, "macd_gold_cross", False),
            "dead_cross": getattr(result, "macd_dead_cross", False),
            "top_divergence": getattr(result, "is_top_divergence", False),
            "bottom_divergence": getattr(result, "is_bottom_divergence", False),
        },
        "bbi": result.bbi,
        "rsi": {"rsi6": result.rsi6, "rsi12": result.rsi12, "rsi24": result.rsi24},
        "bollinger": {
            "mid": result.boll_mid, "upper": result.boll_upper,
            "lower": result.boll_lower, "width": result.boll_width,
            "position": result.boll_position,
        },
        "ma": {
            "ma5": result.ma5, "ma10": result.ma10,
            "ma20": result.ma20, "ma60": result.ma60,
            "high_52w": result.high_52w, "high_52w_dist": result.high_52w_dist,
        },
        "wr": {"wr5": result.wr5, "wr10": result.wr10},
        "vol_ratio": result.vol_ratio,
        "double_line": {
            "white": result.zg_white, "yellow": result.dg_yellow,
            "is_gold_cross": result.is_gold_cross, "is_dead_cross": result.is_dead_cross,
        },
        "brick": {
            "value": result.brick_value, "trend": result.brick_trend,
            "count": result.brick_count, "trend_up": result.brick_trend_up,
            "is_fanbao": result.is_fanbao,
        },
        "dmi": {"plus": result.dmi_plus, "minus": result.dmi_minus, "adx": result.adx},
        "signal": result.signal.value if hasattr(result.signal, "value") else str(result.signal),
        "sell_score": result.sell_score,
        "sell_items": result.sell_items or {},
    }


def _build_waves(wave_data) -> dict | None:
    if not wave_data:
        return None
    return {
        "wave": wave_data.get("wave", "未知"),
        "confidence": wave_data.get("confidence", 0),
        "suggestion": wave_data.get("b1_suggestion", ""),
    }


def _build_kirin(kirin_data) -> dict | None:
    if not kirin_data:
        return None
    return {
        "phase": kirin_data.get("stage", "未知"),
        "sub_type": kirin_data.get("sub_type", "未知"),
        "confidence": kirin_data.get("confidence", 0),
        "operation": kirin_data.get("operation", ""),
    }


def _build_signals(signals) -> list[dict]:
    result = []
    priority_map = {3: "CRITICAL", 2: "OPPORTUNITY", 1: "OBSERVE"}
    for s in signals[:20]:
        p = s.priority
        if isinstance(p, int):
            p_name = priority_map.get(p, "OBSERVE")
        elif hasattr(p, "name"):
            p_name = p.name
        else:
            p_name = str(p)
        result.append({
            "strategy": s.strategy.value,
            "date": s.trade_date,
            "confidence": s.confidence,
            "action": s.action,
            "description": s.description,
            "priority": p_name,
            "target_price": s.target_price,
            "stop_loss": s.stop_loss,
        })
    return result


def _build_score(score) -> dict:
    return {
        "total": score.score,
        "b1_score": score.b1_score,
        "trend_score": score.trend_score,
        "volume_score": score.volume_score,
        "risk_score": score.risk_score,
        "rating": score.rating,
        "reasons": score.reasons,
        "warnings": score.warnings,
    }


def _build_diagnosis(diagnosis) -> dict:
    return {
        "price_position": getattr(diagnosis, "price_position", ""),
        "trend_status": getattr(diagnosis, "trend_status", ""),
        "sell_score": getattr(diagnosis, "sell_score", 0),
        "sell_score_desc": getattr(diagnosis, "sell_score_desc", ""),
        "kirin_phase": getattr(diagnosis, "kirin_phase", ""),
        "bull_rope": getattr(diagnosis, "bull_rope_status", ""),
        "sandglass_score": getattr(diagnosis, "sandglass_score", 0),
        "is_centipede": getattr(diagnosis, "is_centipede", False),
        "risk_level": getattr(diagnosis, "risk_level", "UNKNOWN"),
        "recommendation": getattr(diagnosis, "recommendation", ""),
    }
