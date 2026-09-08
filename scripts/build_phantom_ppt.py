#!/usr/bin/env python3
"""Generate a 16:9 analysis deck for The Phantom of the Opera.

Run: python3 scripts/build_phantom_ppt.py
Output: dist/剧院魅影_全面介绍与分析.pptx
"""
from __future__ import annotations

import os

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "dist")
OUTPUT_PATH = os.path.normpath(
    os.path.join(OUTPUT_DIR, "剧院魅影_全面介绍与分析.pptx")
)

# Gothic palette
INK = RGBColor(0x0C, 0x09, 0x0B)
WINE = RGBColor(0x4A, 0x12, 0x1C)
BURGUNDY = RGBColor(0x6E, 0x1A, 0x28)
GOLD = RGBColor(0xC9, 0xA2, 0x27)
GOLD_PALE = RGBColor(0xE8, 0xD5, 0xA3)
CREAM = RGBColor(0xF6, 0xF0, 0xE6)
IVORY = RGBColor(0xFB, 0xF7, 0xF0)
CHARCOAL = RGBColor(0x2B, 0x24, 0x26)
MUTED = RGBColor(0x6A, 0x60, 0x5C)
ROSE = RGBColor(0x8B, 0x2E, 0x3A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CARD = RGBColor(0xFF, 0xFC, 0xF7)

FONT = "Microsoft YaHei"
FONT_EA = "Microsoft YaHei"
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


def _set_run(run, text, size, color, bold=False, italic=False, name=FONT):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = name
    rPr = run._r.get_or_add_rPr()
    latin = rPr.find(qn("a:latin"))
    if latin is None:
        latin = etree.SubElement(rPr, qn("a:latin"))
    latin.set("typeface", name)
    ea = rPr.find(qn("a:ea"))
    if ea is None:
        ea = etree.SubElement(rPr, qn("a:ea"))
    ea.set("typeface", FONT_EA)
    cs = rPr.find(qn("a:cs"))
    if cs is None:
        cs = etree.SubElement(rPr, qn("a:cs"))
    cs.set("typeface", FONT_EA)


def _shape_no_line(shape):
    shape.line.fill.background()
    return shape


def add_rect(slide, left, top, width, height, color):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    _shape_no_line(sh)
    sh.shadow.inherit = False
    return sh


def add_round(slide, left, top, width, height, color):
    sh = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    _shape_no_line(sh)
    sh.shadow.inherit = False
    # tighter corners
    try:
        sh.adjustments[0] = 0.08
    except Exception:
        pass
    return sh


def send_to_back(slide, shape):
    spTree = slide.shapes._spTree
    sp = shape._element
    spTree.remove(sp)
    spTree.insert(2, sp)


def textbox(slide, left, top, width, height):
    return slide.shapes.add_textbox(left, top, width, height)


def p_run(tf, text, size, color, bold=False, italic=False, align=PP_ALIGN.LEFT,
          space_before=0, space_after=4, first=False):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(space_before)
    p.space_after = Pt(space_after)
    run = p.add_run()
    _set_run(run, text, size, color, bold=bold, italic=italic)
    return p


def fill_tf(tf, lines, default_size=15, default_color=CHARCOAL):
    """lines: str or (text, size, color, bold) or dict."""
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if isinstance(item, str):
            text, size, color, bold, italic, spb, spa, align = (
                item, default_size, default_color, False, False, 0, 6, PP_ALIGN.LEFT
            )
        else:
            text = item.get("t")
            size = item.get("s", default_size)
            color = item.get("c", default_color)
            bold = item.get("b", False)
            italic = item.get("i", False)
            spb = item.get("sb", 0)
            spa = item.get("sa", 6)
            align = item.get("a", PP_ALIGN.LEFT)
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_before = Pt(spb)
        p.space_after = Pt(spa)
        run = p.add_run()
        _set_run(run, text, size, color, bold=bold, italic=italic)


def new_slide(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def cream_chrome(slide, page, total, section_label=""):
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, IVORY)
    add_rect(slide, 0, 0, Inches(0.16), SLIDE_H, BURGUNDY)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.08), GOLD)
    add_rect(slide, 0, Inches(7.28), SLIDE_W, Inches(0.22), INK)
    # footer
    box = textbox(slide, Inches(0.45), Inches(7.28), Inches(9.2), Inches(0.22))
    tf = box.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    label = "THE PHANTOM OF THE OPERA  ·  剧院魅影"
    if section_label:
        label = f"{label}  ·  {section_label}"
    _set_run(run, label, 9, GOLD_PALE, bold=False)
    num = textbox(slide, Inches(11.3), Inches(7.28), Inches(1.7), Inches(0.22))
    tf = num.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run = p.add_run()
    _set_run(run, f"{page:02d}  /  {total:02d}", 9, GOLD_PALE)


def title_block(slide, title, subtitle=None):
    box = textbox(slide, Inches(0.5), Inches(0.22), Inches(12.3), Inches(0.62))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, title, 26, BURGUNDY, bold=True)
    add_rect(slide, Inches(0.52), Inches(0.84), Inches(1.6), Inches(0.045), GOLD)
    if subtitle:
        sub = textbox(slide, Inches(0.5), Inches(0.92), Inches(12.3), Inches(0.42))
        tf = sub.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, subtitle, 13, MUTED, italic=True)
        return Inches(1.38)
    return Inches(1.08)


def bullets(slide, items, left, top, width, height, size=15):
    box = textbox(slide, left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        if isinstance(item, tuple):
            level, text = item
        else:
            level, text = 0, item
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = 0
        p.space_after = Pt(7 if level == 0 else 4)
        p.space_before = Pt(2 if level == 0 else 0)
        run = p.add_run()
        prefix = "▸  " if level == 0 else "    ·  "
        color = CHARCOAL if level == 0 else MUTED
        sz = size if level == 0 else size - 1
        _set_run(run, prefix + text, sz, color, bold=(level == 0))
    return box


def card(slide, left, top, width, height, title, lines, accent=GOLD):
    add_round(slide, left, top, width, height, CARD)
    add_rect(slide, left, top, Inches(0.08), height, accent)
    box = textbox(
        slide, left + Inches(0.22), top + Inches(0.12),
        width - Inches(0.36), height - Inches(0.22)
    )
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, title, 14, BURGUNDY, bold=True)
    for line in lines:
        p = tf.add_paragraph()
        p.space_before = Pt(4)
        p.space_after = Pt(2)
        run = p.add_run()
        _set_run(run, line, 12, CHARCOAL)


