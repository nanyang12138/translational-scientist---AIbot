import type { PromptIntent, StructuredPrompt, TaskType } from "./types";
import { chatJSON, isLive } from "./llm";
import { classifyTaskHeuristic } from "./taskTypes";
import { synthesizeHeuristic } from "./templates";

const SYNTH_SYSTEM = `你是一名世界级的提示词工程专家。你的工作是把用户模糊的意图,转化为一份"规范、结构化、可被模型稳定执行"的提示词。

你必须严格输出一个 JSON 对象,字段如下:
{
  "role": "给目标模型设定的角色与人设",
  "task": "清晰、单一、可执行的任务描述",
  "context": "目标模型会收到什么输入 / 上下文的说明",
  "constraints": ["硬约束1", "硬约束2", ...],
  "reasoning": "对推理过程 / 自检的要求(简单任务可以很短)",
  "outputFormat": "对输出格式的明确规定,越具体越好",
  "examples": [{"input": "示例输入", "output": "示例输出"}]
}

原则:
- 任务描述要单一、具体、无歧义。
- 约束要可执行、可验证;包含"信息不足时如何处理"。
- 抽取/分类等格式敏感任务,输出格式要严格(如 JSON schema),并尽量给 1-2 个示例。
- 简单任务做减法:不要强加思维链或示例。
- 只输出 JSON,不要任何额外文字。`;

function buildUserMessage(intent: PromptIntent): string {
  const lines = [
    `用户目标: ${intent.goal}`,
    `任务类型: ${intent.taskType}`,
  ];
  if (intent.audience) lines.push(`目标受众: ${intent.audience}`);
  if (intent.inputFormat) lines.push(`输入形态: ${intent.inputFormat}`);
  if (intent.outputFormat) lines.push(`期望输出: ${intent.outputFormat}`);
  if (intent.tone) lines.push(`语气风格: ${intent.tone}`);
  if (intent.targetModel) lines.push(`目标模型: ${intent.targetModel}`);
  if (intent.constraints?.length)
    lines.push(`额外约束: ${intent.constraints.join("; ")}`);
  return lines.join("\n");
}

/** 自动推断任务类型(若调用方未指定 / 指定为 general 时) */
export function resolveTaskType(goal: string, given?: TaskType): TaskType {
  if (given && given !== "general") return given;
  return classifyTaskHeuristic(goal);
}

/**
 * 合成结构化提示词。优先调用 LLM;失败或未配置时降级为启发式模板。
 */
export async function synthesizePrompt(
  intent: PromptIntent,
): Promise<StructuredPrompt> {
  const resolved: PromptIntent = {
    ...intent,
    taskType: resolveTaskType(intent.goal, intent.taskType),
  };

  if (!isLive()) {
    return synthesizeHeuristic(resolved);
  }

  try {
    const result = await chatJSON<StructuredPrompt>(
      [
        { role: "system", content: SYNTH_SYSTEM },
        { role: "user", content: buildUserMessage(resolved) },
      ],
      { temperature: 0.5 },
    );
    return normalize(result, resolved);
  } catch {
    // LLM 失败兜底,保证始终有产出
    return synthesizeHeuristic(resolved);
  }
}

/** 规整 LLM 返回,补齐缺失字段,防止 UI 崩溃 */
function normalize(p: Partial<StructuredPrompt>, intent: PromptIntent): StructuredPrompt {
  const fallback = synthesizeHeuristic(intent);
  return {
    role: p.role?.trim() || fallback.role,
    task: p.task?.trim() || fallback.task,
    context: p.context?.trim() || fallback.context,
    constraints:
      Array.isArray(p.constraints) && p.constraints.length
        ? p.constraints.filter((c) => typeof c === "string" && c.trim())
        : fallback.constraints,
    reasoning: p.reasoning?.trim() || fallback.reasoning,
    outputFormat: p.outputFormat?.trim() || fallback.outputFormat,
    examples:
      Array.isArray(p.examples)
        ? p.examples
            .filter((e) => e && typeof e.input === "string" && typeof e.output === "string")
            .slice(0, 3)
        : fallback.examples,
  };
}
