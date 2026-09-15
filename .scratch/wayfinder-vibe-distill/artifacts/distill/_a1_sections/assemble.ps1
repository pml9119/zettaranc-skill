# A1 蒸馏批次 —— 段文件装配脚本（v2 重做）
# 用途：把 _a1_sections/sNN-*.md 逐段文件按主题合并为 A1-B2系列.md / A1-关键K.md / A1-沉舟千帆.md
# 规则：段文件内所有 markdown 标题降一级；段文件首个 H1 变成主题文件下的 H2。

$ErrorActionPreference = "Stop"
$base = "D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill"
$sec  = Join-Path $base "_a1_sections"

function Convert-Section([string]$path) {
  $lines = Get-Content $path -Encoding UTF8
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($l in $lines) {
    if ($l -match '^(#{1,5})(\s+.*)$') { $out.Add('#' + $l) } else { $out.Add($l) }
  }
  return $out
}

function Build-Topic([string]$outFile, [string[]]$header, [string[]]$sectionFiles) {
  $buf = New-Object System.Collections.Generic.List[string]
  foreach ($h in $header) { $buf.Add($h) }
  foreach ($sf in $sectionFiles) {
    $p = Join-Path $sec $sf
    if (-not (Test-Path $p)) { Write-Output "!! 缺文件: $sf"; continue }
    $buf.Add("")
    $buf.Add("---")
    $buf.Add("")
    foreach ($l in (Convert-Section $p)) { $buf.Add($l) }
  }
  $dest = Join-Path $base $outFile
  [System.IO.File]::WriteAllLines($dest, $buf, (New-Object System.Text.UTF8Encoding($false)))
  Write-Output ("写出 {0} ： {1} 行" -f $outFile, $buf.Count)
}

$b2Header = @(
  '# A1 池 · B2 系列（三大买入法 / B2 买点案例精讲）',
  '',
  '> **模块归属**：M1 买点（B2 系列）；辅以 M4 理论武器库（倍量柱 / 长阴短柱 / 关键K 作为判断依据）。',
  '> **语料**：`20251006三大高爆发力的B2买入法（10.6晚八）` 4 段 + `20260107 B2买点案例精讲（周三晚八）` 3 段，共 7 段。',
  '> **读取规程（v2）**：`transcript.txt` 为主，`notes.md` **仅作定位索引**（先取小节标题+时间范围建导航表，跳过正文）；等级 = 「整篇推理稿」的段 **完全弃用 notes**。',
  '> **引文口径**：一律取自 transcript，格式 `回放N HH:MM:SS`（逐字稿行首时间戳）；notes 的分段区间不作为精确时间戳。未听清处照录原文并加〔〕，不静默改写。',
  '> **版本**：v2（重做版）。旧版存 `A1-B2系列-v1-superseded.md`。'
)

$kjHeader = @(
  '# A1 池 · 关键K（关键K的重要价值）',
  '',
  '> **模块归属**：M4 理论武器库（关键K）。',
  '> **语料**：`20251015关键K的重要价值（周三晚八）` 3 段。',
  '> **读取规程（v2）**：`transcript.txt` 为主，`notes.md` 仅作定位索引；回放3 的 notes 只有 2 小节 / 1.9KB（仅覆盖开头约 10 分钟），该段以 transcript 全文精读为准。',
  '> **引文口径**：一律取自 transcript，格式 `回放N HH:MM:SS`；未听清处照录并加〔〕。',
  '> **版本**：v2（重做版）。旧版存 `A1-关键K-v1-superseded.md`。'
)

$czHeader = @(
  '# A1 池 · 沉舟千帆（步步为营）',
  '',
  '> **模块归属**：M4 理论武器库（对称结构 / 关键K）+ M5 交易框架元认知（稳健进取、配置元原则）。',
  '> **语料**：`20251029沉舟千帆，步步为营。（周三晚八）` 3 段。',
  '> **读取规程（v2）**：`transcript.txt` 为主，`notes.md` 仅作定位索引（取小节标题+时间范围，跳过正文）。',
  '> **引文口径**：一律取自 transcript，格式 `回放N HH:MM:SS`；未听清处照录并加〔〕。',
  '> **版本**：v2（重做版）。旧版存 `A1-沉舟千帆-v1-superseded.md`。'
)

Build-Topic "A1-B2系列.md" $b2Header @(
  "s01-20251006-r1.md","s02-20251006-r2.md","s03-20251006-r3.md","s04-20251006-r4.md",
  "s05-20260107-r1.md","s06-20260107-r2.md","s07-20260107-r3.md")

Build-Topic "A1-关键K.md" $kjHeader @(
  "s08-20251015-r1.md","s09-20251015-r2.md","s10-20251015-r3.md")

Build-Topic "A1-沉舟千帆.md" $czHeader @(
  "s11-20251029-r1.md","s12-20251029-r2.md","s13-20251029-r3.md")