def make_cover(prs):
    slide = new_slide(prs)
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, INK)
    add_rect(slide, 0, 0, Inches(0.22), SLIDE_H, GOLD)
    add_rect(slide, Inches(13.11), 0, Inches(0.22), SLIDE_H, GOLD)
    add_rect(slide, 0, Inches(0.0), SLIDE_W, Inches(0.08), GOLD)
    add_rect(slide, 0, Inches(7.42), SLIDE_W, Inches(0.08), GOLD)

    # rose-gold wash bar
    add_rect(slide, Inches(0.22), Inches(5.85), Inches(12.89), Inches(0.04), GOLD)

    kicker = textbox(slide, Inches(0.85), Inches(1.45), Inches(11.5), Inches(0.4))
    tf = kicker.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, "ANDREW LLOYD WEBBER  ·  1986  ·  全面介绍与分析", 14, GOLD)

    title = textbox(slide, Inches(0.85), Inches(1.95), Inches(11.6), Inches(1.5))
    tf = title.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, "剧院魅影", 60, WHITE, bold=True)

    sub = textbox(slide, Inches(0.85), Inches(3.5), Inches(11.6), Inches(0.7))
    tf = sub.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, "The Phantom of the Opera", 28, GOLD_PALE, italic=True)

    tag = textbox(slide, Inches(0.85), Inches(4.35), Inches(11.6), Inches(1.1))
    tf = tag.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(
        run,
        "一部哥特浪漫悲剧，如何成为四十年超级音乐剧工业的样板：\n"
        "半面具、吊灯、地下湖，以及一个无法被爱、只能被承认的人。",
        16,
        RGBColor(0xD8, 0xCF, 0xC4),
    )

    meta = textbox(slide, Inches(0.85), Inches(6.1), Inches(11.6), Inches(0.9))
    tf = meta.text_frame
    tf.word_wrap = True
    lines = [
        "伦敦西区 1986  ·  百老汇 1988–2023（13,981 场，史上最长）  ·  全球逾 1.6 亿观众",
        "2026 四十周年  ·  分析文稿配套演示",
    ]
    for i, t in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(4)
        run = p.add_run()
        _set_run(run, t, 13, GOLD, bold=(i == 0))


def make_why(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "定位")
    top = title_block(
        slide, "01  它究竟是一部什么戏",
        "不是恐怖片，是被豪华工业包装过的哥特浪漫悲剧"
    )
    cards = [
        ("神话级简约", [
            "半面具、玫瑰、吊灯、地下湖",
            "四个图像即可完成全球传播",
            "比任何剧情简介都更快",
        ], BURGUNDY),
        ("可哼唱的品牌", [
            "主题曲可进单曲榜",
            "爱情咏叹可进婚礼与流行",
            "歌剧片段服务戏中戏",
        ], GOLD),
        ("现场不可盗版", [
            "吊灯的物理下落无法被视频替代",
            "观众与机关处在同一空间",
            "这是流媒体时代仍能卖票的根",
        ], WINE),
        ("可复制的工业", [
            "麦金托什全球克隆体系",
            "装箱走货运的同一套调度",
            "也因此极度依赖满座与旅游",
        ], ROSE),
    ]
    for i, (t, lines, acc) in enumerate(cards):
        col = i % 4
        card(
            slide,
            Inches(0.45 + col * 3.2),
            Inches(1.55),
            Inches(3.05),
            Inches(3.15),
            t,
            lines,
            accent=acc,
        )
    box = textbox(slide, Inches(0.5), Inches(4.9), Inches(12.3), Inches(2.15))
    tf = box.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "核心悖论", "s": 14, "c": BURGUNDY, "b": True, "sa": 8},
        {"t": "一个拒绝被看见的人，创造了二十世纪末最被看见的舞台形象；一个关于残缺与放逐的故事，变成全球旅游城市的豪华商品；一次要求绝对占有的爱，最后只能以放手完成自己。", "s": 15, "c": CHARCOAL, "sa": 10},
        {"t": "四十年后还值得分析，不是因为吊灯还在掉，而是因为它把几件现代人没解决的事唱进了公共记忆：才华能否兑换爱，观看能否不伤害，以及我们为怪物鼓掌时在为自己的哪一部分辩护。", "s": 14, "c": MUTED},
    ])


def make_toc(prs, page, total, items):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "目录")
    title_block(slide, "目录  /  Agenda", "先建立地图，再进入人物、音乐、舞台与接受史")
    left_items = items[:6]
    right_items = items[6:]
    for col, group in enumerate((left_items, right_items)):
        for i, t in enumerate(group):
            n = col * 6 + i + 1
            y = Inches(1.45 + i * 0.85)
            x = Inches(0.55 + col * 6.4)
            add_round(slide, x, y, Inches(6.1), Inches(0.72), CARD)
            add_rect(slide, x, y, Inches(0.72), Inches(0.72), BURGUNDY if n <= 6 else WINE)
            nb = textbox(slide, x, y, Inches(0.72), Inches(0.72))
            tf = nb.text_frame
            tf.word_wrap = False
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            _set_run(run, f"{n:02d}", 16, GOLD, bold=True)
            # vertical center-ish via extra padding in font
            lb = textbox(slide, x + Inches(0.9), y + Inches(0.16), Inches(5.0), Inches(0.45))
            tf = lb.text_frame
            p = tf.paragraphs[0]
            run = p.add_run()
            _set_run(run, t, 16, CHARCOAL, bold=True)


