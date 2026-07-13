# AI 高带宽接口与多模态世界模型笔记

## 核心问题

当前很多 AI 工具仍然以聊天框、文字 prompt、线性上下文为主要交互方式。这相当于把用户真实的高维需求、环境状态和感知信息，压缩进一个低带宽的语言接口，再让模型从这个窄通道里恢复出高维结果。

这个过程虽然可行，但并不自然，也不总是高效。人的真实感知并不是单一语言输入，而是视觉、听觉、触觉、空间位置、动作反馈、记忆和情绪共同构成的多层世界状态。

因此，一个关键问题是：

> 为什么 AI 不能更像人一样，直接处理多维、高带宽、多模态的世界状态，而不是主要依赖低维、线性、文字化的接口？

## 初步判断

这个问题是合理的，而且可能触及了当前 AI 工具形态的核心瓶颈。

需要区分两点：

1. **AI 模型内部本来就是高维的。**  
   神经网络中的 embedding、hidden state、attention 表示和 latent space 都是高维连续表示，并不是自然语言本身。

2. **人和模型之间的接口经常是低带宽的。**  
   用户把需求压缩成文字，模型再从文字中推断真实意图。这个输入输出接口才是当前体验中的主要瓶颈。

所以问题不是 AI 是否能处理高维信息，而是：

> 我们能否让 AI 的输入、记忆、推理、行动和输出都运行在更高带宽的多模态语义层里，而不是总要绕道自然语言？

## 语言接口的优势与限制

语言不是错误的接口。语言有很高的语义密度，可以把复杂目标压缩成短句。例如“帮我做一个科研 AI 助手”这句话背后包含了科研流程、文献管理、实验设计、数据分析、论文写作和知识协作等大量背景。

但语言也有明显限制：

- 它是线性的；
- 它会丢失空间关系；
- 它会丢失时间连续性；
- 它会丢失视觉细节、声音线索和动作反馈；
- 它要求用户先把模糊感觉翻译成文字；
- 它迫使 AI 从压缩后的文字里猜测真实意图。

这就像让一个人只通过电报理解世界：可以，但很窄。

## 人类感知的启发

人类并不是完整处理全部原始高维信息。眼睛、耳朵和身体接收到的信息量极大，但大脑会持续压缩、筛选、预测和更新。

更接近人的机制可能是：

```text
多模态感知
  ↓
任务相关压缩
  ↓
预测性世界模型
  ↓
注意力选择
  ↓
行动
  ↓
反馈更新
```

因此，AI 的目标不应该是无差别接收所有原始高带宽数据，而应该是建立一种：

> 任务相关、可更新、可行动的高维语义状态。

## 当前 AI 工具的断裂

很多 AI 系统现在仍然是：

```text
真实世界 / 用户意图
  ↓ 压缩
文字 prompt
  ↓
LLM 内部高维推理
  ↓
文字输出
  ↓
人或工具再解释执行
```

这个流程的问题是，高维信息进入和离开模型时都被迫经过文字瓶颈。

更理想的形态应该是：

```text
屏幕 + 文档 + 语音 + 视频 + 操作记录 + 环境状态
  ↓
多模态编码器
  ↓
共享 latent world state
  ↓
推理模型 / 世界模型 / 工具代理
  ↓
文本 + 图像 + UI 操作 + 代码 + 动作计划
```

核心是中间的共享世界状态层。它不是普通自然语言摘要，而是一个可查询、可更新、可行动的高维表示。

## 高 codec 的可能作用

如果基于现有大模型和高压缩 codec 做改进，最有价值的方向可能不是简单拉长上下文，而是构建：

> 语义 codec / latent codec / task-conditioned codec。

它不是把世界压缩成文字，而是把多模态信息压缩成模型可直接使用的高维 token。

例如，传统文字接口可能是：

```text
这个页面排版有点怪，帮我优化一下。
```

模型需要猜测“怪”指的是布局、字号、层级、颜色、间距，还是视觉焦点。

而高维接口可以同时提供：

```text
页面截图 latent
DOM 结构 latent
用户鼠标轨迹 latent
历史编辑 latent
视觉注意力 latent
设计规范 latent
```

这时 AI 不只是听用户描述，而是在一定程度上“看见现场”。

## 可设想的系统循环

未来 AI 工具不应该只是聊天框，而应该是一个持续循环：

```text
1. Observe 感知
   读取屏幕、文档、代码、图像、语音、操作历史。

2. Encode 压缩
   把多模态信息压成任务相关 latent。

3. Model 建模
   形成当前世界状态、用户目标、约束条件和不确定性。

4. Reason 推理
   规划下一步，预测可能结果。

5. Act 行动
   写代码、改文档、生成图像、操作 UI、调用工具。

6. Verify 校验
   运行测试、视觉比对、用户反馈、自检结果。

7. Update Memory 更新记忆
   把结果、偏好和经验写回长期状态。
```

这个循环可以概括为：

> 多模态感知 - 语义压缩 - 世界建模 - 行动验证循环。

## 为什么现在还没有完全实现

主要障碍包括：

### 1. 计算成本

视频、音频、屏幕录制和传感器数据的原始信息量很大。直接输入模型会带来高昂成本，因此需要高效 codec 把原始数据压缩为少量高价值 latent token。

### 2. 跨模态对齐

文字、图像、声音、动作和空间结构并不天然处于同一个坐标系。模型需要学习：

- 语言描述对应图像中的哪个区域；
- 声音对应哪个事件；
- 用户动作导致了什么环境变化；
- 哪些视觉变化和当前任务相关。

### 3. 持续世界状态不足

很多 AI 系统仍然是“每次重新读上下文”。但人类有持续记忆、空间模型、任务状态和目标追踪。

AI 需要从一次性 prompt 走向持续状态系统。

### 4. 工具接口低维

即使模型理解了高维状态，很多工具仍然只接受文字命令、JSON 或简单 API 参数。行动端也需要变得更高带宽，例如直接操作 UI、图形结构、3D 场景、流程图和多模型 latent 交换。

## 一个可能的架构草图

```text
用户世界
  ├─ 文本：需求、对话、文档
  ├─ 视觉：截图、视频、UI、图表
  ├─ 听觉：语音、环境声
  ├─ 行为：鼠标、键盘、历史操作
  ├─ 结构：代码 AST、DOM、数据库 schema
  └─ 记忆：项目历史、用户偏好、任务状态

        ↓

多模态 Codec 层
  - 压缩
  - 对齐
  - 去噪
  - 选择任务相关信息

        ↓

共享 World State
  - 当前目标
  - 当前环境
  - 用户意图
  - 可用工具
  - 约束条件
  - 不确定性

        ↓

推理 / 规划模型

        ↓

多模态输出
  - 文字解释
  - 代码
  - UI 修改
  - 图像 / 视频
  - 动作序列
  - 验证报告
```

## 不应回避的核心问题

前面列出的计算成本、跨模态对齐、持续世界状态和工具接口低维等问题，不应该被理解为“暂时无法解决，所以要避开”的边界。相反，它们正是下一阶段最值得攻克的问题。

如果早期 AI 的进步主要体现在模型是否会数学、会代码、会推理、会总结，那么当这些基础能力逐渐普及之后，真正的增益会来自更底层的交互和系统能力：

