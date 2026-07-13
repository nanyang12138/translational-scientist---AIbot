# 论坛发帖草稿：从 Prompt 接口到 High-to-High AI Interface

## 标题备选

1. 我们是否需要从 Prompt Interface 走向 High-to-High AI Interface？
2. 为什么要把高维科研世界压扁成 prompt，再交给高维模型？
3. AI 工具的下一步：不是更长 prompt，而是高维世界状态层？

## 正文草稿

我最近在思考一个问题：现在很多 AI 工具的交互方式，似乎存在一个很奇怪的结构。

真实世界本来是高维的。比如在科研场景里，我们面对的不是一段线性文字，而是论文、图表、公式、表格、数据集、代码、实验记录、引用网络、研究假设、失败结果和长期上下文。

大模型内部本身也是高维的。Transformer 的 hidden states、embedding space、attention pattern 和 latent representations 都不是低维线性文本。

但我们经常做的是：

```text
高维现实对象
  ↓
人为压缩成低维 prompt / summary / text chunks
  ↓
输入高维模型
```

也就是：

```text
High → Low → High
```

这个过程当然有用，但也很浪费。很多空间关系、视觉结构、引用关系、数据分布、实验轨迹和不确定性，会在压缩成 prompt 的过程中丢失。

所以我想问的是：

> 如果真实世界是高维的，模型内部也是高维的，为什么我们的主要接口仍然是低带宽 prompt？我们能不能设计一种 High-to-High AI Interface？

## 我的初步理解

这里的目标不是简单地把所有原始数据一次性塞进模型。那样成本太高，也不可控。

更合理的方式可能是：

```text
原始高维对象
  ↓
多层结构化表示 / semantic codec / world state
  ↓
模型通过工具或接口按需访问
```

也就是说：

```text
不是：
文档 / 数据 / 代码 → 摘要 prompt → LLM

而是：
文档 / 数据 / 代码 → 多层高维状态层 → LLM / agent
```

在这个结构里，prompt 不再负责承载全部世界信息，而主要作为 control plane：

```text
prompt = 控制通道，表达目标、约束、意图
world state = 数据通道，承载文档、图表、数据、代码、证据链
```

模型即使只有一个文本输入口，也可以通过工具访问外部高维状态层：

```text
inspect_paper(section_id)
inspect_figure(figure_id)
query_dataset(stat_query)
inspect_code(symbol_id)
trace_evidence(claim_id)
update_world_state(patch)
```

这样 prompt 不再试图“装下整个世界”，而是指向一个可查询、可更新、可验证的世界状态。

## 为什么科研场景特别适合这个问题？

科研工作本来就不是线性文本任务。它更像一个知识星系：

- 论文是节点；
- 引用关系是边；
- 图表和数据是证据；
- 方法是操作路径；
- 假设是待验证状态；
- 实验记录是时间序列；
- 代码和数据是可复现基础；
- 用户的研究方向是导航目标。

如果我们把这些全部压缩成 prompt，就像把一个星系压成一句话。

所以我在想，科研 AI 助手真正需要的可能不是“更会聊天”，而是一个：

> Scientific World State Layer

它维护：

- 当前研究问题；
- 已知事实；
- 未验证假设；
- 证据链；
- 数据来源；
- 代码结构；
- 实验历史；
- 不确定性；
- 下一步验证任务。

## 我查到的一些相关方向

这个问题当然不是空白。很多人已经在不同方向处理其中的一部分：

### GUI / computer-use agent

- OSWorld
- OmniParser
- UI-TARS
- UI-TARS Desktop
- Agent-S
- ScreenAgent / Auto-GUI

这些方向解决了“AI 看屏幕、操作环境”的问题。

### Action verification / self-correction

- STEVE
- VLAA-GUI
- VeriGUI

这些方向解决了“AI 行动后如何检查是否成功”的问题。

### Multimodal world model

- Dynalang
- World Models as an Intermediary between Agents and the Real World
- Motus
- ModularAgent / BiTAgent
- LaDi-WM

这些方向解决了“模型如何在 latent space 中预测未来状态”的问题。

### Semantic codec / token compression

- DeCo
- Visual Token Compression
- Token Sequence Compression for Efficient Multimodal Computing
- LLMC+
- SDComp

这些方向解决了“如何降低高维输入成本”的问题。

### Long-term memory / persistent state

- WorldMem
- M3-Agent
- EgoMem

这些方向解决了“如何维护长期状态和多模态记忆”的问题。

### Latent-to-latent communication

- Vision Wormhole
- Interlat
- LatentMAS

这些方向开始探索“模型之间能否绕过自然语言，直接交换高维表示”。

## 我感觉仍然缺的东西

这些方向都很重要，但目前似乎还是碎片化的：

```text
GUI agent 解决看屏幕和操作；
world model 解决预测环境变化；
token compression 解决输入成本；
memory agent 解决长期记忆；
verification agent 解决行动后检查；
latent communication 解决模型间高带宽通信。
```

但我们真正想要的可能是把它们统一成一个面向人机协作的接口：

> Multimodal input + semantic codec + persistent world state + verification loop + latent communication

尤其是在科研、工程、知识工作这些场景里，我们需要的不只是“AI 能读文件”，而是：

> AI 能和人共享一个持续更新的高维工作状态。

## 我想请教社区的问题

1. “High-to-High AI Interface” 这个问题定义是否合理？
2. 现有工作里，哪些项目已经最接近这种结构？
3. 如果闭源大模型只提供单一 prompt/API 输入口，我们是否只能通过外部 world state + tool adapter 来模拟 high-to-high？
4. 有没有已有系统真正维护了科研/知识工作的 structured world state，而不只是 RAG 或长上下文？
5. 对于科研 AI 助手，world state schema 应该包含哪些核心对象？
6. 高维状态层如何保持可解释、可验证、可审计？
7. latent-to-latent communication 是否有机会进入实际产品，还是会长期停留在研究原型？

## 我目前的初步方向

我倾向于先做一个比较现实的原型，而不是一开始训练新模型：

```text
Scientific World State Layer
  + Semantic Codec
  + Tool Adapter
  + Verification Loop
```

第一步不是替代 LLM，而是在 LLM 外部建立一个结构化、高维、可查询的科研状态层。

模型的 prompt 只负责表达目标和调用工具；真正的数据和证据保存在 world state 里。

如果这个方向成立，后续才考虑更深层的 latent adapter、embedding injection 或 model-native interface。

我很想听听大家怎么看：这个方向是否已经有成熟方案？是否有我忽略的重要 prior art？还是这个问题本身定义得不够准确？