def make_id_card(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "身份证")
    title_block(slide, "02  作品身份证", "创班即美学：为莎拉·布莱曼而写，由普林斯做成黑箱里的金色巴洛克")

    rows = [
        ("作曲 / 剧本", "安德鲁·劳埃德·韦伯；剧本另与理查·史提哥合作"),
        ("歌词", "查尔斯·哈特主笔，史提哥补充；斯坦曼拒绝，勒纳因病退出"),
        ("原著", "加斯东·勒鲁《歌剧院幽灵》（1909–1910），非希尔 1976 版的升级"),
        ("导演 / 舞美", "哈罗德·普林斯；玛丽亚·布琼森（服装逾 200 套，半面具设计者）"),
        ("编舞 / 制作", "吉莉安·林恩；卡麦隆·麦金托什 + Really Useful Group"),
        ("首演阵容", "魅影 克劳福德 · 克莉丝汀 布莱曼 · 劳尔 史蒂夫·巴顿"),
        ("时空", "巴黎歌剧院及其地下；序幕 1919，主线约 1881"),
        ("奖项", "奥利弗奖最佳新音乐剧；托尼奖 10 提 7 中（含最佳音乐剧/导演/男主/布景/服装/灯光/女配）"),
    ]
    for i, (k, v) in enumerate(rows):
        y = Inches(1.28 + i * 0.68)
        add_round(slide, Inches(0.5), y, Inches(12.35), Inches(0.6), CARD)
        add_rect(slide, Inches(0.5), y, Inches(2.35), Inches(0.6), BURGUNDY)
        kb = textbox(slide, Inches(0.55), y + Inches(0.12), Inches(2.25), Inches(0.4))
        tf = kb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        _set_run(run, k, 12, GOLD, bold=True)
        vb = textbox(slide, Inches(3.0), y + Inches(0.12), Inches(9.6), Inches(0.4))
        tf = vb.text_frame
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, v, 14, CHARCOAL)


def make_source(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "改编")
    title_block(
        slide, "03  从小说到舞台：三件关键手术",
        "韦伯说：他职业生涯一直想写一部“重大浪漫故事”，原著英译给了他抓手"
    )
    bullets(
        slide,
        [
            "丢掉侦探结构，收成三角恋爱。小说后半配角与破案线索被砍，歌剧院本身升为主角。",
            "把魅影从都市传说里的怪物，改写成被拒绝的艺术家：作曲家、建筑师、机关师，然后才是杀手。",
            "把剧院写成元戏剧装置。观众坐在剧院里，看一座剧院被自己的幽灵劫持。",
            "身世压缩成吉瑞夫人的口述：畸形、马戏团兽笼、逃亡、藏进歌剧院——浪漫主义“被诅咒的天才”。",
            "平行改编，不是肯·希尔 1976/1984 版的升级；看过希尔版后另起炉灶。",
            "华语三地译名不同（剧院 / 歌剧 / 歌声魅影），辨识硬标准是版权、半面具与吊灯。",
        ],
        Inches(0.55), Inches(1.45), Inches(7.3), Inches(5.5), size=15,
    )
    add_round(slide, Inches(8.05), Inches(1.45), Inches(4.75), Inches(5.4), INK)
    box = textbox(slide, Inches(8.3), Inches(1.7), Inches(4.3), Inches(5.0))
    tf = box.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "改编的伦理选择", "s": 16, "c": GOLD, "b": True, "sa": 12},
        {"t": "舞台版更干净、更浪漫、更不侦探。", "s": 14, "c": GOLD_PALE, "sa": 10},
        {"t": "好处：两小时内能把“要被爱”唱成神话。", "s": 13, "c": WHITE, "sa": 8},
        {"t": "代价：谋杀更容易被旋律宽恕；女性主体的上限停在一吻与婚姻。", "s": 13, "c": WHITE, "sa": 14},
        {"t": "1925 默片提供另一极：更怪物、更哑剧、更身体。", "s": 13, "c": GOLD_PALE, "sa": 8},
        {"t": "看音乐剧之前，先分清你进入的是哪一条改编传统。", "s": 13, "c": CREAM, "sa": 0},
    ])


def make_making(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "创班")
    title_block(
        slide, "04  创班：一部“为谁而写”的戏",
        "1985 悉德蒙顿试演时，吊灯与管风琴序曲已经定型，至今未改"
    )
    items = [
        ("声音缪斯", "克莉丝汀为布莱曼量身而写。她处在古典女高音与流行跨界之间，决定了全剧必须能唱歌剧片段，也能把主题曲送进英国单曲榜前十（1986 与 Steve Harley 合唱版）。"),
        ("结构主义者导演", "普林斯不是纯抒情片导演。黑箱吞噬边缘，中心极尽金色巴洛克。他把《Cabaret》《Evita》的制度批判手感，用在一座歌剧院的权力游戏上。"),
        ("半面具是事故", "工作坊全罩面具挡住视线、闷住声音。布琼森改成半面具，揭面段落才成为可能。制作约束变成了核心符号：一半可见，一半不可见。"),
        ("作词几经易手", "斯坦曼档期不合，勒纳病退，史提哥出初稿，年轻的哈特重写大部分歌词。主题曲的公共记忆，是多次筛选后的结果，不是一次神启。"),
    ]
    for i, (t, body) in enumerate(items):
        col, row = i % 2, i // 2
        x = Inches(0.5 + col * 6.4)
        y = Inches(1.4 + row * 2.7)
        add_round(slide, x, y, Inches(6.15), Inches(2.5), CARD)
        add_rect(slide, x, y, Inches(6.15), Inches(0.08), GOLD)
        box = textbox(slide, x + Inches(0.28), y + Inches(0.25), Inches(5.6), Inches(2.05))
        tf = box.text_frame
        tf.word_wrap = True
        fill_tf(tf, [
            {"t": t, "s": 16, "c": BURGUNDY, "b": True, "sa": 8},
            {"t": body, "s": 13, "c": CHARCOAL, "sa": 0},
        ])