- AI 能否更自然地接收真实世界；
- AI 能否更低成本地理解复杂上下文；
- AI 能否维护持续的任务状态和世界模型；
- AI 能否行动之后自我观察、自我校验、自我修正；
- AI 能否和人共享同一个工作场景，而不是只等待人把世界翻译成 prompt。

因此，这些难点不是要被绕开的副问题，而是应该被转化成明确的研究和工程路线。

## 需要逐步解决的问题层级

可以把问题拆成几个递进层级：

```text
Level 1：多模态输入
让 AI 能看到屏幕、文档、图像、语音、视频和操作历史。

Level 2：结构化感知
把视觉、文本、代码、UI、文档和环境状态转成可操作结构。

Level 3：语义 codec
把多源信息压缩成任务相关的高价值 latent，而不是只压缩成自然语言。

Level 4：持续 world state
维护当前目标、历史操作、约束条件、用户偏好、不确定性和下一步计划。

Level 5：行动验证循环
让 AI 执行、观察结果、判断是否成功，并根据反馈修正。

Level 6：latent-to-latent 通信
让不同模型或代理之间可以交换高维状态，而不是只能交换文字。
```

这个分层意味着，下一步讨论不只是“AI 能不能做到”，而是要逐层追问：

> 每一层当前缺什么？可以用现有模型、codec、工具接口和代理循环做到什么？哪些地方需要新的训练方式、系统架构或交互协议？

## 外部已有工作扫描

在真正提出自己的解决方案之前，必须先做一件事：把问题放回已有研究、开源项目、专利和产品实践的脉络中。否则很容易把别人已经解决过的问题重新思考一遍，或者把已有方向误认为空白地带。

这次初步扫描把问题分成三类：

1. **论文与研究方向**：看学术界如何定义问题、训练模型、评测效果。
2. **GitHub 与开源系统**：看哪些能力已经有可运行原型，哪些还停留在论文。
3. **专利与产业线索**：看公司正在保护哪些系统结构、交互方式和自动化流程。

需要特别注意的是，“没有看到答案”不等于“答案不存在”。这里应该承认四类状态：

```text
已知已知：我们知道别人已经做了什么。
已知未知：我们知道某些方向还缺清晰答案。
未知已知：别人已经做了，但我们还没发现。
未知未知：问题空间里还没有被我们意识到的维度。
```

因此，后续每一步都应该带着 prior-art map 去做，而不是只从自己的直觉出发。

### 1. GUI / computer-use agent：高带宽屏幕输入已经在快速发展

这一类工作直接对应“AI 不应该只听文字，而应该看见和操作环境”。

代表性项目与论文包括：

- **OSWorld**：真实操作系统环境中的多模态 agent benchmark，支持任务初始化、真实 GUI 交互和执行结果评测。
  GitHub: <https://github.com/xlang-ai/OSWorld>
- **OmniParser**：微软的屏幕解析工具，把 UI 截图转成结构化、可定位的交互元素，提升纯视觉 GUI agent 的 grounding 能力。
  GitHub: <https://github.com/microsoft/OmniParser>
- **UI-TARS / UI-TARS Desktop**：面向 GUI 操作的原生多模态 agent 模型与桌面应用，强调截图理解、鼠标键盘控制、浏览器和本地电脑操作。
  GitHub: <https://github.com/bytedance/UI-TARS>
  GitHub: <https://github.com/bytedance/UI-TARS-desktop>
- **Agent-S**：面向 computer-use 的开放 agent 框架，强调像人一样使用电脑，并结合 grounding、planning、memory 和 benchmark。
  GitHub: <https://github.com/simular-ai/Agent-S>
- **ScreenAgent / Auto-GUI**：较早期的屏幕观察、计划、动作、反思循环，用截图和鼠标键盘动作完成多步任务。
  GitHub: <https://github.com/niuzaisheng/ScreenAgent>

这些工作说明：**高带宽视觉输入 + GUI 行动接口**已经不是空白方向。别人已经在做，而且进展很快。

但它们的局限也明显：

- 很多系统仍然把截图转成文字或结构化描述，再交给 LLM；
- 多数系统的 world state 还比较浅，主要是当前屏幕和短期历史；
- 对用户意图、长期偏好、跨应用上下文的建模还不够；
- 大量能力集中在“操作软件”，还没有上升到通用的高维人机共享状态层。

### 2. 行动验证与自我修正：observe-act-verify loop 已经成为显性方向

这对应“AI 不能只行动，还要检查行动是否真的成功”。

代表性工作包括：

- **STEVE**：Computer-use agent 的 step verification pipeline，用动作前后屏幕验证每一步是否正确，再用这些标签训练 agent。
- **VLAA-GUI**：强调 Stop、Recover、Search 的 GUI 自动化框架，包含强制 Completeness Verifier 和 Loop Breaker，避免提前宣布完成和循环失败。
- **VeriGUI**：提出 Thinking-Verification-Action-Expectation 机制，显式建模动作结果、失败检测和自我修正。

这些工作说明：**行动验证循环**已经被明确识别为 GUI agent 的关键问题。

但仍然有缺口：

- 验证往往绑定在 GUI 截图或特定 benchmark 上；
- 对更复杂的科研、写作、设计、代码、数据分析任务，还缺统一验证协议；
- verifier 自身的可信度、校准、成本和可解释性仍然是问题；
- “验证结果如何写回长期世界状态”还没有完全解决。

### 3. 多模态世界模型：已有研究正在把 MLLM 与 world model 结合

这一类工作直接对应“AI 不只看见状态，还要预测行动会如何改变世界”。

代表性方向包括：

- **Dynalang / Learning to Model the World with Language**：把图像、语言、动作压缩到 latent world model 中，学习预测未来 latent，并用于行动。
- **World Models as an Intermediary between Agents and the Real World**：把 world model 作为 agent 与真实世界之间的中介，用于低成本交互、规划和高成本环境模拟。
- **Motus**：统一 latent action world model，把理解、视频生成和动作专家整合到一个系统中。
- **ModularAgent / BiTAgent**：强调 MLLM 语义空间和 world model 动态 latent space 的双向耦合。
- **LaDi-WM**：用 latent diffusion 预测未来状态，说明在 latent space 中预测比直接预测像素更容易泛化。

这说明：**用 latent world model 承接多模态输入、预测未来、指导行动**已经是明确研究趋势。

但这里也有边界：

- 很多工作集中在机器人、仿真、操作控制，而不是日常知识工作；
- world model 通常依赖特定环境和动作空间；
- 与人类用户的意图、解释、协作界面还没有深度统一；
- “高维世界状态如何被用户理解、修改、信任”仍然没有成熟答案。

### 4. 多感官 embodied AI：视觉之外的感知也有人在做

你的直觉里提到人类不只是用眼睛，还用耳朵、触觉和身体状态理解世界。这个方向也已有研究基础。

代表性工作包括：

- **MultiPLY**：多感官、对象中心的 embodied LLM，把视觉、音频、触觉、热信息、动作 token 和状态 token 放入 3D 交互环境。
- **TacX**：多模态触觉表示，融合 tactile image、audio、motion、pressure，用于机器人操作。
- **Audio-Visual World Models**：把视觉和空间音频纳入 world model，用于多感官想象和导航。
- **Tactile-based Multimodal Fusion Survey**：系统整理视觉、语言、触觉、动作、力和本体感知等融合路线。

这说明“像人一样多感官理解世界”不是没人做，而是已经在 embodied AI 和机器人领域形成分支。

但对普通 AI 工具来说，问题在于：

