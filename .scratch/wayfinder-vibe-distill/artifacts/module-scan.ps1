#!/usr/bin/env pwsh
# 模块 × 语料 / 知识库 命中扫描（01 号 ticket 重做 · 可复现）
# 骨架来源：artifacts/module-framework-20260415.md（Z 哥 2026-04-15 官方模块总图）
# 用法：pwsh -File module-scan.ps1
# 输出：module-session-matrix.tsv / module-knowledge-matrix.tsv / module-hits-detail.tsv

$ErrorActionPreference = 'Stop'
$Corpus    = 'E:\Z哥逐字稿'
$Knowledge = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\knowledge'
$OutDir    = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts'

# ---- 词表：(模块代码, 模块名, 正则) ----
$lex = @(
  # M0 择时
  @('M0','择时','活跃市值'), @('M0','择时','多头区间'), @('M0','择时','空头区间'),
  @('M0','择时','只卖不买'), @('M0','择时','择时'), @('M0','择时','容错'),
  @('M0','择时','池子'), @('M0','择时','主线'), @('M0','择时','支线'),
  @('M0','择时','备胎'), @('M0','择时','答应'), @('M0','择时','卡两截'),
  @('M0','择时','空仓'), @('M0','择时','休息'),
  # M1 买点
  @('M1','买点','(?<!S)B1(?![0-9])'), @('M1','买点','(?<!S)B2(?![0-9])'), @('M1','买点','(?<!S)B3(?![0-9])'),
  @('M1','买点','B一'), @('M1','买点','B二'), @('M1','买点','B三'),
  @('M1','买点','单针下三十'), @('M1','买点','单针下二十'),
  @('M1','买点','砖形图'), @('M1','买点','砖型图'), @('M1','买点','专精图'),
  @('M1','买点','SB1'), @('M1','买点','SB一'), @('M1','买点','长安战法'), @('M1','买点','长安图'),
  @('M1','买点','第三定式'), @('M1','买点','买点'), @('M1','买点','上车'),
  # M2 止损与放飞
  @('M2','止损与放飞','止损'), @('M2','止损与放飞','放飞'), @('M2','止损与放飞','没涨'),
  @('M2','止损与放飞','赢转亏'), @('M2','止损与放飞','盈转亏'), @('M2','止损与放飞','止盈'),
  @('M2','止损与放飞','破平台'), @('M2','止损与放飞','前低'), @('M2','止损与放飞','中长阳'),
  @('M2','止损与放飞','减仓'), @('M2','止损与放飞','中阳线'), @('M2','止损与放飞','大阳线'),
  # M3 卖点与破位
  @('M3','卖点与破位','(?<![A-Za-z])S1(?![0-9])'), @('M3','卖点与破位','S一'),
  @('M3','卖点与破位','滴滴'), @('M3','卖点与破位','阶梯量'), @('M3','卖点与破位','破白线'),
  @('M3','卖点与破位','白线'), @('M3','卖点与破位','黄线'), @('M3','卖点与破位','击穿对手盘'),
  @('M3','卖点与破位','忍一根'), @('M3','卖点与破位','死叉'), @('M3','卖点与破位','假零'),
  @('M3','卖点与破位','贾玲'), @('M3','卖点与破位','出货'), @('M3','卖点与破位','逃顶'),
  @('M3','卖点与破位','卖飞'), @('M3','卖点与破位','牵牛绳'), @('M3','卖点与破位','五种出货'),
  # M4 理论武器库
  @('M4','理论武器库','关键K'), @('M4','理论武器库','暴力K'), @('M4','理论武器库','倍量柱'),
  @('M4','理论武器库','异动'), @('M4','理论武器库','四分之一量线'), @('M4','理论武器库','筹码'),
  @('M4','理论武器库','ABC'), @('M4','理论武器库','N型'), @('M4','理论武器库','对称'),
  @('M4','理论武器库','建仓波'), @('M4','理论武器库','拉升波'), @('M4','理论武器库','冲刺波'),
  @('M4','理论武器库','四块砖'), @('M4','理论武器库','四块绿砖'), @('M4','理论武器库','填坑'),
  @('M4','理论武器库','出坑'), @('M4','理论武器库','圆弧底'), @('M4','理论武器库','大风车'),
  # M5 交易框架元认知
  @('M5','交易框架元认知','框架'), @('M5','交易框架元认知','模块化'), @('M5','交易框架元认知','简单化'),
  @('M5','交易框架元认知','一把一结'), @('M5','交易框架元认知','动态仓'), @('M5','交易框架元认知','底仓'),
  @('M5','交易框架元认知','二元对立'), @('M5','交易框架元认知','混沌'), @('M5','交易框架元认知','知行合一'),
  @('M5','交易框架元认知','交作业'), @('M5','交易框架元认知','肌肉记忆'), @('M5','交易框架元认知','纪律'),
  # M6 心态与人性
  @('M6','心态与人性','心态'), @('M6','心态与人性','情绪'), @('M6','心态与人性','人性'),
  @('M6','心态与人性','散户'), @('M6','心态与人性','魔咒'), @('M6','心态与人性','思维'),
  @('M6','心态与人性','恐惧'), @('M6','心态与人性','贪婪'), @('M6','心态与人性','承受力'),
  @('M6','心态与人性','耐心'),
  # M7 宏观产业板块
  @('M7','宏观产业板块','产业'), @('M7','宏观产业板块','宏观'), @('M7','宏观产业板块','政策'),
  @('M7','宏观产业板块','创新药'), @('M7','宏观产业板块','消费'), @('M7','宏观产业板块','芯片'),
  @('M7','宏观产业板块','AIDC'), @('M7','宏观产业板块','算力'), @('M7','宏观产业板块','新能源'),
  @('M7','宏观产业板块','有色'), @('M7','宏观产业板块','券商'), @('M7','宏观产业板块','医药'),
  @('M7','宏观产业板块','PPI'), @('M7','宏观产业板块','关税'), @('M7','宏观产业板块','美联储'),
  # M8 复盘考试验收
  @('M8','复盘考试验收','考试'), @('M8','复盘考试验收','摸底'), @('M8','复盘考试验收','复盘'),
  @('M8','复盘考试验收','作业'), @('M8','复盘考试验收','验收'), @('M8','复盘考试验收','精讲'),
  @('M8','复盘考试验收','补课'), @('M8','复盘考试验收','案例'),
  # M9 人设与闲聊
  @('M9','人设与闲聊','闲聊'), @('M9','人设与闲聊','扯淡'), @('M9','人设与闲聊','茶人'),
  @('M9','人设与闲聊','加餐'), @('M9','人设与闲聊','聊天'), @('M9','人设与闲聊','高尔夫'),
  @('M9','人设与闲聊','生活'), @('M9','人设与闲聊','足球'),
  # M10 人生职业商业
  @('M10','人生职业商业','职业'), @('M10','人生职业商业','人生'), @('M10','人生职业商业','商业'),
  @('M10','人生职业商业','生意'), @('M10','人生职业商业','职场'), @('M10','人生职业商业','领导'),
  @('M10','人生职业商业','管理'), @('M10','人生职业商业','决策')
)