def make_plot_frame(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "结构")
    title_block(
        slide, "05  时间套层：记忆如何被通电",
        "1919 拍卖 → 吊灯升起 → 1881。结局的重量在第一分钟被预支"
    )
    steps = [
        ("01", "1919 拍卖", "苍老劳尔买下猴子八音盒（665）。下一件是残破吊灯（666）。“从未被完全解释的事件”。"),
        ("02", "吊灯通电", "升起 = 记忆被接通。序曲炸开。观众收到奇观承诺，也收到悼亡者视角。"),
        ("03", "1881 主线", "新经理、新女高音、地下王国、天台定情、吊灯坠落、化妆舞会、不归点、一吻。"),
        ("04", "回到物件", "人群涌入，王座只剩面具。四十年后人们买卖物件，不买卖真相。"),
    ]
    for i, (n, t, body) in enumerate(steps):
        x = Inches(0.45 + i * 3.2)
        add_round(slide, x, Inches(1.5), Inches(3.05), Inches(4.0), CARD)
        add_rect(slide, x, Inches(1.5), Inches(3.05), Inches(0.7), BURGUNDY)
        nb = textbox(slide, x, Inches(1.58), Inches(3.05), Inches(0.55))
        tf = nb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        _set_run(run, f"{n}   {t}", 14, GOLD, bold=True)
        bb = textbox(slide, x + Inches(0.18), Inches(2.4), Inches(2.7), Inches(2.9))
        tf = bb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, body, 14, CHARCOAL)
    note = textbox(slide, Inches(0.5), Inches(5.7), Inches(12.3), Inches(1.3))
    tf = note.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "结构功能：这不是正在发生的新闻，而是已被封存的传奇。劳尔先以幸存者出场，再在回忆里变成年轻情敌。终场只留面具，与开场只留拍品，首尾是同一句话——人消失，符号留下。", "s": 14, "c": MUTED},
    ])


def make_act1(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "第一幕")
    title_block(slide, "06  第一幕：被选中，与坠落", "从《汉尼拔》彩排到天台定情，吊灯是死刑宣告")
    bullets(
        slide,
        [
            "卡罗塔罢演，芭蕾群里的克莉丝汀顶上，《Think of Me》一炮而红；劳尔认出旧时玩伴。",
            "“音乐天使”从未露面。镜子滑开，半面具把她带入地下湖与烛光贡多拉。",
            "《The Music of the Night》：她看见披婚纱的自己的蜡像——爱的是已经完成的客体。",
            "私密揭面：暴怒，然后哀求被爱。面具是进入文明的许可证，被第一次剥夺。",
            "O.G. 战书、蛙声、《哑仆》、布克被勒死。剧院的说话等级：工人说得太多就会死。",
            "天台《All I Ask of You》：日光、保护、婚姻契约。暗处魅影用同一旋律唱残它。",
            "吊灯砸向舞台。第一幕结束在“爱情主题被污染”而不是单纯的特效点。",
        ],
        Inches(0.5), Inches(1.4), Inches(12.3), Inches(5.5), size=16,
    )


def make_act2(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "第二幕")
    title_block(slide, "07  第二幕：假面、不归点、一吻", "社会以为幽灵已死，用最大面积的明亮群像庆祝，然后被真正的假面刺穿")
    bullets(
        slide,
        [
            "六个月后化妆舞会。《Masquerade》是反讽：人们穿成魅影的样子嘲笑魅影。",
            "红衣死神夺走订婚戒指，扔出《唐璜的胜利》。劳尔决定把首演做成捕猎。",
            "墓园《Wishing You Were Somehow Here Again》：父之名的 X 光。她要的是恋人、老师，还是把父亲唱回来？",
            "魅影盗用亡父的声音；劳尔冲入，结构上是另一个男人接管保护权。",
            "首演夜：后台勒死皮安吉，替上唐璜。《The Point of No Return》让戏中戏与真实引诱重叠。",
            "克莉丝汀当众揭面——把私下恐惧变成公共行动。公开观看变成处决。",
            "套索困住劳尔。她走上前亲吻这张脸：给予承认，拒绝成为赎金。他放走两人。",
            "人群抵达时，人已经不在。梅格捡起面具，把传奇递交给观众。",
        ],
        Inches(0.5), Inches(1.4), Inches(12.3), Inches(5.5), size=15,
    )


def make_characters(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "人物")
    title_block(slide, "08  三角不是正派 / 反派 / 女主", "两种求爱在和声上是同一枚硬币的两面")
    trio = [
        ("魅影", "夜 · 艺术 · 执念",
         ["声音先于身体：社会允许天才的声音流通，不允许那张脸进入沙龙。",
          "爱含教学、占有、创作三种欲望。蜡像婚纱说明客体先于活人。",
          "放手才是他第一次像爱人而非收藏家行动。"]),
        ("克莉丝汀", "被夹在中间的主体",
         ["丧父 → 音乐天使替代父亲 → 因被选中而感激 → 选择日光 → 墓园再屈服 → 当众揭面 → 一吻完成审判。",
          "怕的不是脸，是那颗必须靠控制别人才能感觉自己存在的心。",
          "主动性集中在揭面与一吻；离开地下后仍走进婚姻——1986 年的极限。"]),
        ("劳尔", "昼 · 合法 · 较薄",
         ["提供安全、身份、契约。不信幽灵：既是勇气也是阶级傲慢。",
          "承诺“不再谈论黑暗”，但她的声音来自黑暗。",
          "先以 1919 年悼亡者现身，说明他赢了人，没赢过传奇。"]),
    ]
    for i, (name, tag, lines) in enumerate(trio):
        x = Inches(0.4 + i * 4.28)
        add_round(slide, x, Inches(1.42), Inches(4.1), Inches(5.5), CARD)
        add_rect(slide, x, Inches(1.42), Inches(4.1), Inches(0.95), INK)
        hb = textbox(slide, x + Inches(0.18), Inches(1.5), Inches(3.75), Inches(0.8))
        tf = hb.text_frame
        tf.word_wrap = True
        fill_tf(tf, [
            {"t": name, "s": 20, "c": GOLD, "b": True, "sa": 0},
            {"t": tag, "s": 12, "c": GOLD_PALE, "sa": 0},
        ])
        bb = textbox(slide, x + Inches(0.2), Inches(2.5), Inches(3.7), Inches(4.2))
        tf = bb.text_frame
        tf.word_wrap = True
        rows = []
        for j, line in enumerate(lines):
            rows.append({"t": "▸  " + line, "s": 12, "c": CHARCOAL, "sa": 10})
        fill_tf(tf, rows)