- 多感官研究多面向机器人硬件，不一定适合软件 agent；
- 真实触觉、嗅觉、身体感等传感器并不是通用用户环境里随手可得；
- 对软件世界而言，等价的“多感官”可能不是物理触觉，而是屏幕、DOM、文件系统、日志、代码结构、用户操作轨迹、版本历史等多源信号。

### 5. 语义 codec / token 压缩：别人已经在解决高维输入成本问题

如果要处理高带宽输入，就必须解决压缩问题。这一类研究已经很多。

代表性方向包括：

- **Visual Token Compression**：通过 pooling、merging、pruning、attention-guided selection 等方法减少视觉 token。
- **DeCo**：把 token 压缩和语义抽象解耦，先保留 patch-level 空间局部性，再让 LLM 做语义抽象。
- **Token Sequence Compression for Efficient Multimodal Computing**：系统比较视觉 token selection / merging，关注低成本多模态推理。
- **LLMC+**：VLM 压缩 benchmark 和工具箱，覆盖 token-level 与 model-level compression。
- **SDComp / Semantically Disentangled Compression**：让 LMM 告诉 codec 什么值得压缩，面向机器任务而不是人眼视觉质量。

这说明：**高带宽输入不等于直接喂原始数据；关键是任务相关语义压缩**。这个判断已经被多篇工作支持。

但还缺一个更高层的问题：

> 当前压缩大多以效率和 benchmark 准确率为目标；我们真正需要的是“面向人机协作任务的语义 codec”，它要保留目标、约束、不确定性、可验证线索和行动相关信息。

### 6. 长期记忆与持续世界状态：已有工作开始从检索走向状态建模

这对应“AI 不应该每次重新读 prompt，而应该维护持续世界状态”。

代表性工作包括：

- **WorldMem**：通过 memory bank 和 state-aware memory attention 保持长期 3D 空间与时间一致性。
- **M3-Agent**：多模态长期记忆 agent，处理实时视觉和听觉输入，构建 episodic memory 与 semantic memory。
- **EgoMem**：面向 full-duplex omnimodal 模型的 lifelong memory agent，直接从视听流中识别用户、提取偏好和社会关系。
- 相关图记忆系统：把 episodic memory、semantic memory、实体关系和时间关系组织成图结构。

这说明：**长期记忆不应该只是向量数据库检索**，而要有实体、时间、状态、事件和语义层级。

仍然存在的缺口：

- 记忆写入标准不清晰，容易污染；
- 记忆的遗忘、纠错、权限和隐私问题复杂；
- 多模态记忆如何与即时行动循环结合还不成熟；
- 记忆如何参与 world state，而不是只作为 RAG 背景材料，仍然需要设计。

### 7. latent-to-latent 通信：已有研究正在绕过自然语言瓶颈

这直接命中你提出的核心问题：为什么模型之间不能交换高维状态，而一定要用低带宽文字？

代表性工作包括：

- **Vision Wormhole**：把 VLM 的视觉输入通道重新理解成连续通信端口，用 Universal Visual Codec 在异构模型之间传输 latent reasoning state。
  GitHub: <https://github.com/xz-liu/heterogeneous-latent-mas>
- **Interlat**：让 agent 直接交换最后一层 hidden states，减少自然语言中转，实现 latent-space communication。
  GitHub: <https://github.com/XiaoDu-flying/Interlat>
- **LatentMAS** 等相关工作：探索多 agent 在 latent space 中协作。

这说明：**绕过自然语言、直接交换高维表示**已经是一个非常明确的研究方向。

但它距离通用产品还有问题：

- latent 表示难以解释和审计；
- 不同模型 hidden state 不天然兼容；
- 高维通信可能传递错误、偏见或不可控信息；
- 用户很难直接理解 latent 通信中发生了什么；
- 安全、调试、可恢复性和版本兼容都还没有成熟工程标准。

### 8. 专利与产业线索：公司已经在保护多模态 agent 与界面自动化

专利检索也显示，产业界已经在围绕这些方向布局。需要注意：这里不是法律意见，只是技术线索扫描。

代表性专利/申请包括：

- **US20230178076A1 - Controlling interactive agents using multi-modal inputs**
  描述用图像 embedding、文本 embedding 和 multimodal Transformer 生成 agent 环境表示，再控制交互 agent。
- **WO2025240379A1 - Real-time multi-modal artificial intelligence agent**
  描述实时多模态 agent、输入 tokenization 与模型部署解耦、缓存、事件检测、实时交互和 memory layer。
- **US12387036B1 - Multimodal agent for efficient image-text interface automation**
  描述原生视觉 UI 理解、agent loop、DSL 和 actuation layer，把模型指令转成真实 web/UI 操作。
- **Systems and methods for an artificial intelligence agent for graphical user interface automation**
  描述跨 web、desktop、mobile GUI 的视觉 grounding training 与 planning / reasoning training。

这些专利说明：产业界已经把“多模态输入 + GUI 自动化 + agent loop + actuation layer + memory / caching”视为重要系统结构。

对我们有两个启发：

1. 不能把“多模态 agent 操作 UI”当成全新空白点。
2. 真正可探索的空间可能在更高层：统一的高维语义状态、可验证的人机协作协议、科研/知识工作场景里的 world state，而不只是自动点击界面。

## 初步综合判断

这次扫描后的结论不是“别人都做完了”，也不是“我们没必要做”。更准确的判断是：

> 这些问题已经被许多人从不同方向切开了，但还没有形成一个统一的、高带宽、人机协作型 AI 系统框架。

目前已有工作大致呈现出碎片化格局：

```text
GUI agent 解决“看屏幕和操作”
world model 解决“预测环境变化”
token compression 解决“高维输入成本”
memory agent 解决“长期状态”
verification agent 解决“行动后检查”
latent communication 解决“模型间高带宽通信”
patent/product 解决“界面自动化系统化”
```

但我们的核心问题横跨这些方向：

> 能否把多模态输入、语义 codec、持续 world state、行动验证、长期记忆和 latent 通信整合为一个面向人机协作的高带宽接口？

这可能才是值得继续挖的地方。

## 下一步研究方法

为了避免重复造轮子，下一步不应该直接设计方案，而应该先建立一个 prior-art matrix：

```text
方向
  - 已有代表工作
  - 解决了什么
  - 没解决什么
  - 可复用的组件
  - 风险与限制
  - 对我们问题的启发
```

然后再逐层推进：

1. 先选一个具体场景，例如科研 AI 助手、论文写作、代码工作区、GUI 操作或多文档理解。
2. 对该场景列出需要的高带宽信号。
3. 查现有项目是否已有可复用模块。
4. 对每个缺口判断是工程集成问题、模型训练问题、评测问题，还是交互协议问题。
5. 最后才提出自己的系统设计。

这会让后续方案建立在外部已有工作的地图上，而不是只建立在内部直觉上。

### 初步参考来源清单

这不是最终 bibliography，而是下一轮深入阅读和 prior-art matrix 的种子清单：

