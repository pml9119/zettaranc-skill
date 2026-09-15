# -*- coding: utf-8 -*-
"""docx 侦察 + 文本提取（stdlib only）"""
import zipfile, sys, os, re
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

path = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)

z = zipfile.ZipFile(path)
infos = sorted(z.infolist(), key=lambda i: -i.file_size)
print("== zip 条目总数:", len(infos))

media = [i for i in infos if i.filename.startswith('word/media/')]
print("== word/media 文件数:", len(media), "合计 %.1f MB" % (sum(i.file_size for i in media)/1048576))
exts = {}
for i in media:
    e = os.path.splitext(i.filename)[1].lower()
    exts[e] = exts.get(e, 0) + 1
print("   扩展名分布:", exts)
print("   TOP5 媒体:")
for i in media[:5]:
    print("    %-40s %8.1f KB" % (i.filename, i.file_size/1024))

print("\n== 主要 XML 部件:")
for i in infos:
    if i.filename.endswith('.xml') and not i.filename.startswith('word/media'):
        if i.file_size > 2000 or 'document' in i.filename:
            print("   %-45s %8.1f KB" % (i.filename, i.file_size/1024))

# ---- 提取正文 ----
xml = z.read('word/document.xml')
root = ET.fromstring(xml)
body = root.find(W + 'body')

lines = []
def para_text(p):
    return ''.join(t.text or '' for t in p.iter(W + 't'))

def walk(node, depth=0):
    for child in node:
        tag = child.tag
        if tag == W + 'p':
            t = para_text(child).strip()
            if t:
                lines.append(t)
        elif tag == W + 'tbl':
            lines.append('[表格开始]')
            for tr in child.findall(W + 'tr'):
                cells = []
                for tc in tr.findall(W + 'tc'):
                    cells.append(' '.join(para_text(p).strip() for p in tc.findall(W + 'p')).strip())
                if any(cells):
                    lines.append(' | '.join(cells))
            lines.append('[表格结束]')
        else:
            walk(child, depth + 1)

walk(body)

txt = '\n'.join(lines)
out = os.path.join(outdir, 'exam-extracted.txt')
with open(out, 'w', encoding='utf-8') as f:
    f.write(txt)

print("\n== 提取结果")
print("   段落/行数:", len(lines))
print("   字符数:", len(txt))
print("   输出:", out)

# 内嵌图片引用数
print("   正文内 drawing 引用数:", len(list(root.iter('{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}inline'))) +
      len(list(root.iter('{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}anchor'))))

print("\n== 前 3000 字符预览 ==")
print(txt[:3000])