def make_themes(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "主题")
    title_block(slide, "09  主题：观看、权力、父之名", "全剧最重要的动作不是唱歌，是看")
    cards = [
        ("观看的政治",
         "镜子、蜡像、第五包厢、假面、当众揭面、围猎。半面具是协商：给你看一半，换取文明许可证。观众买票看毁容与坠落——戏在指控围观的同时满足围观。"),
        ("艺术作为国籍",
         "他在人间没有合法身份，艺术是唯一护照。要求第五包厢、自己的歌剧、自己的女高音。真正超前的不协和作品，出自不被允许进入大厅的人。浪漫，也几乎宽恕谋杀。"),
        ("父之名",
         "歌唱起源于亡父的许诺。魅影盗用“音乐天使”。墓园是心理结构的 X 光。劳尔的救援，结构上是接管保护权。一吻暂时平视，然后社会仍只给婚姻这一条路。"),
        ("未完成的救赎",
         "没有被社会接纳，没有被治愈。承认换自由。人消失，面具留下。开场拍卖已经剧透：人们买卖物件，不买卖真相。"),
    ]
    for i, (t, body) in enumerate(cards):
        col, row = i % 2, i // 2
        x = Inches(0.45 + col * 6.4)
        y = Inches(1.4 + row * 2.7)
        add_round(slide, x, y, Inches(6.2), Inches(2.5), CARD)
        add_rect(slide, x, y, Inches(0.1), Inches(2.5), GOLD)
        box = textbox(slide, x + Inches(0.3), y + Inches(0.2), Inches(5.7), Inches(2.15))
        tf = box.text_frame
        tf.word_wrap = True
        fill_tf(tf, [
            {"t": t, "s": 16, "c": BURGUNDY, "b": True, "sa": 8},
            {"t": body, "s": 13, "c": CHARCOAL},
        ])


def make_music_layers(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "音乐")
    title_block(
        slide, "10  三层声音世界",
        "拼贴在这里是方法：歌剧院本来就是一座风格博物馆。风格分层 = 权力分层。"
    )
    headers = ["层次", "谁在唱", "风格", "戏剧功能"]
    rows = [
        ["戏中戏", "卡罗塔 / 皮安吉 / 合唱", "大歌剧、轻歌剧、梅耶贝尔—吉尔伯特戏仿", "建立“官方艺术”，供打断与嘲笑"],
        ["地面抒情", "克莉丝汀 / 劳尔", "流行—普契尼式咏叹（operatic pop）", "可被带走的爱情品牌"],
        ["地下现代", "魅影 / 《唐璜的胜利》", "管风琴、摇滚、不协和、三全音执念", "宣布另一种时间，超前而被放逐"],
    ]
    # header
    add_rect(slide, Inches(0.45), Inches(1.45), Inches(12.4), Inches(0.55), INK)
    xs = [0.45, 2.3, 5.5, 9.15]
    ws = [1.85, 3.2, 3.65, 3.7]
    for x, w, h in zip(xs, ws, headers):
        b = textbox(slide, Inches(x), Inches(1.52), Inches(w), Inches(0.42))
        tf = b.text_frame
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, h, 13, GOLD, bold=True)
    for r, row in enumerate(rows):
        y = Inches(2.05 + r * 0.95)
        bg = CARD if r % 2 == 0 else RGBColor(0xF0, 0xE8, 0xDC)
        add_rect(slide, Inches(0.45), y, Inches(12.4), Inches(0.95), bg)
        for x, w, cell in zip(xs, ws, row):
            b = textbox(slide, Inches(x), y + Inches(0.18), Inches(w), Inches(0.65))
            tf = b.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            run = p.add_run()
            _set_run(run, cell, 13, CHARCOAL, bold=(x == 0.45))

    box = textbox(slide, Inches(0.5), Inches(5.05), Inches(12.3), Inches(1.95))
    tf = box.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "标题曲写在反复出现的三全音上（diabolus in musica，音乐中的魔鬼）。它不让旋律安定，只让念头循环。魅影不是混乱，是执念。", "s": 15, "c": CHARCOAL, "sa": 8},
        {"t": "管风琴给哥特重量，合成器与摇滚律动把它送进 1980 年代流行耳感。罗杰·沃特斯曾指认平克·弗洛伊德 Echoes 的阴影，并表示懒得起诉——“似曾相识”本身就是韦伯的公共记忆技术。", "s": 14, "c": MUTED},
    ])


