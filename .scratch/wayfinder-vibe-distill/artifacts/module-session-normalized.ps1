#!/usr/bin/env pwsh
# 归一化模块归属（01 号 ticket 重做 · 最终分簇口径）
# 问题：原始命中数被高频通用词拉偏；IDF 加权后又被「词汇表更宽的模块」通吃（M7 行业词多）。
# 修正：用「模块概念集覆盖率」= 命中关键词 IDF 之和 / 该模块全部关键词 IDF 之和。
#       含义：该场次讲到了本模块概念集的百分之多少 —— 与模块词汇表宽度无关。
# 输出：module-session-normalized.tsv + 主/次模块归属

$ErrorActionPreference = 'Stop'
$Base   = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts'
$Corpus = 'E:\Z哥逐字稿'

$lex = Import-Csv (Join-Path $Base 'module-lexicon.tsv') -Delimiter "`t" -Encoding UTF8
$mods = @('M0','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10')
$names= @{M0='择时';M1='买点';M2='止损与放飞';M3='卖点与破位';M4='理论武器库';
          M5='交易框架元认知';M6='心态与人性';M7='宏观产业板块';M8='复盘考试验收';
          M9='人设与闲聊';M10='人生职业商业'}

$sessText = [ordered]@{}; $sessSegs = @{}
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

# 存在性 + df
$present = @{}; $df = @{}
foreach ($e in $lex) {
    $c = 0
    foreach ($s in $sessText.Keys) { if ([regex]::IsMatch($sessText[$s], $e.Pattern)) { $present["$s|$($e.Label)"] = $true; $c++ } }
    $df[$e.Label] = $c
}
function Get-Idf($label) {
    $d = $df[$label]
    if ($d -le 0 -or $d -ge $N) { return 0.0 }
    return [Math]::Min(3.0, [Math]::Log($N / $d))
}

# 模块满分
$modMax = @{}
foreach ($m in $mods) {
    $s = 0.0
    foreach ($e in ($lex | Where-Object { $_.Code -eq $m })) { $s += (Get-Idf $e.Label) }
    $modMax[$m] = $s
}

# 归一化
$norm = @()
foreach ($s in $sessText.Keys) {
    $row = [ordered]@{ Session=$s; Date=($s -replace '^(\d{8}).*','$1'); Segs=$sessSegs[$s] }
    foreach ($m in $mods) { $row[$m] = 0.0 }
    foreach ($e in $lex) {
        if ($present["$s|$($e.Label)"]) { $row[$e.Code] = $row[$e.Code] + (Get-Idf $e.Label) }
    }
    foreach ($m in $mods) { if ($modMax[$m] -gt 0) { $row[$m] = [Math]::Round($row[$m] / $modMax[$m], 3) } }
    $norm += [pscustomobject]$row
}
$norm | Export-Csv (Join-Path $Base 'module-session-normalized.tsv') -Delimiter "`t" -NoTypeInformation -Encoding UTF8

# 主/次/三 模块
$assign = foreach ($r in $norm) {
    $rank = foreach ($m in $mods) { [pscustomobject]@{ M=$m; R=[double]$r.$m } }
    $top = $rank | Sort-Object R -Descending | Select-Object -First 3
    [pscustomobject]@{
        Session=$r.Session; Date=$r.Date; Segs=$r.Segs
        M1=$top[0].M; R1=$top[0].R; M2=$top[1].M; R2=$top[1].R; M3=$top[2].M; R3=$top[2].R
    }
}

Write-Output "=== 模块满分（概念集 IDF 总量）==="
foreach ($m in $mods) { "{0,-4} {1,-14} {2,6:N2}" -f $m, $names[$m], $modMax[$m] }
Write-Output ''
Write-Output '=== 主归属分布（归一化覆盖率 argmax）==='
$assign | Group-Object M1 | Sort-Object Name | ForEach-Object { "{0,-4} {1,-14} {2,3} 场" -f $_.Name, $names[$_.Name], $_.Count }
Write-Output ''
Write-Output '=== 每模块 TOP10 供给场次（覆盖率降序）==='
foreach ($m in $mods) {
    Write-Output "--- $m $($names[$m]) ---"
    $norm | Sort-Object { [double]$_.$m } -Descending | Select-Object -First 10 |
      ForEach-Object { "   {0,5:N2}  [{1}] seg={2}  {3}" -f [double]$_.$m, $_.Date, $_.Segs, $_.Session }
}
Write-Output ''
Write-Output '=== 场次 → top3 模块 ==='
$assign | Sort-Object Date | ForEach-Object {
    "   [{0}] {1,-4} {2,5:N2} | {3,-4} {4,5:N2} | {5,-4} {6,5:N2}   {7}" -f `
      $_.Date, $_.M1, $_.R1, $_.M2, $_.R2, $_.M3, $_.R3, $_.Session
}

