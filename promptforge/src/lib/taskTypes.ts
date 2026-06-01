import type { TaskType, TaskTypeMeta } from "./types";

/** 任务类型元数据表：决定不同任务的提示词合成策略 */
export const TASK_TYPES: TaskTypeMeta[] = [
  {
    id: "general",
    label: "通用任务",
    description: "无法明确归类的一般性任务",
    keywords: [],
    preferExamples: false,
    preferReasoning: false,
  },
  {
    id: "coding",
    label: "代码 / 编程",
    description: "编写、重构、调试、解释代码",
    keywords: [
      "代码", "编程", "函数", "重构", "调试", "bug", "报错", "脚本", "算法",
      "code", "coding", "function", "refactor", "debug", "script", "api", "sql",
    ],
    preferExamples: false,
    preferReasoning: true,
  },
  {
    id: "writing",
    label: "内容创作",
    description: "文案、文章、营销、创意写作",
    keywords: [
      "写作", "文案", "文章", "营销", "创意", "标题", "故事", "改写", "润色", "博客",
      "writing", "copywriting", "article", "blog", "marketing", "story", "headline",
    ],
    preferExamples: true,
    preferReasoning: false,
  },
  {
    id: "extraction",
    label: "信息抽取",
    description: "从文本中抽取结构化字段",
    keywords: [
      "抽取", "提取", "解析", "字段", "结构化", "实体", "json",
      "extract", "parse", "entity", "field", "structured",
    ],
    preferExamples: true,
    preferReasoning: false,
  },
  {
    id: "classification",
    label: "分类 / 判别",
    description: "把输入归类到固定标签",
    keywords: [
      "分类", "归类", "判别", "标签", "情感", "意图识别",
      "classify", "classification", "label", "sentiment", "category", "intent",
    ],
    preferExamples: true,
    preferReasoning: false,
  },
  {
    id: "summarization",
    label: "摘要 / 总结",
    description: "对长文本进行概括",
    keywords: [
      "摘要", "总结", "概括", "归纳", "提炼",
      "summarize", "summary", "tldr", "digest",
    ],
    preferExamples: false,
    preferReasoning: false,
  },
  {
    id: "translation",
    label: "翻译",
    description: "在不同语言间转换",
    keywords: [
      "翻译", "译成", "中译英", "英译中", "本地化",
      "translate", "translation", "localize",
    ],
    preferExamples: false,
    preferReasoning: false,
  },
  {
    id: "chatbot",
    label: "对话机器人",
    description: "客服、助手等多轮对话角色",
    keywords: [
      "客服", "机器人", "助手", "对话", "聊天", "导购",
      "chatbot", "assistant", "customer service", "support", "agent persona",
    ],
    preferExamples: true,
    preferReasoning: false,
  },
  {
    id: "agent",
    label: "智能体 (Plan/Act)",
    description: "需要规划与工具调用的自主任务",
    keywords: [
      "智能体", "规划", "工具", "自动化", "多步骤", "plan", "act",
      "agent", "tool", "planning", "autonomous", "workflow",
    ],
    preferExamples: false,
    preferReasoning: true,
  },
];

const TASK_TYPE_MAP = new Map<TaskType, TaskTypeMeta>(
  TASK_TYPES.map((t) => [t.id, t]),
);

export function getTaskTypeMeta(id: TaskType): TaskTypeMeta {
  return TASK_TYPE_MAP.get(id) ?? TASK_TYPES[0];
}

/**
 * 基于关键词的启发式任务分类。
 * 用于在没有 LLM 或作为兜底时,从用户目标里猜测任务类型。
 */
export function classifyTaskHeuristic(goal: string): TaskType {
  const text = goal.toLowerCase();
  let best: { id: TaskType; score: number } = { id: "general", score: 0 };
  for (const t of TASK_TYPES) {
    if (t.id === "general") continue;
    let score = 0;
    for (const kw of t.keywords) {
      if (text.includes(kw.toLowerCase())) score += 1;
    }
    if (score > best.score) best = { id: t.id, score };
  }
  return best.id;
}