def make_music_motifs(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "音乐")
    title_block(slide, "11  主导动机与关键曲目", "不是歌单剧。同一段旋律可以先是誓言，再是诅咒。")
    left = [
        "序曲管风琴音型：王国的纹章，全晚都会回来。",
        "标题曲下行：诱拐进行曲，空间从化妆室滑向地下。",
        "《Think of Me》：被选中的声音，也是劳尔认出她的声音。",
        "《The Music of the Night》：夜的教学法，诱惑写成保护。",
        "《All I Ask of You》及其 Reprise：全剧最狠的一刀——幸福和诅咒共用旋律。",
        "《Masquerade》：假面社会的合唱；八音盒在序幕已埋种子。",
        "《Wishing You Were Somehow Here Again》：对亡父，而非对恋人。",
        "《The Point of No Return》：戏中戏与犯罪现场叠在同一段音乐里。",
    ]
    bullets(slide, left, Inches(0.5), Inches(1.4), Inches(7.4), Inches(5.5), size=14)
    add_round(slide, Inches(8.1), Inches(1.45), Inches(4.7), Inches(5.4), INK)
    box = textbox(slide, Inches(8.35), Inches(1.7), Inches(4.25), Inches(5.0))
    tf = box.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "听的时候抓这一刀", "s": 16, "c": GOLD, "b": True, "sa": 12},
        {"t": "第一幕结尾，天台咏叹立刻被暗处的声音唱残。若这一段不能让你感到“旋律已经变脏”，说明还没进入核心。", "s": 14, "c": CREAM, "sa": 14},
        {"t": "和声上的暧昧", "s": 15, "c": GOLD, "b": True, "sa": 8},
        {"t": "斯内尔森指出：夜之乐章与天台咏叹骨架相近。克莉丝汀的困境不是选好人，是两种包装不同的占有，哪一种她还能呼吸。", "s": 13, "c": GOLD_PALE, "sa": 14},
        {"t": "普契尼遗产方曾就夜之乐章庭外和解。《西部女郎》的影子，说明这部戏大量征用已训练过大众耳朵的晚期浪漫语汇。", "s": 13, "c": RGBColor(0xD8, 0xCF, 0xC4)},
    ])


def make_stagecraft(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "舞台")
    title_block(slide, "12  舞台奇观：特效是叙事", "没有这盏灯，品牌会立刻瘦一圈")
    items = [
        ("吊灯", "序幕升起 = 记忆复活；一幕末坠落 = 爱情契约的死刑。把观众从安全的“看戏”抛进“被砸到”的错觉。"),
        ("镜子门", "化妆室的纳西索斯装置：她以为在看自己，拉她走的是他。主体与客体在同一平面。"),
        ("地下湖", "蜡烛从水面升起，贡多拉横过舞台。把口头传说变成可居住的夜之国。"),
        ("斜桥追逐", "旅行台切开剧院剖面：屋顶、后台、下水道同时存在。垂直空间即权力空间。"),
        ("化妆舞会", "最大面积明亮群像，被红衣死神刺穿。视觉高潮，也是“社会以为已胜利”的反讽。"),
        ("200+ 戏服", "歌剧院靠被看见的奢侈运转。黑披风是对这套视觉制度的反向加冕。"),
    ]
    for i, (t, body) in enumerate(items):
        col, row = i % 3, i // 3
        x = Inches(0.4 + col * 4.28)
        y = Inches(1.4 + row * 2.7)
        add_round(slide, x, y, Inches(4.1), Inches(2.5), CARD)
        add_rect(slide, x, y, Inches(4.1), Inches(0.5), BURGUNDY)
        hb = textbox(slide, x, y + Inches(0.08), Inches(4.1), Inches(0.38))
        tf = hb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        _set_run(run, t, 15, GOLD, bold=True)
        bb = textbox(slide, x + Inches(0.2), y + Inches(0.65), Inches(3.7), Inches(1.7))
        tf = bb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, body, 13, CHARCOAL)


def make_history(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "演出史")
    title_block(slide, "13  全球演出史：一部可克隆的工业", "第二长寿西区音乐剧；百老汇史上场次第一")
    events = [
        ("1986", "伦敦西区首演，国王陛下剧院（当时女王陛下）。"),
        ("1988", "百老汇开演；维也纳、东京启动全球复制。"),
        ("1989–99", "多伦多长驻。汉堡等德语版成为欧洲票房机器。"),
        ("2004", "舒马赫电影。上海大剧院原版首进中国。"),
        ("2006", "拉斯维加斯缩编奇观，剧场按加尼叶歌剧院改建。"),
        ("2011–12", "皇家阿尔伯特 25 周年；百老汇破 10,000 场。"),
        ("2020–21", "新冠停演。伦敦原版实际结束，缩编乐队约 14 人重开（原约 27 人）。"),
        ("2023.4.16", "百老汇原版告别，13,981 场。中文版在上海首演。"),
        ("2026", "四十周年进行中。台湾纪念版已演完；中国大陆收官轮进行中。"),
    ]
    for i, (year, text) in enumerate(events):
        col = 0 if i < 5 else 1
        row = i if i < 5 else i - 5
        x = Inches(0.5 + col * 6.4)
        y = Inches(1.35 + row * 1.05)
        add_round(slide, x, y, Inches(6.15), Inches(0.92), CARD)
        add_rect(slide, x, y, Inches(1.55), Inches(0.92), INK)
        yb = textbox(slide, x, y + Inches(0.25), Inches(1.55), Inches(0.45))
        tf = yb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        _set_run(run, year, 12, GOLD, bold=True)
        tb = textbox(slide, x + Inches(1.7), y + Inches(0.18), Inches(4.25), Inches(0.62))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, text, 13, CHARCOAL)


def make_china(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "中国")
    title_block(
        slide, "14  在中国：从引进奇观到城市 IP",
        "大陆通译《剧院魅影》。它训练了第一代去剧院看机关、听现场乐队的观众。"
    )
    rows = [
        ("2004–05", "上海大剧院原版首进，约 97–100 场，当时引进音乐剧场次之最之一。"),
        ("2013–16", "世界巡演：上海文化广场、广州大剧院、北京天桥等。"),
        ("2023", "中文版上海首演，第 18 种语言。制作方称九城约 159 场、票房超 1.5 亿元。"),
        ("2024–25", "英文原版再巡：深圳、西安、上海、苏州、成都、北京等。"),
        ("2026 现况", "武汉琴台 8.25–9.06 刚落幕。上海大剧院告别季 9.29–12.06 即将开演。"),
        ("2.0 计划", "沉浸式、户外、主题餐饮与授权。从一场演出扩成城市持续体验。"),
    ]
    for i, (k, v) in enumerate(rows):
        y = Inches(1.35 + i * 0.85)
        add_round(slide, Inches(0.5), y, Inches(12.35), Inches(0.75), CARD)
        add_rect(slide, Inches(0.5), y, Inches(2.1), Inches(0.75), BURGUNDY)
        kb = textbox(slide, Inches(0.5), y + Inches(0.18), Inches(2.1), Inches(0.42))
        tf = kb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        _set_run(run, k, 13, GOLD, bold=True)
        vb = textbox(slide, Inches(2.8), y + Inches(0.18), Inches(9.8), Inches(0.48))
        tf = vb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        _set_run(run, v, 14, CHARCOAL)


