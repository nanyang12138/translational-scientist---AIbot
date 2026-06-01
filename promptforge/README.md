# PromptForge · 提示词锻造工坊

把模糊的想法,锻造成**规范、可测、可迭代**的高质量提示词。

PromptForge 不是又一个"随便给你生成一段 prompt"的工具。它把提示词工程的方法论产品化为一个完整闭环:

```
澄清意图  →  合成结构化Prompt  →  用测试用例评分  →  根据反馈自动优化
Clarify        Synthesize            Test / Judge          Optimize
```

## 为什么是这套闭环

高质量产出 ≈ **好的 Prompt × 好的 Context × 好的 Verification(验证闭环)**,三者相乘。

大多数工具只做了"合成"一步。PromptForge 的差异点在于把**评估**与**自动优化**也做进产品:写出来的提示词能被测试集打分,并据此反思式改写,这才让产出从"看起来对"走向"足够好"。

## 核心特性

- **意图澄清**:目标、任务类型、受众、语气、输入/输出形态、硬约束。
- **结构化合成**:按任务类型(编码、写作、抽取、分类、对话、智能体等)套用元提示词模板,产出分节结构化提示词。
- **测试评估**:用测试用例运行提示词,LLM-as-Judge 按评分标准打分并给出反馈。
- **自动优化**:阅读失败用例与反馈,做精准的反思式改写。
- **版本历史**:对比每次迭代的得分变化。
- **离线可用**:未配置 API Key 时自动进入 Mock 模式,完整流程仍可演示。

## 技术栈

- Next.js 16(App Router)+ React 19 + TypeScript
- Tailwind CSS v4
- OpenAI 兼容的 Chat Completions 接口(可指向任意兼容服务)

## 本地运行

```bash
cd promptforge
npm install

# 可选:接入真实模型(不配置则为离线 Mock 模式)
cp .env.example .env.local
# 然后在 .env.local 填入 OPENAI_API_KEY

npm run dev
# 打开 http://localhost:3000
```

构建生产版本:

```bash
npm run build && npm start
```

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI 兼容接口的 Key,缺失则进入 Mock 模式 | 无 |
| `OPENAI_BASE_URL` | 接口地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 模型名 | `gpt-4o-mini` |

## 目录结构

```
src/
  app/
    page.tsx              # 可视化工作流 UI
    layout.tsx
    globals.css
    api/
      synthesize/route.ts # 合成结构化提示词
      evaluate/route.ts   # 测试集评估(LLM-as-Judge)
      optimize/route.ts   # 反思式自动优化
      runtime/route.ts     # 返回运行模式(live / mock)
  lib/
    types.ts              # 共享类型
    taskTypes.ts          # 任务类型与启发式分类
    templates.ts          # 提示词模板与渲染
    llm.ts                # LLM 客户端(OpenAI 兼容 + Mock)
    synthesize.ts         # 合成逻辑
    evaluate.ts           # 评估逻辑
    optimize.ts           # 优化逻辑
```
