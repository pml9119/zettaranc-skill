#!/usr/bin/env pwsh
# IDF 加权的模块 × 场次矩阵（01 号 ticket 重做 · 分簇用）
# 理由：原始命中数被「白线/黄线/出货/散户」等高频通用词拉偏；
#       改为「存在性 + IDF 权重」，让有区分度的术语主导归属。
#   score(session, module) = Σ idf(kw)  for kw present in session, kw ∈ module
#   idf(kw) = min(3.0, ln(N / df(kw)))   N=场次数, df=命中该词的场次数
# 输出：module-session-weighted.tsv + 主模块归属

$ErrorActionPreference = 'Stop'
$Base   = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts'
$Corpus = 'E:\Z哥逐字稿'

$lex = Import-Csv (Join-Path $Base 'module-lexicon.tsv') -Delimiter "`t" -Encoding UTF8
$mods = @('M0','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10')
$names= @{M0='择时';M1='买点';M2='止损与放飞';M3='卖点与破位';M4='理论武器库';
          M5='交易框架元认知';M6='心态与人性';M7='宏观产业板块';M8='复盘考试验收';
          M9='人设与闲聊';M10='人生职业商业'}

# 读语料
$sessText = [ordered]@{}
$sessSegs = @{}
foreach ($d in (Get-ChildItem $Corpus -Directory | Sort-Object Name)) {
    $t = ''
    foreach ($n in (Get-ChildItem $d.FullName -Recurse -File -Filter 'notes.md' -ErrorAction SilentlyContinue)) {
        $t += (Get-Content $n.FullName -Raw -Encoding UTF8) + "`n"
    }
    if (-not [string]::IsNullOrWhiteSpace($t)) {
        $sessText[$d.Name] = $t
        $sessSegs[$d.Name] = (Get-ChildItem $d.FullName -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
    }
}
$N = $sessText.Count

# 每个词的存在性
$present = @{}   # "session|label" -> bool
$df      = @{}   # label -> 场次数
foreach ($e in $lex) {
    $c = 0
    foreach ($s in $sessText.Keys) {
        if ([regex]::IsMatch($sessText[$s], $e.Pattern)) { $present["$s|$($e.Label)"] = $true; $c++ }
    }
    $df[$e.Label] = $c
}

$rows = @()
foreach ($s in $sessText.Keys) {
    $row = [ordered]@{ Session=$s; Date=($s -replace '^(\d{8}).*','$1'); Segs=$sessSegs[$s] }
    foreach ($m in $mods) { $row[$m] = 0.0 }
    foreach ($e in $lex) {
        if ($present["$s|$($e.Label)"]) {
            $d = $df[$e.Label]
            $idf = if ($d -le 0 -or $d -ge $N) { 0.0 } else { [Math]::Min(3.0, [Math]::Log($N / $d)) }
            $row[$e.Code] = [Math]::Round($row[$e.Code] + $idf, 2)
        }
    }
    $rows += [pscustomobject]$row
}
$rows | Export-Csv (Join-Path $Base 'module-session-weighted.tsv') -Delimiter "`t" -NoTypeInformation -Encoding UTF8

# 主模块归属
$assigned = foreach ($r in $rows) {
    $best=''; $bv=-1
    foreach ($m in $mods) { $v=[double]$r.$m; if ($v -gt $bv) { $bv=$v; $best=$m } }
    [pscustomobject]@{ Primary=$best; Session=$r.Session; Date=$r.Date; Segs=$r.Segs; Score=$bv }
}

Write-Output "N=$N 场次；IDF 加权矩阵已写出"
Write-Output ''
Write-Output '=== 各模块「主归属」场次数（IDF 加权）==='
$assigned | Group-Object Primary | Sort-Object Name | ForEach-Object {
    "{0,-4} {1,-14} {2,3} 场" -f $_.Name, $names[$_.Name], $_.Count
}
Write-Output ''
foreach ($g in ($assigned | Group-Object Primary | Sort-Object Name)) {
    Write-Output "--- $($g.Name) $($names[$g.Name]) ---"
    $g.Group | Sort-Object Session | ForEach-Object { "   [{0}] seg={1} score={2}  {3}" -f $_.Date,$_.Segs,$_.Score,$_.Session }
}