def make_afterlives(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "衍生")
    title_block(slide, "15  电影、续作、变体", "正典如何扩散，以及哪些扩散在削弱终局")
    cards = [
        ("2004 电影",
         "古装浪漫片。巴特勒更青春性感，毁容克制。作为入门影像有效；作为舞台替代则丢掉“你和吊灯处在同一空间”的恐怖。"),
        ("2011 阿尔伯特",
         "拉明 / 波格斯成为许多观众的第二代正典。谢幕历代魅影同台，是活的谱系展览。最易得的完整舞台感影像。"),
        ("Love Never Dies",
         "2010 续作把“放弃”改写为康尼岛上的再追求。伦敦评价两极，百老汇计划取消。反证：原作的力量正在于不给第三次机会。"),
        ("缩编与沉浸",
         "拉斯维加斯、户外场、沉浸式 Masquerade。去掉镜框后通常还剩品牌与旋律；普林斯的黑箱仪式感则不一定还在。"),
    ]
    for i, (t, body) in enumerate(cards):
        col, row = i % 2, i // 2
        x = Inches(0.45 + col * 6.4)
        y = Inches(1.4 + row * 2.7)
        add_round(slide, x, y, Inches(6.2), Inches(2.5), CARD)
        box = textbox(slide, x + Inches(0.3), y + Inches(0.25), Inches(5.6), Inches(2.1))
        tf = box.text_frame
        tf.word_wrap = True
        fill_tf(tf, [
            {"t": t, "s": 16, "c": BURGUNDY, "b": True, "sa": 8},
            {"t": body, "s": 13, "c": CHARCOAL},
        ])


def make_critique(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "批评")
    title_block(slide, "16  批评与争议", "一部能同时当旅游景点、唱片工业和性别讨论样本的戏，才值得被挑剔")
    bullets(
        slide,
        [
            "奇观压过人物。弗兰克·里奇：很难在现场过得不快，但它主要是在用幻想淋浴观众。心理密度不如《悲惨世界》或桑德海姆。",
            "熟悉感被写成原罪。普契尼和解、Echoes 指责、主题曲八年诉讼（韦伯胜诉）。更公允的说法：他是极高效的风格压缩器。",
            "女性主体的上限。主动性集中在揭面与一吻，随后仍走进婚姻。当代若只复制 1986 年的凝视，会像在展览一个美丽的人质。",
            "对暴力的浪漫化。勒死工人与男高音后，观众仍为终场的孤独鼓掌。哥特同情需要伦理刹车。",
            "“原版已死”之争。伦敦砍乐队与机关；百老汇因疫情后成本与上座率关闭。超级音乐剧撞上不可复制的经济。",
            "这些批评不取消成就。能被认真反对，说明它已经超出“好听”的范畴，进入了公共文化。",
        ],
        Inches(0.5), Inches(1.4), Inches(12.3), Inches(5.5), size=15,
    )


def make_why40(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "方法")
    title_block(slide, "17  为何仍能演出四十年", "辉煌与挽歌是同一件事的两面")
    left = [
        ("图像可传播", "面具 / 玫瑰 / 吊灯 / 湖，四个符号走遍 23 种语言。"),
        ("声音双国籍", "能进歌剧院，也能进卡拉 OK。跨界女高音撑开观众面。"),
        ("现场不可盗", "物理下落、蜡烛、贡多拉。视频是说明书，不是替代。"),
        ("可站边结构", "魅影粉与劳尔粉的分裂本身就是再消费引擎。"),
        ("重工业复制", "数十个四十尺集装箱、台口与吊杆硬指标。不是排练厅小品。"),
        ("经济极限", "必须几乎永远满座。公共卫生或旅游结构一变，就是生存危机。"),
    ]
    for i, (t, body) in enumerate(left):
        col, row = i % 3, i // 3
        x = Inches(0.4 + col * 4.28)
        y = Inches(1.45 + row * 2.65)
        add_round(slide, x, y, Inches(4.1), Inches(2.45), CARD)
        add_rect(slide, x, y, Inches(0.1), Inches(2.45), GOLD)
        box = textbox(slide, x + Inches(0.28), y + Inches(0.25), Inches(3.65), Inches(2.0))
        tf = box.text_frame
        tf.word_wrap = True
        fill_tf(tf, [
            {"t": t, "s": 16, "c": BURGUNDY, "b": True, "sa": 8},
            {"t": body, "s": 14, "c": CHARCOAL},
        ])


def make_howto(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "路径")
    title_block(slide, "18  如何看、如何听", "一条不绕路的入门顺序。不逐句引用受版权保护的歌词。")
    steps = [
        ("1", "先听 1986 伦敦原班",
         "克劳福德 / 布莱曼 / 巴顿。主题曲、夜之乐章、天台咏叹、墓园、化妆舞会，五首足够建立地图。原班录音在美国曾四白金。"),
        ("2", "再看 2011 阿尔伯特",
         "目前最易得的完整舞台感。唱功与公开性极强。不要误认成美琪剧院原版调度的逐镜复制。"),
        ("3", "电影当注释",
         "2004 版补视觉与古装氛围。不要当剧场替代。想看更怪物的身体表演，去 1925 默片。"),
        ("4", "现场看什么",
         "吊灯、地下湖、半面具是否在。中文版适合听词、跟人物；英文原版适合听声音设计与乐队。看完立刻重听第一幕结尾的 Reprise。"),
    ]
    for i, (n, t, body) in enumerate(steps):
        y = Inches(1.35 + i * 1.35)
        add_round(slide, Inches(0.5), y, Inches(12.35), Inches(1.22), CARD)
        add_rect(slide, Inches(0.5), y, Inches(0.9), Inches(1.22), INK)
        nb = textbox(slide, Inches(0.5), y + Inches(0.35), Inches(0.9), Inches(0.5))
        tf = nb.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        _set_run(run, n, 22, GOLD, bold=True)
        box = textbox(slide, Inches(1.6), y + Inches(0.12), Inches(11.0), Inches(1.0))
        tf = box.text_frame
        tf.word_wrap = True
        fill_tf(tf, [
            {"t": t, "s": 15, "c": BURGUNDY, "b": True, "sa": 2},
            {"t": body, "s": 13, "c": CHARCOAL, "sa": 0},
        ])


