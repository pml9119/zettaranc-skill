import { useState, useRef, useCallback } from 'react';
import { searchStocks } from '../../api/stock';
import type { StockSearchItem } from '../../api/types';

interface StockSearchInputProps {
  /** 选中股票时的回调（优先使用）；未提供时按 onNavigate 处理 */
  onSelect?: (tsCode: string, item: StockSearchItem) => void;
  /** 选中后跳转的回调（与 onSelect 二选一） */
  onNavigate?: (tsCode: string) => void;
  placeholder?: string;
  className?: string;
  /** 父组件传入的 ref，用于 ⌘K 聚焦 */
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** 搜索框尺寸：hero（大）/ compact（小） */
  size?: 'hero' | 'compact';
  /** 内部 form 的 id，供外部按钮通过 form={formId} 关联触发提交 */
  formId?: string;
  /** 搜索历史下拉（可选，传入历史数组 + 清除回调） */
  history?: string[];
  onHistoryPick?: (code: string) => void;
  onClearHistory?: () => void;
}

/** 输入类型正则判断（仅用于提示文案，不影响搜索逻辑） */
function detectInputKind(raw: string): 'code6' | 'codeFull' | 'cn' | 'regex' | 'other' {
  const s = raw.trim().toUpperCase();
  if (/[.*+?^${}()|[\]\\]/.test(s)) return 'regex';
  if (/^\d{6}$/.test(s)) return 'code6';
  if (/^\d{6}\.(SH|SZ|BJ)$/.test(s)) return 'codeFull';
  if (/[\u4e00-\u9fa5]/.test(raw)) return 'cn';
  return 'other';
}

export default function StockSearchInput({
  onSelect,
  onNavigate,
  placeholder = '输入 6 位代码、中文简称或正则，如 600487 / 茅台 / 600|300',
  className = '',
  inputRef,
  size = 'compact',
  formId,
  history = [],
  onHistoryPick,
  onClearHistory,
}: StockSearchInputProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<StockSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const innerRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 优先用父组件传入的 ref，否则用内部 ref
  const ref = inputRef ?? innerRef;

  // debounce 搜索
  const runSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchStocks(trimmed, 10)
      .then((items) => {
        setResults(items);
        setHighlight(items.length > 0 ? 0 : -1);
      })
      .catch(() => {
        setResults([]);
        setHighlight(-1);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setHistoryOpen(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!val.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    debounceTimer.current = setTimeout(() => runSearch(val), 280);
  };

  const fireSelect = (item: StockSearchItem) => {
    setInput('');
    setResults([]);
    setOpen(false);
    setHistoryOpen(false);
    if (onSelect) {
      onSelect(item.ts_code, item);
    } else if (onNavigate) {
      onNavigate(item.ts_code);
    }
  };

  // 输入完整 ts_code（如 600487.SH）时，Enter 直接跳转无需下拉
  const fireDirectNavigate = (raw: string) => {
    const kind = detectInputKind(raw);
    let tsCode = raw.trim().toUpperCase();
    if (kind === 'code6') {
      tsCode = tsCode.startsWith('6') ? `${tsCode}.SH` : `${tsCode}.SZ`;
    }
    if (kind === 'code6' || kind === 'codeFull') {
      setInput('');
      setResults([]);
      setOpen(false);
      setHistoryOpen(false);
      if (onSelect) {
        onSelect(tsCode, { ts_code: tsCode, name: '', industry: '' });
      } else if (onNavigate) {
        onNavigate(tsCode);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    // 优先：高亮候选
    if (highlight >= 0 && results[highlight]) {
      fireSelect(results[highlight]);
      return;
    }
    // 次选：有结果选第一个
    if (results.length > 0) {
      fireSelect(results[0]);
      return;
    }
    // 兜底：完整代码直接跳转
    fireDirectNavigate(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      fireSelect(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleFocus = () => {
    if (input.trim()) setOpen(true);
    else if (history.length > 0) setHistoryOpen(true);
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => {
      setOpen(false);
      setHistoryOpen(false);
    }, 160);
  };

  const kind = detectInputKind(input);
  const hintMap: Record<string, string> = {
    code6: '代码模式 · 将匹配前缀',
    codeFull: '完整代码 · Enter 直达',
    cn: '名称模式 · 模糊匹配中文',
    regex: '正则模式 · 匹配代码/名称',
    other: '输入 6 位代码或中文简称',
  };

  const sizeCls =
    size === 'hero'
      ? 'w-full rounded-xl border border-border/60 bg-bg-secondary/80 backdrop-blur-md px-5 py-4 text-base text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/70 focus:ring-4 focus:ring-accent-gold/10 transition-all shadow-xl'
      : 'w-full rounded border border-border bg-bg-primary px-3 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-gold transition-colors';

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative" id={formId}>
        <input
          ref={ref}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={sizeCls}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted animate-pulse">
            搜索中…
          </span>
        )}
      </form>

      {/* 搜索历史（仅在无输入且聚焦时） */}
      {historyOpen && !input.trim() && history.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-full rounded-md border border-border bg-bg-secondary shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-1.5 text-xs text-text-muted border-b border-border/40 flex items-center justify-between">
            <span>最近查询</span>
            {onClearHistory && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onClearHistory();
                }}
                className="text-text-muted hover:text-accent-red transition-colors"
              >
                清除
              </button>
            )}
          </div>
          {history.slice(0, 6).map((code) => (
            <button
              key={code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setHistoryOpen(false);
                if (onHistoryPick) onHistoryPick(code);
                else if (onNavigate) onNavigate(code);
              }}
              className="w-full text-left px-3 py-1.5 text-sm font-mono text-text-secondary hover:bg-bg-hover hover:text-accent-gold transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      )}

      {/* 搜索结果下拉 */}
      {open && input.trim() && (
        <div className="absolute top-full mt-1 left-0 w-full rounded-md border border-border bg-bg-secondary shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.length === 0 && !loading && (
            <div className="px-3 py-3 text-sm text-text-muted">
              无匹配结果 · <span className="text-text-secondary">{hintMap[kind]}</span>
            </div>
          )}
          {results.map((item, i) => (
            <button
              key={item.ts_code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                fireSelect(item);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                i === highlight ? 'bg-bg-hover' : 'hover:bg-bg-hover/60'
              }`}
            >
              <span className="font-mono text-sm text-accent-gold min-w-[88px]">{item.ts_code}</span>
              <span className="text-sm text-text-primary flex-1 truncate">{item.name || '--'}</span>
              {item.industry && (
                <span className="text-xs text-text-muted truncate max-w-[100px]">{item.industry}</span>
              )}
            </button>
          ))}
          {results.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] text-text-muted border-t border-border/40 bg-bg-primary/40">
              ↑↓ 选择 · Enter 确认 · Esc 关闭 · {hintMap[kind]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