$modules = @('M0','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10')
$modName = @{ M0='择时'; M1='买点'; M2='止损与放飞'; M3='卖点与破位'; M4='理论武器库';
              M5='交易框架元认知'; M6='心态与人性'; M7='宏观产业板块'; M8='复盘考试验收';
              M9='人设与闲聊'; M10='人生职业商业' }

# ---- 1) 语料扫描 ----
$sessRows = @(); $detailRows = @()
foreach ($d in (Get-ChildItem $Corpus -Directory | Sort-Object Name)) {
    $notes = Get-ChildItem $d.FullName -Recurse -File -Filter 'notes.md' -ErrorAction SilentlyContinue
    $text  = ''
    foreach ($n in $notes) { $text += (Get-Content $n.FullName -Raw -Encoding UTF8) + "`n" }
    if ([string]::IsNullOrWhiteSpace($text)) { continue }   # 战法 / 无 notes 场次跳过

    $segN = (Get-ChildItem $d.FullName -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
    $m = ($d.Name -replace '^(\d{8}).*','$1')
    $row = [ordered]@{ Session = $d.Name; Date = $m; Segs = $segN; Chars = $text.Length }
    foreach ($code in $modules) {
        $sum = 0
        foreach ($k in $lex | Where-Object { $_[0] -eq $code }) {
            $c = ([regex]::Matches($text, $k[2])).Count
            if ($c -gt 0) {
                $sum += $c
                $detailRows += [pscustomobject]@{ Session=$d.Name; Module=$code; Keyword=$k[2]; Count=$c }
            }
        }
        $row[$code] = $sum
    }
    $sessRows += [pscustomobject]$row
}
$sessRows | Export-Csv -Path (Join-Path $OutDir 'module-session-matrix.tsv') -Delimiter "`t" -NoTypeInformation -Encoding UTF8
$detailRows | Export-Csv -Path (Join-Path $OutDir 'module-hits-detail.tsv') -Delimiter "`t" -NoTypeInformation -Encoding UTF8

# ---- 2) knowledge/ 扫描 ----
$kRows = @()
foreach ($f in (Get-ChildItem $Knowledge -Recurse -File -Filter '*.md' | Sort-Object FullName)) {
    $text = Get-Content $f.FullName -Raw -Encoding UTF8
    $rel  = $f.FullName.Replace("$Knowledge\",'')
    $row = [ordered]@{ File = $rel; Chars = $text.Length }
    foreach ($code in $modules) {
        $sum = 0
        foreach ($k in $lex | Where-Object { $_[0] -eq $code }) {
            $sum += ([regex]::Matches($text, $k[2])).Count
        }
        $row[$code] = $sum
    }
    $kRows += [pscustomobject]$row
}
$kRows | Export-Csv -Path (Join-Path $OutDir 'module-knowledge-matrix.tsv') -Delimiter "`t" -NoTypeInformation -Encoding UTF8

# ---- 3) 汇总 ----
Write-Output "语料场次(有 notes): $($sessRows.Count) / 93   总字符: $(($sessRows | Measure-Object Chars -Sum).Sum)"
Write-Output "knowledge 文档: $($kRows.Count)"
Write-Output ''
Write-Output '=== 模块 × 语料 命中总量（场次覆盖数 / 总命中） ==='
foreach ($code in $modules) {
    $nonZero = ($sessRows | Where-Object { $_.$code -gt 0 } | Measure-Object).Count
    $total   = ($sessRows | Measure-Object $code -Sum).Sum
    $kNonZero = ($kRows | Where-Object { $_.$code -gt 0 } | Measure-Object).Count
    $kTotal   = ($kRows | Measure-Object $code -Sum).Sum
    "{0,-4} {1,-14} 语料: {2,3}/$($sessRows.Count) 场次 命中 {3,6}   |  knowledge: {4,2}/$($kRows.Count) 篇 命中 {5,5}" -f `
      $code, $modName[$code], $nonZero, $total, $kNonZero, $kTotal
}

