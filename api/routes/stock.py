"""股票分析路由"""

import re

from fastapi import APIRouter, HTTPException, Query

from api.models.stock import (
    StockAnalysisResponse,
    KlineChartResponse,
    FullIndicatorResponse,
)
from api.services import stock_service

router = APIRouter()


@router.get("/search/all")
def search_stocks(
    q: str = Query("", description="股票代码或名称关键字（正则匹配，大小写不敏感）"),
    limit: int = Query(20, ge=1, le=100, description="最大返回数量"),
):
    """按代码或名称正则搜索股票（用于个股详情页搜索框）"""
    keyword = q.strip()
    if not keyword:
        return {"results": []}

    _REGEX_META = set(r".^$*+?{}[]|()\\")
    def _looks_like_regex(text: str) -> bool:
        return any(ch in _REGEX_META for ch in text)

    def _build_pattern(text: str) -> re.Pattern:
        if _looks_like_regex(text):
            try:
                return re.compile(text, re.IGNORECASE)
            except re.error:
                pass
        return re.compile(re.escape(text), re.IGNORECASE)

    code_prefix = keyword.split(".")[0]
    code_re = _build_pattern(code_prefix)
    name_re = _build_pattern(keyword)

    try:
        from modules.database import get_connection
        stocks = []
        with get_connection() as conn:
            conn.row_factory = __import__("sqlite3").Row
            rows = conn.execute(
                "SELECT ts_code, name, industry FROM stock_basic ORDER BY ts_code"
            ).fetchall()
            stocks = [dict(r) for r in rows]
    except Exception:
        stocks = []

    matched = []
    for s in stocks:
        ts_code = s.get("ts_code", "")
        name = s.get("name", "") or ""
        try:
            if code_re.search(ts_code) or name_re.search(name):
                matched.append(s)
        except re.error:
            pass
        if len(matched) >= limit:
            break

    return {"results": matched}


@router.get("/analyze/{ts_code}", response_model=StockAnalysisResponse)
def analyze_stock(ts_code: str, days: int = Query(default=120, ge=10, le=1000)):
    """全量分析：指标 + 战法 + 评分 + 诊断"""
    try:
        return stock_service.get_full_analysis(ts_code, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {e}")


@router.get("/analyze/{ts_code}/klines", response_model=KlineChartResponse)
def get_klines(ts_code: str, days: int = Query(default=120, ge=10, le=1000)):
    """获取 K 线图表数据（ECharts 列式格式）"""
    try:
        return stock_service.get_kline_chart_data(ts_code, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取 K 线失败: {e}")


@router.get("/analyze/{ts_code}/signals")
def get_signals(ts_code: str, days: int = Query(default=120, ge=10, le=1000)):
    """获取战法信号列表"""
    try:
        return stock_service.get_signals(ts_code, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取信号失败: {e}")


@router.get("/score/{ts_code}")
def get_score(ts_code: str):
    """获取综合评分"""
    try:
        return stock_service.get_score(ts_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取评分失败: {e}")
