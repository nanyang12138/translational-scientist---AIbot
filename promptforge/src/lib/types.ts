// 共享类型定义：贯穿"澄清意图 → 合成 → 评估 → 优化"整个闭环

/** 任务类型：不同类型对应不同的提示词模板策略与上下文策略 */
export type TaskType =
  | "general"
  | "coding"
  | "writing"
  | "extraction"
  | "classification"
  | "summarization"
  | "translation"
  | "chatbot"
  | "agent";

export interface TaskTypeMeta {
  id: TaskType;
  label: string;
  description: string;
  /** 用于启发式分类的关键词（中英文） */
  keywords: string[];
  /** 该任务类型默认是否需要 few-shot 示例 */
  preferExamples: boolean;
  /** 该任务类型默认是否需要显式推理（思维链 / 自检） */
  preferReasoning: boolean;
}

/** 用户意图：澄清阶段收集的结构化信息 */
export interface PromptIntent {
  /** 用户想让模型完成什么（原始目标） */
  goal: string;
  taskType: TaskType;
  /** 面向的受众 / 使用场景 */
  audience?: string;
  /** 输入形态描述 */
  inputFormat?: string;
  /** 期望输出形态 */
  outputFormat?: string;
  /** 硬约束（不能做什么、长度、合规等） */
  constraints?: string[];
  /** 语气风格 */
  tone?: string;
  /** 目标模型（不同模型提示词风格略有差异） */
  targetModel?: string;
}

/** 结构化提示词：产品的核心产物 */
export interface StructuredPrompt {
  role: string;
  task: string;
  context: string;
  constraints: string[];
  /** 推理 / 自检要求 */
  reasoning: string;
  outputFormat: string;
  examples: PromptExample[];
}

export interface PromptExample {
  input: string;
  output: string;
}

/** 单条测试用例 */
export interface TestCase {
  id: string;
  input: string;
  /** 可选：期望表现的自然语言描述，用于评审打分 */
  expectation?: string;
}

/** 单条测试用例的评估结果 */
export interface TestResult {
  caseId: string;
  input: string;
  /** 被测提示词在该输入下产生的输出 */
  output: string;
  /** 0-100 分 */
  score: number;
  passed: boolean;
  /** 评审反馈：为什么扣分、如何改进 */
  feedback: string;
}

/** 一次完整评估的汇总 */
export interface EvaluationReport {
  averageScore: number;
  passRate: number;
  results: TestResult[];
}

/** 提示词的一个版本（用于历史对比） */
export interface PromptVersion {
  version: number;
  prompt: StructuredPrompt;
  rendered: string;
  evaluation?: EvaluationReport;
  /** 该版本相对上一版做了什么修改 */
  changeNote?: string;
  createdAt: number;
}

/** 运行模式：真实 LLM 还是离线 Mock */
export interface RuntimeInfo {
  mode: "live" | "mock";
  model?: string;
}
