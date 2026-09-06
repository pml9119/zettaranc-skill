
import sqlite3, os, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
os.chdir(r"D:/Users/pml/Desktop/ZK/zettaranc-skill")
db = "data/stock_data.db"
print("db exists:", os.path.exists(db), "size:", os.path.getsize(db) if os.path.exists(db) else 0)
c = sqlite3.connect(db)
cur = c.cursor()
print("--- tables ---")
for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table'"):
    print(" ", t[0])
print("--- daily_kline by ts_code ---")
for r in cur.execute("SELECT ts_code, COUNT(*), MIN(trade_date), MAX(trade_date) FROM daily_kline GROUP BY ts_code"):
    print(" ", r)
print("--- indicator_cache by ts_code ---")
for r in cur.execute("SELECT ts_code, COUNT(*), MAX(trade_date) FROM indicator_cache GROUP BY ts_code"):
    print(" ", r)
print("--- stock_basic ---")
try:
    for r in cur.execute("SELECT COUNT(*) FROM stock_basic"):
        print("  count:", r[0])
except Exception as e:
    print("  err:", e)