def make_summary(prs, page, total):
    slide = new_slide(prs)
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, INK)
    add_rect(slide, 0, 0, Inches(0.22), SLIDE_H, GOLD)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.08), GOLD)
    add_rect(slide, 0, Inches(7.42), SLIDE_W, Inches(0.08), GOLD)
    k = textbox(slide, Inches(0.85), Inches(1.3), Inches(11.6), Inches(0.4))
    tf = k.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, "19  一句话", 14, GOLD)
    t = textbox(slide, Inches(0.85), Inches(1.85), Inches(11.6), Inches(1.1))
    tf = t.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, "承认换自由。人消失，面具留下。", 32, WHITE, bold=True)
    b = textbox(slide, Inches(0.85), Inches(3.2), Inches(11.6), Inches(3.4))
    tf = b.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "《剧院魅影》把一个无法进入沙龙的天才，写成二十世纪末最成功的剧场商品。它的旋律训练了全球的耳朵，它的吊灯训练了观众对“现场”的瘾，它的一吻把占有改写成放手——然后立刻把女高音送回婚姻与传奇拍卖。", "s": 16, "c": GOLD_PALE, "sa": 14},
        {"t": "四十年后的观看，不必假装它没有剥削凝视与暴力浪漫；也不必否认它把残缺、艺术与渴望，做成了公共仪式。认真地看，比单纯地迷，更接近这部戏对自己提出的要求。", "s": 16, "c": CREAM, "sa": 0},
    ])
    foot = textbox(slide, Inches(0.85), Inches(6.7), Inches(11.6), Inches(0.4))
    tf = foot.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    _set_run(run, f"{page:02d}  /  {total:02d}", 10, GOLD)


def make_thanks(prs, page, total):
    slide = new_slide(prs)
    cream_chrome(slide, page, total, "附录")
    title_block(slide, "参考与说明", "详细论述见 docs/剧院魅影_全面介绍与分析.md")
    bullets(
        slide,
        [
            "官方史页 phantomoftheopera.com/history；Concord Theatricals 授权概述。",
            "百老汇闭幕场次 13,981 与托尼奖记录，见纽约时报 2023-04-16 报道及公开奖项名单。",
            "中国场次与票房：2004 上海引进报道；中国日报 2024 年转述中文版制作方数据；上海文广 2026 演出季发布。",
            "音乐分析：John Snelson 对主导动机与两首求爱曲和声对应的讨论；三全音与公开诉讼记录。",
            "勒鲁原著已进入公有领域。音乐剧歌词、配乐与舞台设计仍受版权保护，本演示不逐句引用歌词。",
            "华语译名并存：大陆《剧院魅影》、台湾《歌剧魅影》、香港《歌声魅影》，所指为同一部韦伯音乐剧。",
        ],
        Inches(0.5), Inches(1.4), Inches(12.3), Inches(4.4), size=15,
    )
    box = textbox(slide, Inches(0.55), Inches(5.9), Inches(12.2), Inches(1.1))
    tf = box.text_frame
    tf.word_wrap = True
    fill_tf(tf, [
        {"t": "分析是地图，现场才是领土。吊灯只在同一空间里坠落。", "s": 16, "c": BURGUNDY, "b": True, "a": PP_ALIGN.CENTER},
    ])


def build():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    toc_items = [
        "它究竟是一部什么戏",
        "作品身份证与创班",
        "从小说到舞台",
        "剧情的时间套层",
        "人物三角",
        "主题：观看 / 权力 / 父之名",
        "音乐：三层声音与主导动机",
        "舞台奇观",
        "全球演出史与中国接受",
        "衍生、批评与四十年",
        "如何看、如何听",
        "一句话",
    ]

    # page numbers assigned after we know total; build then stamp
    make_cover(prs)
    # placeholder total; we will rebuild footers... actually cream_chrome needs total now.
    # We'll use a two-pass approach: build with dummy 22, then not needed if we count first.

    # Count slides we will create:
    # cover + why + toc + id + source + making + plot + act1 + act2 + chars + themes
    # + music layers + motifs + stage + history + china + afterlives + critique + why40
    # + howto + summary + thanks = 22
    total = 22
    page = 2
    make_why(prs, page, total); page += 1
    make_toc(prs, page, total, toc_items); page += 1
    make_id_card(prs, page, total); page += 1
    make_source(prs, page, total); page += 1
    make_making(prs, page, total); page += 1
    make_plot_frame(prs, page, total); page += 1
    make_act1(prs, page, total); page += 1
    make_act2(prs, page, total); page += 1
    make_characters(prs, page, total); page += 1
    make_themes(prs, page, total); page += 1
    make_music_layers(prs, page, total); page += 1
    make_music_motifs(prs, page, total); page += 1
    make_stagecraft(prs, page, total); page += 1
    make_history(prs, page, total); page += 1
    make_china(prs, page, total); page += 1
    make_afterlives(prs, page, total); page += 1
    make_critique(prs, page, total); page += 1
    make_why40(prs, page, total); page += 1
    make_howto(prs, page, total); page += 1
    make_summary(prs, page, total); page += 1
    make_thanks(prs, page, total)

    assert len(prs.slides) == total, f"expected {total}, got {len(prs.slides)}"
    prs.save(OUTPUT_PATH)
    print(f"Saved: {OUTPUT_PATH} ({total} slides)")


if __name__ == "__main__":
    build()
