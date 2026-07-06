# 阶段式 Agent + Flow 记忆：把 AI 嵌进芯片验证流程的设计记录

> 本文档整理自一次关于"如何把 AI 嵌套进验证 flow"的讨论。核心结论：不要在 flow 末端才叫 Agent 救火，而是让 Agent **常驻在每个阶段、趁热分析并存储**，下游出问题时**直接调用上游存好的分析**做跨阶段根因定位。

---

## 1. 起点：真正的痛点是什么

现状流程：

```
跑程序 → 出问题 → 打开 AI → 从头解释"我在做什么、跑到哪了、报了什么错" → AI 才开始帮忙
```

浪费时间的地方**不在于 AI 不够聪明，而在于每次求助都要重新建立"上下文"**。AI 默认是"无状态"的：不知道进度、不知道环境、不知道上一步做了什么。所以每次求助都在做"考前重新补课"。

要解决的核心是三个字：**上下文（context）**。让 AI 随时"在场"，而不是"被叫来"。

---

## 2. 能力拆解：这件事其实是三块

把"AI 嵌进 flow"这个笼统需求拆成工程上三件不同的事：

| # | 能力 | 解决的问题 | 对应概念 |
|---|---|---|---|
| 1 | **Skill（技能 / 知识）** | AI 知不知道"该怎么做" | Agent Skills |
| 2 | **State awareness（状态感知）** | AI 知不知道"你跑到哪了" | MCP / Context engineering |
| 3 | **Observability + Trigger（可观测 + 主动触发）** | 出问题它能不能"自己知道" | Ambient agents |

一句话区分：**Skill 解决"会不会做"，State awareness 解决"知不知道你现在的状态"，二者缺一不可。**

---

## 3. 相关技术谱系（这不是孤立点子）

- **Agent Skills**：把领域知识 / 流程打包成 AI 可加载的技能。
- **MCP（Model Context Protocol）**：让 AI 标准化地"读取工具 / 数据 / 状态"的协议，可实时接到 flow 的状态源。
- **Ambient agents / 环境智能体**：不需每次召唤、常驻工作环境、被事件驱动的智能体。
- **Context engineering（上下文工程）**：把"对的信息在对的时刻喂给模型"，被认为比 prompt engineering 更重要。
- **Blackboard architecture（黑板架构）**：经典 AI 模式——多个阶段把发现写到共享"黑板"，后续阶段读取协同推理。本设计可视为"LLM 时代的黑板架构"。
- **Agent memory / 持久化记忆**：让 agent 跨步骤累积、检索自己的分析。
- **Provenance / lineage（数据血缘）**：EDA/数据领域记录"每一步怎么来的"，但通常只记数据、不记推理。本设计的增量是给血缘**挂上 Agent 的判断**。

---

## 4. 落地领域：芯片验证 flow

场景：跑 testcase、跑 regression、用工具看结果（波形 / 覆盖率 / log）、验证数据正确性。

调试信息高度结构化，但散落各处：

| 信息源 | 现在的形态 | 对 AI 的问题 |
|---|---|---|
| 仿真 log | `UVM_ERROR/FATAL`、断言、backtrace | 几万行，人肉 grep |
| Regression 报告 | pass/fail、seed、runtime、config | 分散在 vManager / 自制脚本 / csv |
| 波形 | FSDB/VCD（二进制） | AI 读不了，得先抽信号 |
| 覆盖率 | coverage db / 报告 | 需要工具查询 |
| 数据正确性 | golden vs actual、scoreboard | 判断逻辑在人脑里 |

---

## 5. 核心设计：阶段式 Agent + Flow 记忆（本讨论的重点）

**关键区别：不是末端救火，而是 Agent 在每个阶段都存在。**

### 5.1 两个机制

1. **Eager analysis（趁热分析）**：每个固定阶段结束时，Agent 立刻对"本阶段发生了什么"做一次分析并**结构化存储**——存的是它的**判断和推理**（本阶段正常吗？哪些值不寻常但暂时 ok？基于什么假设？），而不仅是原始数据。
2. **Cross-stage retrieval（跨阶段回溯）**：下游阶段出问题时，Agent 不从零开始，而是**调出上游各阶段存好的分析**，做跨阶段根因定位。

