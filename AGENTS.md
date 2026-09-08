# AGENTS.md

## 这个仓库是什么

专题文稿与演示文稿仓库。没有长期运行的应用服务。Python 仅用于用 `python-pptx` 生成 `.pptx`。

## 环境

```bash
python3 -m pip install -r requirements.txt
```

需要 Python 3，以及能显示中文的系统字体（Windows 上为微软雅黑；生成脚本把东亚字体写成 `Microsoft YaHei`）。

## 生成演示文稿

```bash
# 《剧院魅影》全面介绍与分析（22 页，16:9）
python3 scripts/build_phantom_ppt.py
# 输出：dist/剧院魅影_全面介绍与分析.pptx

# in vivo CAR-T 转化科学家（13 页，16:9）
python3 scripts/build_ppt.py
# 输出：dist/in_vivo_CART_Translational_Scientist.pptx
```

深度文稿在 `docs/`。没有自动测试套件；改 PPT 脚本后应重新运行对应 `build_*.py`，并用 python-pptx 抽文本核对页数与关键事实。

## 注意

- 不要在文稿中逐句引用仍受版权保护的音乐剧歌词。
- 勒鲁原著小说已进入公有领域；韦伯音乐剧文本与配乐仍受版权保护。