- OSWorld: <https://github.com/xlang-ai/OSWorld>
- OmniParser: <https://github.com/microsoft/OmniParser>
- UI-TARS: <https://github.com/bytedance/UI-TARS>
- UI-TARS Desktop / Agent TARS: <https://github.com/bytedance/UI-TARS-desktop>
- Agent-S: <https://github.com/simular-ai/Agent-S>
- ScreenAgent: <https://github.com/niuzaisheng/ScreenAgent>
- Vision Wormhole: <https://github.com/xz-liu/heterogeneous-latent-mas>
- Interlat: <https://github.com/XiaoDu-flying/Interlat>
- M3-Agent: <https://github.com/ByteDance-Seed/m3-agent>
- STEVE-R1: <https://github.com/FanbinLu/STEVE-R1>
- UI-TARS paper: <https://arxiv.org/html/2501.12326v1>
- Auto-GUI / You Only Look at Screens: <https://arxiv.org/html/2309.11436v4>
- World Models as an Intermediary between Agents and the Real World: <https://arxiv.org/html/2602.00785v1>
- Learning to Model the World with Language / Dynalang: <https://ar5iv.labs.arxiv.org/html/2308.01399>
- LaDi-WM: <https://arxiv.org/html/2505.11528v1>
- Vision Wormhole paper: <https://arxiv.org/html/2602.15382v2>
- Interlat paper: <https://arxiv.org/html/2511.09149v4>
- DeCo: <https://arxiv.org/html/2405.20985v1>
- Token Sequence Compression for Efficient Multimodal Computing: <https://arxiv.org/html/2504.17892v1>
- SDComp: <https://arxiv.org/pdf/2408.08575>
- M3-Agent paper: <https://arxiv.org/html/2508.09736v2>
- EgoMem: <https://arxiv.org/html/2509.11914>
- MultiPLY: <https://openaccess.thecvf.com/content/CVPR2024/papers/Hong_MultiPLY_A_Multisensory_Object-Centric_Embodied_Large_Language_Model_in_3D_CVPR_2024_paper.pdf>
- Tactile-based Multimodal Fusion Survey: <https://arxiv.org/html/2605.17336v1>
- US20230178076A1: <https://patents.google.com/patent/US20230178076A1/en>
- WO2025240379A1: <https://patents.google.com/patent/WO2025240379A1/en>
- US12387036B1: <https://patents.google.com/patent/US12387036B1>

## 从人脑启发到工程原型：芯片设计与验证场景

前面的讨论已经说明，单纯把所有信息压成 prompt 不是理想路径。但问题还需要进一步收敛：

> 如果我们真的要做一个系统，它到底是什么？是 agent 吗？输入是什么？输出是什么？神经科学在这里起什么作用？

一个更清晰的答案是：

> 它不是单一聊天 agent，而是一个受人脑启发的工程认知层，再连接一组 agent 执行器。

换句话说，LLM / LMM 可以像“推理核心”或“语言-计划系统”，但它不应该独自承担全部感知、记忆、状态维护和验证工作。真正要做的是在模型外部建立一个类似人脑认知结构的工程系统。

### 1. 它是不是 agent？

它可以包含 agent，但整体不只是 agent。

更准确地说，它应该分成两层：

```text
Engineering Cognitive Layer
  - 感知工程对象
  - 维护工程状态
  - 绑定证据
  - 记录历史
  - 评估不确定性
  - 决定当前注意力

Agent Execution Layer
  - 调用 EDA / 仿真 / regression / lint / formal / coverage 工具
  - 读写代码
  - 分析日志
  - 生成 patch
  - 运行验证
  - 回写结果
```

如果只叫 agent，容易让人误以为它只是一个“会调用工具的 LLM”。但我们真正想做的是：

> 一个有感知、记忆、注意力、预测和行动反馈的工程认知系统。

### 2. 输入最终是不是只有语言？

不应该只有语言。

语言仍然重要，但它应该主要承担“控制通道”的角色：

```text
语言输入
  - 用户目标
  - 约束条件
  - 优先级
  - 解释需求
  - 人类判断
```

而工程世界本身应该通过多种非语言输入进入系统：

```text
工程输入
  - RTL / Verilog / SystemVerilog
  - testbench / UVM components
  - regression results
  - simulation logs
  - waveform / trace
  - coverage reports
  - lint / CDC / RDC reports
  - timing / synthesis reports
  - bug tickets
  - git diff / commit history
  - spec / architecture documents
  - design review comments
```

这些东西不应该先被粗暴总结成一段 prompt。它们应该被解析成结构化、多层次、可查询的工程状态。

### 3. 芯片验证场景里的“多感官”是什么？

对于人脑来说，多感官是眼睛、耳朵、皮肤、鼻子、本体感觉等。对于芯片工程系统来说，“多感官”不是物理感官，而是不同工程信号源：

```text
视觉等价物：波形、覆盖率图、dashboard、diff view
听觉等价物：日志流、报错信息、warning pattern
触觉等价物：工具反馈、失败 testcase、timing violation、assertion failure
本体感觉等价物：当前代码库状态、分支状态、构建环境、依赖版本
语言等价物：spec、review comment、工程师指令、bug 描述
情景记忆：过去 regression、历史 bug、修复记录、失败实验
```

这说明“类人脑”不是要复制人类器官，而是要复制一种功能结构：

> 多源感知 - 注意力路由 - 跨源绑定 - 情景记忆 - 预测误差 - 行动反馈。

### 4. 神经科学在这里提供什么基础？

神经科学不是直接告诉我们如何写 Python，也不是让我们机械复制大脑结构。它提供的是系统设计原则。

可以映射为：

```text
模态皮层
  → 不同工程对象用不同 parser / encoder 处理

丘脑式路由
  → 根据任务、异常、置信度和成本决定当前关注哪些信号

海马式记忆
  → 记录一次次工程事件：某次 regression、某个失败、某次修复、某个结论

全局工作空间
  → 只把当前最相关的问题、证据、不确定性和下一步行动交给 LLM

预测处理
  → 系统在行动前形成预期，行动后比较结果，产生 prediction error

主动推理
  → 系统主动运行测试、查日志、开 waveform、追 commit，用行动减少不确定性
```

这就是神经科学对当前 AI 的作用：

> 它不是替代 Transformer，而是指导我们如何组织 Transformer 周围的感知、状态、记忆、注意力和反馈系统。

### 5. 一个具体原型：Verification Cognitive Agent

结合芯片设计和验证场景，第一个更具体的原型可以叫：

> Verification Cognitive Agent

但要注意，它不是只有 agent。它的核心是：

```text
Verification World State
  + Tool Adapters
  + Attention Router
  + Episodic Memory
  + Global Workspace
  + LLM Planner
  + Verification Loop
```

它要维护的状态包括：

```text
Design State
  - 当前模块
  - RTL 结构
  - 接口协议
  - 关键状态机

Verification State
  - test plan
  - testcase 列表
  - regression 历史
  - coverage gap
  - assertion 状态

Failure State
  - failing tests
  - error signatures
  - first failing commit
  - suspected root cause
  - related waveform windows

Evidence State
  - 哪个 log 支持哪个判断
  - 哪个 waveform 支持哪个假设
  - 哪个 commit 引入了变化
  - 哪个 spec 条款对应哪个检查

Action State
  - 已经尝试过什么
  - 哪些尝试失败了
  - 下一步最值得跑什么
  - 成本和风险是什么
```

### 6. 工作循环

这个系统的循环可以是：