### 5.2 为什么这个设计明显更好（核心洞察）

芯片验证的残酷现实：**下游阶段暴露的 bug，根因常在两三个阶段之前**——config 生成时的非默认值、elaboration 的一条被忽略的 warning、编译参数等。

- 传统"末端救火"：出问题时上游上下文要么丢了、要么要花大力气重建 → 这正是"浪费时间"的根源。
- "趁热分析"的精髓：**在阶段 2 解释"这个 config 为什么正常"是很便宜的**（信息都在手边、还热着）；等阶段 5 挂了再回去重建阶段 2 的上下文，又贵又失真。

> **本质：不是削减 AI 调用，而是把 AI 的分析放到"成本最低、信息最全"的时刻去做，换来一条高保真、可随取随用的"推理轨迹"。**

---

## 6. 具体设计

### 6.1 核心数据结构：每阶段一份"阶段分析记录"

```json
{
  "run_id": "regr_2026_0706_a",
  "stage": "elaboration",
  "stage_index": 3,
  "timestamp": "...",
  "judgment": "warning",              // normal / warning / abnormal
  "summary": "elab 通过，但 clk_gen 有一条 multi-driver warning 被降级处理",
  "flags": [                          // ← 专门留给下游的"线索"
    {"key": "clk_gen.multi_driver", "value": "W123", "note": "本次没报错但值得留意，改了时钟树"},
    {"key": "cfg.ASYNC_MODE", "value": true, "note": "非默认，跨时钟域路径变多"}
  ],
  "assumptions": ["假设 ASYNC_MODE 下 CDC 约束已正确加载"],
  "artifacts": {"log": "/regr/.../elab.log"},
  "confidence": 0.75
}
```

关键不是 log 路径，而是 **`flags` 和 `assumptions`**——Agent 趁热留给"未来自己"的便签。

### 6.2 沿 flow 的阶段划分

每个阶段结束挂一个 hook，触发一次分析并 append 到 flow memory：

```
config_gen → compile → elaboration → run(testcase) → check(数据正确性) → coverage
     └ 每一步：Agent 分析当前阶段 → 写一条 stage record → 存入 flow memory
```

### 6.3 三个核心组件（骨架）

1. **`stage_hook`**：在任意阶段收尾时调用，让 Agent 分析并生成一条 stage record。
2. **`flow_memory`**：append + 按 `key` / `stage` 检索的存储层（JSONL 起步，量大了再上带检索的库）。
3. **`recall`**：出问题时按相关性拉取上游记录（涉及的信号 / 模块 / 字段），组织成给模型的上下文。

集成方式：只需在自己 flow 的每个阶段脚本末尾插一行 `stage_hook(...)`，对现有仿真流程**零侵入**（只"读"，不改仿真本身）。

---

## 7. 端到端示例（把价值讲透）

**传统模式：**
> check 阶段 scoreboard mismatch → grep run.log → 看波形 → 怀疑 CDC → 回头翻 elab.log 找 warning → 半天过去了。

**阶段式 Agent 模式：**
> check 阶段 mismatch → Agent 拉出 flow memory → 发现 elab 阶段自己留过便签"ASYNC_MODE 下 CDC 约束存疑" → 直接给出："mismatch 大概率是 CDC 亚稳态，根因在 elab 阶段那条被降级的 multi_driver warning，建议检查 clk_gen 约束"。

**上游的分析成了下游的答案。**

---

## 8. 关键设计注意点

- **每阶段做轻量分析**，只重点记 `flags`（对下游可能有用的异常 / 非默认值 / 假设），不要记流水账，否则 memory 被噪声淹没、成本失控。
- **让 Agent 显式判断"这条以后可能有用吗"**，只存有信号价值的内容。
- **检索按相关性过滤**（涉及的信号 / 模块 / 字段），不要把整条历史全塞回模型。
- 目标：flow memory 是"高信噪比的推理轨迹"，而不是又一堆没人看的 log。

---

## 9. 每阶段的"读取与产出"机制（核心）

