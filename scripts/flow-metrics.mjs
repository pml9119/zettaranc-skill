#!/usr/bin/env node
// flow-metrics.mjs — cadence 的流动度量。
//
// 原理：每张票是一个 markdown 文件，`status:` 的每次变更都留在 git diff 里。
// 状态转换本身就是历史数据 —— 不需要额外遥测。历史仍然**只能**从 git 拿。
//
// **Backlog.md 融合**：仓库若装了 Backlog.md，还会把**本脚本对磁盘票文件的解析**
// 与 `backlog task list --json` 自己报的列分布做「来源核对」。
// 两者不一致 = 本脚本漏读了状态，这是最该被立刻发现的错。
// 注意比的是**磁盘当前态**而不是 git 历史：否则「建了票还没提交」会假报警。
//
// 用法（把 <工具目录> 换成该仓库约定的目录）：
//   node <工具目录>/flow-metrics.mjs                 # 文本报告
//   node <工具目录>/flow-metrics.mjs --json          # 结构化输出
//   node <工具目录>/flow-metrics.mjs --days 60       # 趋势窗口
//   node <工具目录>/flow-metrics.mjs --alert 3       # 待验收警报阈值（天）
//   node <工具目录>/flow-metrics.mjs --tracker backlog   # 显式指定票目录（可逗号分隔多个）
//   node <工具目录>/flow-metrics.mjs --no-crosscheck # 不读 backlog（无 CLI 时自动跳过）