```text
1. Observe
   读取 RTL、testbench、logs、coverage、waveform、regression dashboard、spec。

2. Encode
   用不同 parser / encoder 生成结构化对象，而不是全部转成 prompt。

3. Bind
   把 test failure、log line、waveform signal、commit diff、spec requirement 绑定成证据链。

4. Attend
   根据当前任务选择最相关的信息进入 global workspace。

5. Reason
   LLM / LMM 在工作空间中推理，提出假设和下一步动作。

6. Act
   调用仿真、lint、coverage、formal、脚本、代码搜索或 patch 工具。

7. Verify
   比较预期和实际结果，判断假设是否被支持。

8. Update
   更新 world state、记忆、证据链和下一步计划。
```

### 7. 最小可做版本

第一版不需要训练新模型。可以先做一个外部系统：

```text
输入：
  - 一个 RTL 模块
  - 一组 testcase / regression log
  - 一个 spec 片段
  - 一个失败报告

系统构建：
  - design_index.json
  - regression_state.json
  - failure_clusters.json
  - evidence_graph.json
  - action_history.json

LLM 看到：
  - 当前任务
  - active workspace
  - 可调用工具
  - 必须引用证据的规则

输出：
  - 可能 root cause
  - 证据链
  - 下一步最小验证动作
  - 需要人工判断的问题
```

这样，语言不再是唯一输入。语言只是工程师和系统之间的控制接口；真正的工程世界通过结构化状态层进入系统。

### 8. 当前最重要的收敛

目前我们不应该把目标定义成“做一个通用 high-to-high AI”。这太大。

更合适的目标是：

> 做一个受人脑启发的芯片验证工程认知系统，让 AI 能持续理解 RTL、testcase、regression、log、coverage、waveform、spec 和历史修复，并通过行动反馈不断更新自己的工程世界状态。

这就是一个可以开始落地的方向。

## 如何证明它不是概念包装

这里需要非常警惕一个问题：如果最后做出来的东西只是“把更多材料塞进 prompt，然后让 LLM 回答”，那它和普通聊天机器人没有本质区别。

因此，真正的问题不是“我们能不能讲出一个新概念”，而是：

> 它比当前的 LLM wrapper 到底强在哪里？效果如何体现？怎么证明它是真的？

### 1. 如果只是把全部上下文塞进 prompt，就没有区别

普通方式是：

```text
RTL / log / regression / spec
  ↓
人工总结或直接粘贴到 prompt
  ↓
LLM 猜测 root cause
  ↓
工程师继续人工验证
```

这仍然是聊天式推理。它的问题包括：

- 每一轮近似重新开始；
- 不真正维护 regression 历史；
- 不知道哪些动作已经试过；
- 不知道哪个证据支持哪个判断；
- 不能自动验证自己的假设；
- 容易重复建议；
- 输出可能合理，但不可追踪。

我们要做的东西必须不同：

```text
工程材料
  ↓
自动解析成结构化状态
  ↓
系统维护失败、证据、历史动作和不确定性
  ↓
LLM 只处理当前 active workspace
  ↓
系统执行验证动作
  ↓
结果回写 world state
```

本质区别是：

> AI 不再只是回答问题，而是维护一个持续更新的工程状态机。

### 2. 真正差异：状态式工程推理

普通 LLM 是“对话式推理”。我们想做的是“状态式工程推理”。

| 普通 LLM | Verification Cognitive Agent |
|---|---|
| 输入是 prompt | 输入是工程对象 |
| 输出是回答 | 输出是证据化状态更新 |
| 每轮近似重新开始 | 持续维护 world state |
| 靠上下文窗口记忆 | 靠结构化 memory / state |
| 建议不可验证 | 假设绑定验证动作 |
| 容易重复 | action history 防止重复 |
| log 是文本 | log 是可索引 evidence |
| 工程师人工组织上下文 | 系统自动组织上下文 |

真正的优势不在“模型更聪明”，而在：

> 系统能把每次工程观察、判断、验证和失败都变成下一次推理可复用的状态资产。

### 3. 第一个可见 demo：Regression Failure Cognitive Triage

第一个原型不应该做成大而全的系统，而应该只解决一个具体问题：

> 给定 regression failure，系统能否比普通 LLM 更快、更可追踪地定位可疑 root cause，并提出最小验证动作？

输入可以是：

```text
1. regression logs
2. failing testcase 列表
3. git diff / commit history
4. 相关 RTL 文件
5. spec 片段
```

系统输出应该是：

```text
1. failure clusters
2. suspected root cause
3. supporting evidence
4. first suspicious commit
5. related RTL module / signal
6. next minimal rerun command
7. confidence / uncertainty
8. action history
```

如果这个 demo 不能比直接问 LLM 更清楚、更可追踪、更少重复，那这个方向就没有实际价值。

### 4. 如何衡量效果

必须用指标证明，而不是用概念证明。

可以比较两种方式：

```text
Baseline:
  工程师把 log / spec / diff 粘给普通 LLM，问 root cause。

Proposed:
  系统先构建 design_index、regression_state、failure_clusters、
  evidence_graph、action_history，再让 LLM 在 active workspace 中推理。
```

可观测指标包括：

- root cause 命中率；
- triage 时间；
- 需要人工阅读的 log 行数；
- 重复无效动作次数；
- rerun 次数；
- 证据链是否可追踪；
- 能否指出最小复现 / rerun 命令；
- 能否定位 first suspicious commit；
- 下次类似 failure 是否更快；
- 工程师是否能信任和复核系统结论。

如果这些指标没有改善，就说明它只是概念包装。

### 5. 最小系统结构

第一版可以非常小，不需要训练新模型：

```text
/verification-agent
  /inputs
    regression.log
    failing_tests.txt
    git_diff.patch
    rtl/
    spec.md

  /state
    design_index.json
    regression_state.json
    failure_clusters.json
    evidence_graph.json
    action_history.json

  /tools
    parse_log.py
    cluster_failures.py
    map_signal_to_rtl.py
    inspect_git_diff.py
    propose_rerun.py

  /agent
    active_workspace_builder.py
    planner_prompt.md
```

这里的核心不是 UI，也不是 prompt，而是 state。

### 6. 预期效果应该体现在哪里

系统的优势应该体现在非常具体的工程体验上：

```text
以前：
  工程师读很多 log，手动找 failure pattern，手动追 diff，
  手动猜可能模块，再问 LLM 或同事。

以后：
  系统自动聚类 failure，关联最近 diff，指出相关 RTL / signal，
  给出证据链，建议最小 rerun，并记录哪些动作已经尝试过。
```

也就是说，它应该减少：

- 重新整理上下文的成本；
- 重复 debug；
- 无证据猜测；
- 反复运行无效 testcase；
- 只靠工程师记忆维护状态的负担。

并增加：

- 可追踪证据；
- 可复核判断；
- 可继承的 debug history；
- 下一步行动的明确性；
- 团队知识积累。

### 7. 当前最小结论

这个系统的优势不是“它更像人脑”，而是：

> 它能减少工程师重新整理上下文的成本，减少重复 debug，提供可追踪证据，并把每次验证结果变成下一次推理的状态资产。

如果做不到这一点，就不值得继续。

## 修正版小原型：Verification Latent Workspace

前面的“Verification Cognitive Agent”仍然容易退回传统 agent 方案：多个子 agent 调工具、LLM 做中心调度、状态只是辅助记录。这个方向有工程价值，但它不完全等于最初讨论的 high-to-high。

更准确的修正是：

> 原型不应以多 agent 为中心，而应以工程高维状态空间为中心。Agent 只是使用这个状态空间的一个执行层。

也就是说，第一版真正要做的不是：

```text
LLM + tools + memory + many agents
```