架构层面说清楚"每阶段分析并存储"之后，真正的硬骨头在机制层面：
**（1）海量信息里怎么捞针？（2）上游存的东西，下游到底怎么真正用上？** 本节回答这两点。

### 9.1 三条底层原则

**原则 1：确定性预筛在前，LLM 只看被捞出来的"针"。**
绝不能把原始日志整个塞给 Agent。分两趟：

```
第 1 趟（确定性、无 LLM、几毫秒）：
    正则/规则扫日志 → 抓 exit code、错误标记、"cannot find/undefined/missing" 等
    → 输出很小的"候选集"（几行~几十行）

第 2 趟（LLM 推理）：
    只把候选集 + 相关上游记录喂给 Agent → 判断根因
```

海里捞针是预筛脚本干的，不是 LLM 干的。这同时解决"信息太多"和"成本太高"。预筛规则越用越准，**这些错误指纹本身就是方法学 skill 的一部分**。

**原则 2：每阶段存"它产出了什么"（provenance），下游按"输入 ← 产出"链回溯。**
flow 本质是产物传递链：

```
publish:      src/*.sv          → out/*.sv                （产出：发布清单）
rgb build:    out/ + filelists  → 编译文件集 + filelist    （产出：解析后的文件清单）
vcs compile:  filelist + defines → simv                   （产出：simv + 警告集）
simulation:   simv + seed/args  → pass/fail               （产出：结果 + failure signature）
```

**当某阶段因"输入不对"而挂，罪魁往往是上一阶段的"产出"。** 下游失败时 Agent 的核心动作：
把出问题的"东西"（文件/模块/信号）沿链条往上追，查上游记录里它是怎么被产出的。
这就是上游记录"有用"的唯一正确姿势——存的是**产出与解析决策**，不是感想。

**原则 3：通过 = 廉价记录，失败 = 深度分析。**
- 阶段**通过**：只做确定性廉价记录（清单、警告、config），基本不动 LLM——给未来的"存款"。
- 阶段**失败**：才启动完整 LLM 分析，并拉取相关上游存款。

### 9.2 逐阶段拆解（以本项目 testcase flow 为例）

flow：① makefile publish（src→out）② rgb build（收集文件）+ vcs compile ③ simulation

**阶段 1：makefile publish（范围小）**
- 失败模式：源文件缺失、权限、磁盘满、target/依赖错。
- 怎么读：预筛抓 `make: *** [target] Error` + 其上方实际报错，定位到哪个 target/文件。
- 输出：哪个文件没发布成功 + 原因 + 建议。
- 存款：**发布清单**（out/ 落了哪些文件、有无 skip/warning）——rgb build 失败时的救命对照物。

**阶段 2a：rgb build（海量信息）**
- 核心认知：收集成功的上千个文件都不重要，只找**没收集成功的那一个 + 它的来历**。不要理解整个 build。
- 怎么读：拿 exit code + rgb build 自己的错误标记（首次接入时把它的 error 文法学下来，之后就是规则匹配），抓出**哪个 filelist 条目/文件路径没解析成功**。
- 输出：哪个文件/模块没收到 + 应来自哪个 filelist 条目/src 路径。
- 跨阶段（原则 2 兑现）：报"找不到 `axi_slave.sv`" → 查**阶段 1 发布清单** → 发现 publish 根本没发出它（甚至留过 skip 警告）→ 根因在 publish，不在 rgb build。
- 强力技巧：与**上次成功的 build 清单做差集** → 只分析"这次比上次少了/变了哪个文件"，不分析全集。

**阶段 2b：vcs compile**
- 失败模式：语法错、module 未定义、端口/类型不匹配、缺 package、宏/define。
- 怎么读：VCS 错误高度结构化（`Error-[SE]`、`Error-[IND]`、`Error-[MPD]`… 带 file:line）。抽所有 `Error-[XXX]`，**只看第一个**（常一个根因级联几十条），按 code 分类。
- 输出：第一个根因错误的 code + file:line + 一句话解释 + 是真 RTL/TB bug 还是文件问题。
- 跨阶段（用 rgb build 产出）：报"module `foo` not found / `bar.sv` 找不到"→ 查 **rgb build 的 filelist**：
  - A：`bar.sv` 不在收集清单 → 上游漏收，不是 RTL bug。
  - B：`foo` 来自旧分支/旧路径 → 版本错，清单里路径/版本一目了然。
  - 于是输出"这不是编译 bug，是 rgb build 漏收/收错版本"，而不是让人去 debug 一段其实没错的 RTL。

