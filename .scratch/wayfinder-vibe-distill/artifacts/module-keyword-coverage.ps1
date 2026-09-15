#!/usr/bin/env pwsh
# 关键词级覆盖对比：语料 vs knowledge/（01 号 ticket 重做）
# 输入：module-lexicon.tsv（UTF-8 无 BOM，用 -Encoding UTF8 显式读）
# 输出：module-keyword-coverage.tsv + 控制台表

$ErrorActionPreference = 'Stop'
$Base      = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts'
$Corpus    = 'E:\Z哥逐字稿'
$Knowledge = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\knowledge'

$lex = Import-Csv (Join-Path $Base 'module-lexicon.tsv') -Delimiter "`t" -Encoding UTF8

# 预读语料：每场次合并 notes
$sessText = @{}
foreach ($d in (Get-ChildItem $Corpus -Directory | Sort-Object Name)) {
    $t = ''
    foreach ($n in (Get-ChildItem $d.FullName -Recurse -File -Filter 'notes.md' -ErrorAction SilentlyContinue)) {
        $t += (Get-Content $n.FullName -Raw -Encoding UTF8) + "`n"
    }
    if (-not [string]::IsNullOrWhiteSpace($t)) { $sessText[$d.Name] = $t }
}

# 预读 knowledge
$knowText = @{}
foreach ($f in (Get-ChildItem $Knowledge -Recurse -File -Filter '*.md' | Sort-Object FullName)) {
    $knowText[$f.FullName.Replace("$Knowledge\",'')] = (Get-Content $f.FullName -Raw -Encoding UTF8)
}

$rows = @()
foreach ($e in $lex) {
    $cHits = 0; $cSess = 0; $sessList = @()
    foreach ($k in $sessText.Keys) {
        $c = ([regex]::Matches($sessText[$k], $e.Pattern)).Count
        if ($c -gt 0) { $cHits += $c; $cSess++; $sessList += $k }
    }
    $kHits = 0; $kFiles = @()
    foreach ($k in $knowText.Keys) {
        $c = ([regex]::Matches($knowText[$k], $e.Pattern)).Count
        if ($c -gt 0) { $kHits += $c; $kFiles += $k }
    }
    $verdict = if ($cHits -eq 0) { '语料无' }
               elseif ($kHits -eq 0) { '★缺失' }
               elseif ($kFiles.Count -le 2) { '薄弱' }
               else { '已覆盖' }
    $rows += [pscustomobject]@{
        Code=$e.Code; Module=$e.Module; Label=$e.Label
        CorpusSessions=$cSess; CorpusHits=$cHits
        KnowFiles=$kFiles.Count; KnowHits=$kHits
        Verdict=$verdict
        KnowList=($kFiles -join '; ')
        CorpusList=($sessList -join '; ')
    }
}
$rows | Export-Csv (Join-Path $Base 'module-keyword-coverage.tsv') -Delimiter "`t" -NoTypeInformation -Encoding UTF8

Write-Output '=== ★缺失（语料有、knowledge 零命中）==='
$rows | Where-Object Verdict -eq '★缺失' | Sort-Object Code, Label |
  Select-Object Code, Label, CorpusSessions, CorpusHits | Format-Table -AutoSize | Out-String -Width 120

Write-Output '=== 薄弱（knowledge 仅 1-2 篇命中）==='
$rows | Where-Object Verdict -eq '薄弱' | Sort-Object Code, Label |
  Select-Object Code, Label, CorpusSessions, CorpusHits, KnowHits, KnowList | Format-Table -AutoSize | Out-String -Width 200

Write-Output '=== 判定统计 ==='
$rows | Group-Object Verdict | Select-Object Name, Count | Format-Table -AutoSize | Out-String -Width 80