而是：

```text
Engineering latent state
  + alignment / binding
  + retrieval / ranking
  + evidence projection
  + LLM explanation / planning
```

### 1. 它和多 agent 系统的区别

普通多 agent 系统通常是：

```text
LLM 是中心
工具是手脚
状态是日志
子 agent 是任务分发者
```

我们真正想做的是：

```text
工程高维状态是中心
LLM 是解释器 / 规划器
工具负责更新状态
agent 只是工作流外壳
```

核心差别是：

> 多 agent 解决“谁来做事”；latent workspace 解决“信息以什么形式存在、如何被对齐、如何被查询、如何被复用”。

如果没有后者，只加更多 agent，仍然是低维 prompt 工作流。

### 2. 最小原型长什么样

可以从一个很小的芯片验证场景开始：

> 给定一次 regression failure，系统不直接把 log 粘给 LLM，而是先把 log、RTL diff、testcase、spec 和可选 waveform 转成共享工程状态空间。

最小输入：

```text
inputs/
  regression.log
  failing_tests.txt
  git_diff.patch
  rtl/
    target_module.sv
  spec.md
  optional_waveform.vcd
```

这些输入进入不同 encoder：

```text
Log Encoder
  regression.log → event sequence + failure signature vectors

RTL Encoder
  SystemVerilog → AST graph + module/interface/signal dependency graph

Diff Encoder
  git_diff.patch → change graph + touched modules/signals

Test Encoder
  failing_tests.txt → testcase scenario graph + failure distribution

Spec Encoder
  spec.md → requirement graph + protocol constraints

Waveform Encoder
  optional_waveform.vcd → signal transition features + suspicious time windows
```

注意：这里的关键不是把这些内容总结成自然语言，而是保留它们各自的结构。

### 3. Latent workspace 里保存什么

第一版不一定需要真正训练神经 latent。可以先用“结构化图 + embedding + provenance”的混合表示，作为工程 latent workspace 的可解释近似。

```text
workspace/
  objects.json
  embeddings/
    failure_signatures.vec
    log_events.vec
    rtl_nodes.vec
    spec_requirements.vec
    test_scenarios.vec
    waveform_segments.vec
  graphs/
    design_graph.json
    signal_dependency_graph.json
    change_graph.json
    requirement_graph.json
    evidence_graph.json
  indexes/
    vector_index
    symbol_index
    event_index
  provenance/
    source_spans.json
```

这里每个节点都要能追溯来源：

```text
failure_signature_17
  - 来自 regression.log 第 2481-2509 行
  - 对应 testcase dma_backpressure_random
  - 关联 signal fifo_full
  - 关联 RTL diff target_module.sv 第 83-101 行
  - 可能对应 spec.md 中 backpressure rule
```

这比“LLM 读一段 log 后给建议”更接近 high-to-high，因为系统首先建立了工程对象之间的高维关系。

### 4. LLM 在原型里的角色

LLM 不是主数据容器，而是三个角色：

```text
1. Query Translator
   把工程师的语言问题转成 workspace 查询。

2. Reasoning / Explanation Engine
   根据 workspace 返回的 evidence packet 做解释、排序和假设生成。

3. Action Planner
   根据当前不确定性建议下一步最小验证动作。
```

例如工程师问：

```text
为什么这批 regression 失败？
```

LLM 不应该直接读全部 log，而应该触发：

```text
query_workspace(
  failure_clusters,
  recent_diffs,
  related_signals,
  spec_constraints,
  similar_past_failures
)
```

然后 workspace 返回一个 evidence packet：

```text
Evidence Packet
  - cluster: dma_backpressure failures
  - repeated signature: timeout after fifo_full asserted
  - first suspicious commit: abc123
  - touched module: target_module.sv
  - related signal: fifo_full, ready_o
  - spec link: backpressure rule 3.2
  - suggested next check: rerun with fifo_full trace enabled
```

LLM 只负责把这个 packet 解释给人，并提出下一步动作。

### 5. 原型的数据流

整体流程可以是：

```text
1. Ingest
   读取 log、RTL、diff、test、spec、waveform。

2. Encode
   各模态生成结构化对象、图和 embedding。

3. Align
   把 failure event、RTL node、signal、testcase、spec requirement 对齐。

4. Store
   写入 Verification Latent Workspace。

5. Query
   工程师用语言提出目标，系统转成 workspace 查询。

6. Project
   workspace 返回小而密集的 evidence packet。

7. Explain
   LLM 生成工程师可读结论。

8. Act / Update
   运行最小 rerun 或其他验证动作，结果回写 workspace。
```

### 6. 第一版可以不用多个 agent

为了避免偏离 high-to-high，第一版甚至可以不要多 agent。

第一版只需要四个模块：

```text
1. Encoders
   把工程对象转成图、向量、索引和来源引用。

2. Workspace
   保存工程 latent state，并支持查询、相似度、图遍历和证据追踪。

3. Projector
   把 workspace 中相关的高维状态投影成小 evidence packet。

4. LLM Interface
   把人的语言目标转成查询，并把 evidence packet 解释成人话。
```

Agent 可以以后再加：

```text
Phase 1: latent workspace + LLM explanation
Phase 2: add action planner
Phase 3: add tool execution
Phase 4: add multi-agent workflow
```

这样可以保证核心不是“agent 越多越好”，而是“状态表示是否更好”。

### 7. 一个可见 demo

demo 可以很简单：

```text
命令：
  python build_workspace.py \
    --log inputs/regression.log \
    --diff inputs/git_diff.patch \
    --rtl inputs/rtl \
    --spec inputs/spec.md \
    --tests inputs/failing_tests.txt

  python ask_workspace.py "这次 regression 最可能的 root cause 是什么？"
```

输出不是纯 LLM 答案，而是：

```text
Top Hypothesis:
  target_module.sv 中 ready_o / fifo_full 相关改动可能导致 backpressure 场景 timeout。

Evidence:
  1. 失败 cluster 中 83% testcase 都在 fifo_full asserted 后 timeout。
  2. 最近 diff 修改了 target_module.sv 中 ready_o gating 条件。
  3. spec 3.2 要求 fifo_full 时 ready_o 必须在 2 cycle 内 deassert。
  4. optional waveform 显示 ready_o 延迟 deassert 5 cycle。

Next Minimal Check:
  rerun dma_backpressure_random with signals fifo_full, ready_o, valid_i dumped.

Uncertainty:
  waveform 只覆盖一个 testcase，需要确认 cluster 中其他 testcase 是否同样模式。
```

关键是每条 evidence 都能点击或追溯到原始 log / diff / spec / waveform。

### 8. 这才更像 high-to-high

这个原型的重点不是“LLM 更会说”，而是：

> 工程世界先进入一个结构化、高维、可对齐、可检索、可追溯的 workspace，再由 LLM 进行语言解释和行动规划。

因此它更接近：

```text
High-dimensional engineering world
  → engineering latent workspace
  → LLM / agent interface
```

而不是：

```text
High-dimensional engineering world
  → prompt summary
  → LLM
```

### 9. 最小判断

如果我们要做小原型，最应该先做的不是多个 agent，而是：

> 一个能把 regression failure、RTL diff、testcase、spec 和 waveform 绑定到同一个工程状态空间里的 Verification Latent Workspace。

LLM 是引擎，但不是容器；语言是控制入口，但不是全部输入；agent 是后续执行层，但不是第一性核心。