**阶段 3：simulation**
- 失败模式：`UVM_ERROR/FATAL`、断言、scoreboard mismatch、超时/hang、X 传播、TB crash。
- 怎么读：预筛抓 `UVM_ERROR/FATAL`、`Assertion failed`、**第一条**出错时间戳附近片段；波形按需用工具抽指定信号，不直接读。
- 输出：failure signature + 失败时间点 + TB/DUT 初判 + 复现命令（seed/plusargs）。
- 跨阶段（用 compile 产出，即使 compile 通过也要按原则 3 廉价存）：
  - **被降级的编译警告**：`width mismatch`/`implicit net`/`sensitivity list incomplete` 等，sim 数据错时若正好涉及同一信号 → 直接指向根因。
  - **编译的 +define+ / 模式**：如 `+define+ASYNC_MODE`，sim 失败若配置相关，立刻知道往 CDC 方向查。
  - 即：sim 的很多"莫名其妙"，在 compile 阶段早有征兆，存下来即成先验线索。

### 9.3 两个贯穿全程的"捞针"技巧

1. **抓第一个错误，不是最后一个。** build/compile 级联错误常见，最后 N 行多是余震，第一条才是震源（与"看日志尾巴"的习惯相反）。
2. **和"上次成功"做差集。** 收集类/环境类失败，最快定位不是读全量，而是对比 last-known-good；前提是跨 run 存了成功记录。

### 9.4 于是"每阶段存什么"就清楚了

| 阶段 | 通过时廉价存（存款） | 失败时深度分析产出 |
|---|---|---|
| publish | 发布清单（哪些文件落到 out、skip/warning） | 哪个文件没发布 + 原因 |
| rgb build | 解析后的文件清单（文件→来源路径/版本） | 哪个文件没收到 + 来历 + 与上次差集 |
| vcs compile | 编译命令 + defines + **全部警告** + simv | 第一个根因错误 + 是否文件问题（查上游清单） |
| simulation | test/seed/plusargs + 结果 | failure signature + 借编译警告/模式做先验 |

每一栏的"存款"都不是给自己看的，是给下游当"回溯对照物"用的——上游记录才真正有用，而非存了个寂寞。

---

## 10. 落地路线（务实版）

```
① test/stage manifest 生成         ← 今天就能做，立刻省掉"重复解释"
② log 精炼 / failure signature 提取 ← 让 AI 读得懂 log
③ 2~3 个核心 MCP 工具              ← get_log_tail / compare_golden / get_signal_value
④ 方法学 skill（先写 1 类失败）     ← 从最常见的失败类型开始
⑤ 阶段式 Agent + flow memory       ← stage_hook / flow_memory / recall
⑥ regression 触发预诊断（ambient） ← 最后再接自动化
```

建议先打通 ①②③ 与 ⑤ 的最小闭环，单次 debug 效率即可翻倍，且对现有 flow 近乎零侵入。

---

## 11. 待确认（开工前）

1. flow 各阶段是**独立脚本 / Makefile 串起来**的，还是在一个大框架里跑？（决定 hook 怎么插）
2. flow memory 倾向**每个 run 一个本地目录 / 文件**，还是要能**跨 run 长期积累、跨项目复用**？（决定存储层设计）
3. 仿真器：VCS / Xcelium / Questa？（影响 log 格式与 signature 正则）
4. regression 怎么跑：vManager / 自制脚本 + LSF/SGE？结果落在哪（csv / db / 目录）？
5. 波形 / 覆盖率工具：Verdi(FSDB) / DVE / SimVision？
6. 验证框架是否 UVM？失败主要看 `UVM_ERROR` / scoreboard，还是有自制 checker？
7. AI 出现的形态：命令行 `ask "为什么这个 test fail"` / 嵌在脚本 / 后台常驻助手？

---

_文档状态：设计讨论记录（待细化为可运行骨架）。_
