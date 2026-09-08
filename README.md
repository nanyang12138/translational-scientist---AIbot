# translational-scientist---AIbot

本仓库目前主要存放由 Cursor Agent 生成的专题文稿与演示文稿。

## 《剧院魅影》全面介绍与分析

- 深度文稿：[`docs/剧院魅影_全面介绍与分析.md`](docs/剧院魅影_全面介绍与分析.md)
- 16:9 演示文稿：[`dist/剧院魅影_全面介绍与分析.pptx`](dist/剧院魅影_全面介绍与分析.pptx)（22 页）

再生成本地 PPT：

```bash
python3 -m pip install -r requirements.txt
python3 scripts/build_phantom_ppt.py
```

## 其他演示

- in vivo CAR-T 转化科学家：`python3 scripts/build_ppt.py` → `dist/in_vivo_CART_Translational_Scientist.pptx`