## 范式与应用场景的关系

这里必须再次澄清：芯片验证不是最终目标本身，它只是我们选择的第一个应用场景。

真正要探索的是一种范式：

> 如何让高维现实对象不再被压扁成 prompt，而是进入一个可计算、可对齐、可查询、可验证、可持续更新的高维工作空间，再由 LLM / LMM 作为解释、规划和交互引擎。

芯片验证只是这个范式的一个特别好的实验场，因为它同时具备：

- 多源输入：RTL、testbench、log、waveform、coverage、spec、git diff；
- 高复杂度：信号、状态机、协议、时序、工具链彼此耦合；
- 强证据要求：结论必须能追溯到 log、waveform、diff、spec；
- 可验证反馈：可以 rerun testcase、跑 regression、查 coverage、做 formal；
- 长期状态：历史 bug、历史修复、历史失败模式具有复用价值；
- 高成本上下文整理：工程师大量时间花在重建上下文和排查重复问题上。

因此，芯片验证不是因为它是唯一目标，而是因为它可以作为 high-to-high 范式的 stress test。

### 1. 范式本体是什么

范式本体不是：

```text
芯片验证 agent
```

而是：

```text
High-to-High Workspace Paradigm
```

它的通用结构是：

```text
Domain Objects
  ↓
Domain Encoders
  ↓
Shared Latent / Structured Workspace
  ↓
Evidence Projection
  ↓
LLM / LMM Explanation and Planning
  ↓
Action / Verification Feedback
  ↓
Workspace Update
```

在芯片验证里，Domain Objects 是 RTL、log、waveform、coverage。

在科研里，Domain Objects 可以是论文、图表、数据、实验记录、代码、引用网络。

在软件工程里，Domain Objects 可以是代码 AST、测试失败、日志、issue、PR diff、runtime traces。

在医学里，Domain Objects 可以是影像、化验结果、病历、时间序列、诊断假设、指南。

真正共通的是：

> 高维对象先进入领域 workspace，而不是先被压成 prompt。

### 2. 芯片验证在这个范式中的角色

芯片验证是第一个落地场景，用来回答：

```text
这种范式是否比 direct prompt 更适合复杂、高维、证据密集、可验证的工程任务？
```

它不是为了做一个普通 EDA automation bot，而是为了验证以下通用假设：

1. **表示假设**
   领域对象保留结构后，比压缩成文本更有用。

2. **对齐假设**
   不同对象之间的关联，例如 log ↔ signal ↔ RTL diff ↔ spec，可以在 workspace 中稳定表示。

3. **证据假设**
   LLM 基于 evidence packet 输出，比直接读长 prompt 更可追踪、更可信。

4. **反馈假设**
   每次验证动作的结果回写 workspace 后，系统会随着使用变得更有效。

5. **迁移假设**
   如果芯片验证场景成立，同样的范式可以迁移到科研、软件工程、复杂设计和其他知识工作。

### 3. 它不是只做“验证”

“验证”在这里有两层意思：

```text
芯片验证：
  具体应用场景，例如 regression、coverage、waveform、formal。

范式验证：
  验证 high-to-high workspace 是否真的优于 direct prompt。
```

我们做芯片验证，不是把项目限制成一个 verification 工具，而是用 verification 作为范式的实验环境。

因为芯片验证非常适合检验这个范式：

- 它有真实复杂度；
- 它有严格证据链；
- 它有可测量结果；
- 它有重复任务；
- 它有大量跨模态工程对象；
- 它能清楚比较 direct prompt 和 workspace 方法的差异。

### 4. 更准确的项目表述

当前项目不应该表述为：

> 做一个芯片验证 AI agent。

更准确的表述应该是：

> 以芯片验证为第一个实验场，探索一种 high-to-high AI 工作空间范式：将领域高维对象编码到共享 workspace 中，让 LLM / LMM 不再作为全部信息的容器，而作为解释、规划和交互引擎。

### 5. 原型的意义

因此，小原型的目标不是直接做出最终产品，而是验证范式是否成立：

```text
Direct Prompt:
  把领域对象压缩成文本后交给 LLM。

Workspace Paradigm:
  先构建领域 workspace，再把相关 evidence packet 投影给 LLM。
```

如果 workspace paradigm 在芯片验证中体现出更好的证据追踪、上下文复用、跨对象绑定和反馈更新能力，它就不只是一个 verification tool，而是一种可以推广的交互和认知范式。

## 实现路线：先验证 workspace，再训练 latent model

现在不能直接跳到“训练一个大模型”，也不能从多 agent 编排开始。更稳的实现路径应该是：

> 先做一个可验证的 High-to-High Workspace 原型，再判断是否值得训练领域 latent model。

### 0. 当前 Agent 与我们要做的东西有什么不同

现在的 Agent 看起来已经能处理多个东西：文件、网页、代码、图片、日志、工具输出、数据库、shell 结果等。但大多数 Agent 的真实流程仍然是：

```text
多源对象
  ↓
文本化 / JSON 化 / tool result 化
  ↓
LLM 语言上下文
  ↓
LLM 推理
```

也就是说，它们是：

> 多工具 + 语言中心。

我们要探索的不是“能不能处理多个输入”，而是：

> 多个输入进入系统之后，是否仍然全部被压成语言？还是能保留它们原本的结构、关系、时序和来源？

普通 Agent 的重点是：

```text
谁来调工具、谁来执行步骤、谁来总结结果。
```

High-to-High Workspace 的重点是：

```text
领域对象以什么形式存在、如何被对齐、如何被查询、如何被复用。
```

因此，真正的实现核心不是增加更多子 Agent，而是构建一个 workspace：

```text
工程对象
  → 编码
  → workspace
  → evidence packet
  → LLM 解释 / 规划
```

而不是：

```text
工程对象
  → 全部转成 prompt
  → LLM 猜测
```

这个区别决定了项目是否真的不同于现有 Agent 范式。

核心目标是先比较：

```text
A. Direct Prompt
   log + diff + RTL + spec → LLM

B. Workspace Paradigm
   log + diff + RTL + spec → workspace → evidence packet → LLM
```

如果 B 没有明显优势，就说明这个范式至少在当前场景下不成立。

### 0.1 最小实现的四个核心模块

真正的第一版不需要多 Agent，也不需要先训练大模型。最小实现只有四个核心模块：

```text
1. Encoders
   把不同领域对象转成结构化表示。

2. Workspace
   保存图、向量、索引、来源、关系和跨对象绑定。

3. Projector
   从 workspace 中取出当前问题相关的 evidence packet。

4. LLM Interface
   把人的语言问题转成 workspace 查询，再把 evidence packet 解释成人话。
```

在芯片验证场景中，输入对象可以是：

```text
regression.log
git_diff.patch
RTL / SystemVerilog
spec.md
failing_tests.txt
waveform.vcd
```

它们分别被编码成：

```text
Log Encoder:
  log → event sequence + failure signature

RTL Encoder:
  RTL → module graph + signal graph + AST

Diff Encoder:
  diff → changed modules / signals / functions

Spec Encoder:
  spec → requirement graph

Test Encoder:
  tests → testcase scenario graph

Waveform Encoder:
  waveform → signal transition features
```

关键是：

> 不要先总结成自然语言，而是先进入 workspace。

### 0.2 Workspace 的最小数据形态

MVP 不需要复杂数据库，可以先用 JSON、图结构和向量索引：