import { execFileSync, execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const COLUMNS = ['fog', 'discovery', 'ready', 'building', 'verifying', 'done']
const LABEL = {
  fog: '迷雾', discovery: '发现', ready: '待开工',
  building: '进行中', verifying: '待验收', done: '已完成', other: '未识别',
}
const TRACKER_CANDIDATES = ['backlog', '.backlog', '.scratch', 'issues', 'tasks', 'docs/issues']

// 历史状态名 → 六列。认不出来的落进 other，不静默丢弃。
// 含 Backlog.md 的三个默认状态（To Do / In Progress / Done）——注意它们**带空格**。
const ALIASES = {
  resolved: 'done', complete: 'done', completed: 'done', closed: 'done', shipped: 'done',
  'to-do': 'ready', todo: 'ready', open: 'ready', 'ready-for-agent': 'ready', 'ready-for-afk': 'ready',
  'in-progress': 'building', inprogress: 'building', doing: 'building', wip: 'building', claimed: 'building', active: 'building',
  verify: 'verifying', verification: 'verifying', review: 'verifying', 'in-review': 'verifying', qa: 'verifying',
  triage: 'discovery', 'needs-triage': 'discovery', 'needs-info': 'discovery', 'ready-for-human': 'discovery',
  idea: 'fog', raw: 'fog', draft: 'fog',
}

// 必须带 `i`：Backlog.md 的 frontmatter 写的是**小写** `status:`，
// 而 markdown 票面常写 `**Status:**`。少了这个标志，Backlog 的票会从
// 历史解析里整批消失（周期时间/吞吐/aging/趋势全部算不出来）。
const STATUS_LINE = /^[ \t]*(?:\*\*|__)?Status:(?:\*\*|__)?[ \t]*(\S.*?)[ \t]*$/i
const STATUS_IN_FILE = new RegExp(STATUS_LINE.source, 'im')
const DAY = 86400000

// ---------- 参数 ----------

function parseArgs(argv) {
  const o = { json: false, days: 30, alert: 2, tracker: null, crosscheck: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') o.json = true
    else if (a === '--days') o.days = Number(argv[++i]) || 30
    else if (a === '--alert') o.alert = Number(argv[++i]) || 2
    else if (a === '--tracker') o.tracker = argv[++i]
    else if (a === '--no-crosscheck') o.crosscheck = false
    else if (a === '-h' || a === '--help') { printHelp(); process.exit(0) }
  }
  return o
}

function printHelp() {
  console.log(`flow-metrics — 从 git 历史算 cadence 的流动度量

  --json            结构化输出
  --days <n>        趋势窗口天数（默认 30）
  --alert <n>       待验收警报阈值天数（默认 2）
  --tracker <dir>   显式指定票所在目录（逗号可分隔多个）
  --no-crosscheck   不读 Backlog.md 的 --json 做来源核对
  -h, --help        显示本帮助`)
}

// ---------- git ----------

function git(args, cwd) {
  return execFileSync('git', ['-c', 'color.ui=never', ...args], {
    cwd, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function repoRoot() {
  try {
    return git(['rev-parse', '--show-toplevel'], process.cwd()).trim()
  } catch {
    return null
  }
}

// ---------- tracker 发现 ----------

function walk(dir, out = [], depth = 0) {
  if (depth > 6) return out
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name.startsWith('.git') || e.name === 'node_modules') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out, depth + 1)
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

function hasStatus(file) {
  try { return STATUS_IN_FILE.test(fs.readFileSync(file, 'utf8')) } catch { return false }
}

// 收集**所有**含票的候选目录。决策票（`.scratch/<effort>/issues/`，wayfinder）
// 与实现票（`backlog/tasks/`）可能并存，两者都要计入。
function findTrackers(root) {
  const found = []
  for (const d of TRACKER_CANDIDATES) {
    const abs = path.join(root, d)
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue
    if (walk(abs).some(hasStatus)) found.push(d)
  }
  return found
}

// ---------- 历史 ----------

function canonical(raw) {
  const s = String(raw || '').trim()
  const norm = (v) => v.toLowerCase().replace(/[\s_]+/g, '-').replace(/-+$/, '')
  // 1. 整值优先：处理**多词状态**（Backlog.md 的 `To Do` / `In Progress`），
  //    并剥掉括号注释（`resolved（v3 全量重做）`）。
  const full = norm(s.replace(/[（(].*$/, ''))
  if (COLUMNS.includes(full)) return full
  if (ALIASES[full]) return ALIASES[full]
  // 2. 回退首个 token：处理 `resolved v2（重做）` 这类首个词即状态的写法。
  const m = /^[A-Za-z][A-Za-z0-9_-]*/.exec(s)
  if (m) {
    const k = norm(m[0])
    if (COLUMNS.includes(k)) return k
    if (ALIASES[k]) return ALIASES[k]
  }
  return 'other'
}

// git 会把含非 ASCII 字节的路径 C 转义引用：
//   +++ "b/backlog/tasks/zt-1 - \345\256\236\346\265\213-VOL-...md"
// 不解引用，含中文文件名的票会被判成另一个票面（`startsWith('backlog/')` 为假），
// 而且「未提交」计数会假报警。
function unquoteGitPath(p) {
  if (!(p.startsWith('"') && p.endsWith('"'))) return p
  const inner = p.slice(1, -1)
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
  // 八进制还原出的是「字节」，再按 UTF-8 解码回真正的字符串。
  return Buffer.from(inner, 'latin1').toString('utf8')
}

// 一次 `git log -p` 拿全部时间线：解析补丁里新增的 `Status:` 行。
// 合并提交默认不带 diff，所以显式跳过（状态变更走合并是很罕见的做法）。
function allTimelines(root, trackerDirs) {
  let raw
  try {
    raw = git(['log', '--reverse', '--no-merges', '--format=@@@%H|%at', '-p', '--', ...trackerDirs], root)
  } catch {
    return new Map()
  }
  const timelines = new Map()
  let ts = 0
  let file = null
  for (const line of raw.split('\n')) {
    if (line.startsWith('@@@')) {
      const s = line.slice(3)
      const i = s.indexOf('|')
      ts = Number(s.slice(i + 1)) * 1000
      file = null
      continue
    }
    if (line.startsWith('+++ ') || line.startsWith('--- ')) {
      if (line.startsWith('+++ ')) {
        const p = unquoteGitPath(line.slice(4).trim())
        file = p === '/dev/null' ? null : p.replace(/^b\//, '')
      }
      continue
    }
    if (file === null || !line.startsWith('+')) continue
    const m = STATUS_LINE.exec(line.slice(1))
    if (!m) continue
    const st = canonical(m[1])
    const arr = timelines.get(file) || []
    if (arr.length && arr[arr.length - 1].status === st) continue
    arr.push({ status: st, ts })
    timelines.set(file, arr)
  }
  return timelines
}

// ---------- 分析 ----------

function statusAt(events, t) {
  let s = null
  for (const e of events) {
    if (e.ts <= t) s = e.status
    else break
  }
  return s
}

function pct(sorted, p) {
  if (!sorted.length) return null
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
  return sorted[i]
}

function weekStart(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // 周一为一周起点
  return d.getTime()
}

function isoDay(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function analyze(timelines, { days, alert, now }) {
  const tickets = []
  for (const [file, events] of timelines) {
    if (!events.length) continue
    const entered = new Map()
    for (const e of events) if (!entered.has(e.status)) entered.set(e.status, e.ts)
    tickets.push({ file, current: events[events.length - 1].status, entered, events })
  }

  const counts = {}
  for (const c of [...COLUMNS, 'other']) counts[c] = 0
  for (const t of tickets) counts[t.current] = (counts[t.current] || 0) + 1

  // 待验收积压：当前在 verifying 的票，按进入该列的时间算年龄
  const verifying = tickets
    .filter(t => t.current === 'verifying')
    .map(t => ({ file: t.file, days: (now - t.entered.get('verifying')) / DAY }))
    .sort((a, b) => b.days - a.days)

  // 周期时间：ready → done
  const cycles = []
  for (const t of tickets) {
    if (t.current !== 'done') continue
    const s = t.entered.get('ready')
    const e = t.entered.get('done')
    if (s == null || e == null || e < s) continue
    cycles.push((e - s) / DAY)
  }
  cycles.sort((a, b) => a - b)

  // 吞吐：每周完成数
  const doneTs = tickets.filter(t => t.current === 'done').map(t => t.entered.get('done')).filter(Boolean)
  const weeks = new Map()
  for (const ts of doneTs) {
    const w = weekStart(ts)
    weeks.set(w, (weeks.get(w) || 0) + 1)
  }
  const throughput = [...weeks.entries()].sort((a, b) => a[0] - b[0]).slice(-8)
    .map(([w, n]) => ({ week: isoDay(w), done: n }))

  // 待验收积压的周趋势 —— 这是校准并行上限的那个读数
  const backlog = []
  const start = weekStart(now - (days - 1) * DAY)
  for (let w = start; w <= now; w += 7 * DAY) {
    const at = Math.min(w + 7 * DAY - 1, now)
    const n = tickets.filter(t => statusAt(t.events, at) === 'verifying').length
    backlog.push({ week: isoDay(w), verifying: n })
  }

  // 完整 CFD（只在 --json 里给）
  const cfd = []
  for (let d = days - 1; d >= 0; d--) {
    const t = now - d * DAY
    const row = { date: isoDay(t) }
    for (const c of [...COLUMNS, 'other']) row[c] = 0
    for (const tk of tickets) {
      const s = statusAt(tk.events, t)
      if (s) row[s] = (row[s] || 0) + 1
    }
    cfd.push(row)
  }

  return {
    tickets: tickets.length,
    counts,
    verifying: {
      count: verifying.length,
      oldestDays: verifying.length ? Number(verifying[0].days.toFixed(1)) : 0,
      oldest: verifying.length ? verifying[0].file : null,
      overAlert: verifying.length > 0 && verifying[0].days > alert,
      alertDays: alert,
    },
    cycleTimeDays: {
      n: cycles.length,
      median: cycles.length ? Number(pct(cycles, 0.5).toFixed(1)) : null,
      p85: cycles.length ? Number(pct(cycles, 0.85).toFixed(1)) : null,
      max: cycles.length ? Number(cycles[cycles.length - 1].toFixed(1)) : null,
    },
    throughput,
    backlog,
    cfd,
  }
}

// ---------- Backlog.md 来源核对 ----------

// 读 `backlog task list --json`（版本化 schema）**只为了核对** git 推导的结果。
// 历史（周期时间 / aging / 趋势）拿不到 —— JSON 只给当前态。
function backlogCounts(root) {
  if (!fs.existsSync(path.join(root, 'backlog'))) return null
  let raw
  try {
    // 用 execSync 而非 execFileSync：Windows 上 `backlog` 是 .cmd/.ps1，
    // execFileSync 不做 PATHEXT 解析，会直接 ENOENT。
    raw = execSync('backlog task list --json', {
      cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null // 没装 CLI / 没初始化 / 查询失败 —— 静默跳过，不影响主功能
  }
  let doc
  try { doc = JSON.parse(raw) } catch { return null }
  if (!doc || doc.kind !== 'task-list' || !Array.isArray(doc.tasks)) return null
  const counts = {}
  for (const c of [...COLUMNS, 'other']) counts[c] = 0
  for (const t of doc.tasks) {
    const c = canonical(t.status)
    counts[c] = (counts[c] || 0) + 1
  }
  return { schemaVersion: doc.schemaVersion ?? null, total: doc.tasks.length, counts }
}

// 本脚本对同一批磁盘票文件的解析结果 —— 这才是被检验的一方。
function diskCounts(dir) {
  const counts = {}
  for (const c of [...COLUMNS, 'other']) counts[c] = 0
  let tickets = 0
  for (const f of walk(dir)) {
    let text
    try { text = fs.readFileSync(f, 'utf8') } catch { continue }
    const m = STATUS_IN_FILE.exec(text)
    if (!m) continue
    const c = canonical(m[1])
    counts[c] = (counts[c] || 0) + 1
    tickets++
  }
  return { counts, tickets }
}

// 只比 backlog/tasks/：`backlog doc` 与 `decision` 也带 status，但不在 task-list 里。
function backlogCrossCheck(root, timelines) {
  const tasksDir = path.join(root, 'backlog', 'tasks')
  if (!fs.existsSync(tasksDir)) return null
  const json = backlogCounts(root)
  if (!json) return null
  const mine = diskCounts(tasksDir)
  // 两边都是 0：没有可比的东西，不打这一行（否则空仓库多一行噪音）
  if (json.total === 0 && mine.tickets === 0) return null
  // 主指标（周期时间/积压趋势）只能从 git 历史算，所以**未提交的票对它是隐形的**。
  // 这不是 bug —— `implement` 的定义就要求提交。但差异必须说出来，不能被静默吞掉。
  const inGit = [...timelines.keys()].filter((f) => f.startsWith('backlog/')).length
  return { ...json, mine, inGit, uncommitted: Math.max(0, mine.tickets - inGit) }
}

// ---------- 输出 ----------

function render(rep, tracker, days, cross) {
  const L = []
  L.push(`cadence · 流动度量`)
  L.push(`tracker: ${tracker}   趋势窗口: ${days} 天   票数: ${rep.tickets}`)
  L.push('')

  L.push('当前分布' + (cross && cross.uncommitted > 0 ? '（已并入未提交的票）' : ''))
  L.push('  ' + [...COLUMNS, 'other']
    .filter(c => c !== 'other' || rep.counts.other > 0)
    .map(c => `${LABEL[c]} ${rep.counts[c] || 0}`)
    .join('   '))
  L.push('')

  if (cross) {
    const mine = cross.mine
    const keys = COLUMNS.filter((k) => (cross.counts[k] || 0) + (mine.counts[k] || 0) > 0)
    const show = (c) => keys.map((k) => `${LABEL[k]} ${c[k] || 0}`).join('  ')
    const same = COLUMNS.every((k) => (mine.counts[k] || 0) === (cross.counts[k] || 0))
    L.push(`来源核对（同一批磁盘文件 · Backlog schema v${cross.schemaVersion}，${cross.total} 张）`)
    L.push(same
      ? `  ✅ 本脚本与 Backlog 一致：${show(cross.counts)}`
      : `  ⚠️ 不一致 —— Backlog 报: ${show(cross.counts)}`)
    if (!same) {
      L.push(`     本脚本读到: ${show(mine.counts)}`)
      L.push('     解析器漏读了状态：查 ALIASES，或票文件被手改过')
    }
    if (cross.uncommitted > 0) {
      L.push(`     ⓘ 其中 ${cross.uncommitted} 张未提交到 git —— 不计入周期时间与积压趋势`)
    }
    L.push('')
  }

  const v = rep.verifying
  if (v.count === 0) {
    L.push('待验收  0 张 —— 顺畅')
  } else {
    const flag = v.overAlert ? '⚠' : '·'
    L.push(`待验收  ${v.count} 张，最老 ${v.oldestDays} 天   ${flag}`)
    L.push(`  ${v.oldest}`)
    if (v.overAlert) L.push(`  超过 ${v.alertDays} 天阈值 → 停止启动新 agent，只做验收`)
  }
  L.push('')

  const ct = rep.cycleTimeDays
  if (ct.n) {
    L.push(`周期时间 ready → done（n=${ct.n}）`)
    L.push(`  中位 ${ct.median} 天   p85 ${ct.p85} 天   最长 ${ct.max} 天`)
  } else {
    L.push('周期时间 还没有走完 ready → done 的票')
  }
  L.push('')

  if (rep.throughput.length) {
    L.push('吞吐（每周完成）')
    for (const r of rep.throughput) L.push(`  ${r.week}  ${'█'.repeat(r.done)} ${r.done}`)
    L.push('')
  }

  if (rep.backlog.length > 1) {
    L.push('待验收积压趋势（周）')
    for (const r of rep.backlog) {
      L.push(`  ${r.week}  ${'▓'.repeat(r.verifying)}${'·'.repeat(Math.max(0, 5 - r.verifying))} ${r.verifying}`)
    }
    L.push('')
    L.push('积压趋势比当前值更重要：它涨，说明 N 填大了。')
  }

  if (rep.counts.other > 0) {
    L.push('')
    L.push(`注意：${rep.counts.other} 张票的状态认不出来，落在「未识别」。`)
    L.push('把它们改成 fog/discovery/ready/building/verifying/done 之一，或写进脚本的 ALIASES。')
  }
  return L.join('\n')
}

// ---------- 主流程 ----------

function main() {
  const opt = parseArgs(process.argv.slice(2))

  const root = repoRoot()
  if (!root) {
    console.error('flow-metrics: 当前目录不是 git 仓库。度量依赖 git 历史。')
    process.exit(1)
  }

  const trackers = opt.tracker
    ? String(opt.tracker).split(',').map((s) => s.trim()).filter(Boolean)
    : findTrackers(root)
  if (!trackers.length) {
    console.error(`flow-metrics: 在 ${root} 下找不到票目录。`)
    console.error(`  找过：${TRACKER_CANDIDATES.join(', ')}`)
    console.error('  用 --tracker <dir> 显式指定（逗号可分隔多个）。')
    process.exit(1)
  }
  const tracker = trackers.join(' + ')

  const timelines = allTimelines(root, trackers)
  if (timelines.size === 0) {
    console.error(`flow-metrics: ${tracker} 的 git 历史里没有带 Status/status 行的票文件。`)
    process.exit(1)
  }

  const rep = analyze(timelines, { days: opt.days, alert: opt.alert, now: Date.now() })

  // 来源核对只对**同一个票面**有意义：只比 `backlog/tasks/`，
  // 绝不能拿 `.scratch` 的决策票去比 Backlog 的实现票（那必然不一致）。
  // 比的是磁盘当前态，不是 git 历史 —— 否则「建了票还没提交」会假报警。
  const cross = opt.crosscheck ? backlogCrossCheck(root, timelines) : null

  // 未提交的票对 git 历史是隐形的，但它们**确实存在**。不并进来，
  // 你刚建完的票在板上就看不见 —— 那板子就是在骗人。
  // （周期时间 / 吞吐 / 趋势仍只能来自 git，见 flow.md 的限制说明。）
  if (cross && cross.uncommitted > 0) {
    const other = new Map([...timelines].filter(([f]) => !f.startsWith('backlog/')))
    const o = other.size ? analyze(other, { days: 1, alert: opt.alert, now: Date.now() }) : null
    const base = o ? o.counts : Object.fromEntries([...COLUMNS, 'other'].map((c) => [c, 0]))
    const merged = {}
    for (const c of [...COLUMNS, 'other']) merged[c] = (base[c] || 0) + (cross.mine.counts[c] || 0)
    rep.counts = merged
    rep.tickets = (o ? o.tickets : 0) + cross.mine.tickets
  }

  if (opt.json) {
    console.log(JSON.stringify({
      tracker, trackers, window: opt.days, generatedAt: new Date().toISOString(),
      crossCheck: cross, ...rep,
    }, null, 2))
  } else {
    console.log(render(rep, tracker, opt.days, cross))
  }
}

main()