```text
workspace/
  objects.json
  edges.json
  embeddings/
  source_spans.json
  evidence_graph.json
```

一个对象可以长这样：

```json
{
  "id": "failure_001",
  "type": "log_event",
  "signature": "timeout_after_fifo_full",
  "source": {
    "file": "regression.log",
    "lines": [2481, 2509]
  },
  "linked_objects": [
    "test_dma_backpressure_random",
    "signal_fifo_full",
    "rtl_target_module_ready_o"
  ]
}
```

这个结构让系统知道：

```text
这个失败来自哪里；
关联哪个 testcase；
关联哪个 signal；
关联哪个 RTL diff；
关联哪个 spec rule。
```

这才是 high-to-high 的工程近似：不是直接把对象语言化，而是在 workspace 中保留它们的结构和关联。

### 0.3 Projector 是关键

Projector 不让 LLM 读取整个 workspace，而是投影出一个小而密集的 evidence packet：

```text
Evidence Packet:
  failure_cluster: dma_backpressure
  repeated_signature: timeout after fifo_full asserted
  suspicious_diff: target_module.sv ready_o gating changed
  related_spec: backpressure rule 3.2
  related_signal: fifo_full, ready_o
  next_check: rerun with fifo_full / ready_o dumped
```

LLM 只解释这个 packet，并提出下一步验证动作。

所以 LLM 的角色不是全部信息的容器，而是：

```text
1. Query Translator
   把用户问题转成 workspace 查询。

2. Explanation Engine
   把 evidence packet 解释成人能理解的结论。

3. Action Planner
   根据当前不确定性提出下一步验证动作。
```

这就是实现上的关键分工。

### 1. 第一阶段目标

第一阶段不是做完整产品，而是做一个最小范式验证：

> 给定一组芯片验证材料，系统能否先构建 workspace，再从 workspace 投影出 evidence packet，让 LLM 基于证据解释，而不是直接把所有材料塞进 prompt？

这个阶段要验证的是：

- workspace 能否保留比 prompt 更好的结构；
- evidence packet 是否比长 prompt 更清晰；
- LLM 是否能基于 evidence packet 给出更可靠解释；
- 每条结论是否能追溯到原始 log、diff、RTL、spec；
- 系统是否能减少输入 token 和人工上下文整理成本。

### 2. 最小原型架构

```text
Domain Inputs
  - regression.log
  - failing_tests.txt
  - git_diff.patch
  - rtl/*.sv
  - spec.md
  - optional waveform

        ↓

Domain Encoders
  - Log Encoder
  - RTL Encoder
  - Diff Encoder
  - Test Encoder
  - Spec Encoder
  - Waveform Encoder

        ↓

Shared Workspace
  - typed graph
  - vector index
  - event index
  - provenance map

        ↓

Projector
  - 取出和当前问题最相关的 evidence packet

        ↓

LLM Interface
  - 解释 evidence
  - 生成 hypothesis
  - 提出 next check
```

这里 LLM 不是容器。真正的核心是 workspace。

### 3. 第一版不要训练模型

第一版先使用：

- parser；
- graph；
- embedding；
- rule-based alignment；
- source provenance；
- vector search。

原因是：先证明信息结构有用，再决定是否训练模型。

第一版需要建立的绑定关系包括：

```text
log event ↔ failing testcase
log event ↔ signal name
signal name ↔ RTL node
RTL node ↔ git diff
spec sentence ↔ signal / protocol rule
failure signature ↔ similar historical failure
```

这些绑定关系就是 workspace 的核心价值。

### 4. 第一版目录结构

```text
/high_to_high_workspace
  /examples
    /case_001
      regression.log
      failing_tests.txt
      git_diff.patch
      spec.md
      rtl/

  /encoders
    log_encoder.py
    rtl_encoder.py
    diff_encoder.py
    spec_encoder.py
    test_encoder.py

  /workspace
    build_workspace.py
    graph_store.py
    vector_store.py
    provenance.py

  /projector
    build_evidence_packet.py

  /llm_interface
    ask_workspace.py
    prompts/

  /eval
    direct_prompt_baseline.py
    workspace_baseline.py
    score_outputs.py
```

这个目录只是实现草图。它不是最终形态，但能支撑第一轮范式验证。

### 5. 最小 demo

运行：

```text
python build_workspace.py examples/case_001
python ask_workspace.py "这次 regression 最可能的 root cause 是什么？"
```

输出不应该是普通聊天回答，而应该是：

```text
Hypothesis:
  ready_o / fifo_full 相关改动可能导致 backpressure timeout。

Evidence:
  - 83% failing tests 都在 fifo_full asserted 后 timeout。
  - 最近 diff 修改了 ready_o gating logic。
  - spec 3.2 要求 fifo_full 后 ready_o 在 2 cycles 内 deassert。
  - log 第 2481-2509 行出现相同 timeout signature。

Next Check:
  rerun dma_backpressure_random with fifo_full, ready_o, valid_i dumped。

Uncertainty:
  目前缺少完整 waveform，需要确认其他 failing tests 是否同样 pattern。
```

每条 evidence 都必须能追溯到原始来源。

### 6. 第二阶段才训练 latent model

如果第一版证明 workspace 有用，再训练小的领域表示模型。

训练数据可以是：

```text
log snippet ↔ RTL node
failure signature ↔ bug fix commit
waveform segment ↔ signal behavior
spec rule ↔ assertion / testcase
testcase failure ↔ root cause module
```

训练目标是：

```text
相关对象 embedding 靠近
不相关对象 embedding 远离
```

这时才真正进入：

> Engineering Latent Model

而不是脚本系统。

### 7. 分阶段路线

```text
Phase 0：准备 5-10 个真实或模拟 failure cases
Phase 1：做 direct prompt baseline
Phase 2：做 workspace MVP
Phase 3：比较 workspace 是否优于 direct prompt
Phase 4：如果有效，训练领域 latent encoder
Phase 5：加入 action / rerun / feedback loop
Phase 6：最后再考虑 multi-agent
```

多 agent 是最后，不是开始。

### 8. 当前最关键的一步

现在最应该做的是：

> 一个 case-based workspace benchmark。

也就是准备几个芯片验证 failure case，然后比较：

```text
Direct Prompt
  vs
Workspace Evidence Packet
```

如果 workspace 不能赢，就停止或重新定义范式。
如果 workspace 能赢，再继续做 latent model。

## 进一步研究方向

后续可以继续深入以下问题：

1. **高维 latent 接口如何标准化？**  
   不同模型之间是否可以直接交换 latent state，而不是都翻译成自然语言？

2. **多模态 codec 应该按什么目标训练？**  
   是重建原始输入，还是保留任务相关语义和可行动信息？

3. **AI 的世界状态如何长期维护？**  
   哪些内容进入短期工作记忆，哪些进入长期用户记忆，哪些应该被遗忘？

4. **如何验证高维接口真的更高效？**  
   可以比较任务成功率、交互轮数、用户认知负担、模型调用成本和错误恢复能力。

5. **人类式多感官是否必要？**  
   AI 未必需要复制人的所有感官，但可能需要实现功能等价的多源状态建模。

## 一句话总结

未来 AI 不应该只是“语言模型 + 聊天框”，而应该逐渐走向：

> 多模态世界模型 + 高维语义接口 + 持续行动验证循环。

这可能是从当前 AI 工具走向更接近人类协作方式的关键路径。
