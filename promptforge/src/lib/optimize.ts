import type {
  EvaluationReport,
  StructuredPrompt,
} from "./types";
import { chatJSON, isLive } from "./llm";
import { renderPrompt } from "./templates";

interface OptimizeOutput {
  prompt: StructuredPrompt;
  changeNote: string;
}

const OPTIMIZE_SYSTEM = `你是一名提示词优化专家。给定当前提示词(结构化 JSON)及其在测试集上的评估反馈,请产出一份"改进后"的提示词。

要求:
- 针对失败用例与反馈做精准修改,而不是大改重写。
- 优先补强:输出格式约束、边界情况处理、消除歧义。
- 不要为了改而改;若某方面已经很好则保留。

严格输出 JSON:
{
  "prompt": { "role": "...", "task": "...", "context": "...", "constraints": ["..."], "reasoning": "...", "outputFormat": "...", "examples": [{"input":"...","output":"..."}] },
  "changeNote": "用一句话概括本次改了什么、为什么"
}
只输出 JSON。`;

/**
 * 根据评估反馈优化提示词。
 * Live 模式:让 LLM 做反思式改写。
 * Mock 模式:基于评估反馈做确定性的结构补强。
 */
export async function optimizePrompt(
  prompt: StructuredPrompt,
  evaluation: EvaluationReport,
): Promise<OptimizeOutput> {
  if (!isLive()) {
    return optimizeHeuristic(prompt, evaluation);
  }

  try {
    const failures = evaluation.results
      .filter((r) => !r.passed)
      .map((r) => `输入: ${r.input}\n得分: ${r.score}\n反馈: ${r.feedback}`)
      .join("\n---\n");

    const result = await chatJSON<OptimizeOutput>(
      [
        { role: "system", content: OPTIMIZE_SYSTEM },
        {
          role: "user",
          content:
            `# 当前提示词(渲染版)\n${renderPrompt(prompt)}\n\n` +
            `# 评估汇总\n平均分: ${evaluation.averageScore} / 通过率: ${evaluation.passRate}%\n\n` +
            `# 失败用例与反馈\n${failures || "(无失败用例,可做轻度增强)"}`,
        },
      ],
      { temperature: 0.5 },
    );
    return {
      prompt: mergePrompt(prompt, result.prompt),
      changeNote: result.changeNote || "依据评估反馈进行了优化。",
    };
  } catch {
    return optimizeHeuristic(prompt, evaluation);
  }
}

/** 离线优化:确定性地补齐结构薄弱处 */
function optimizeHeuristic(
  prompt: StructuredPrompt,
  evaluation: EvaluationReport,
): OptimizeOutput {
  const next: StructuredPrompt = { ...prompt, constraints: [...prompt.constraints] };
  const changes: string[] = [];

  // 已接近满分时只做轻度处理,避免过度修改
  if (evaluation.averageScore >= 90) {
    return {
      prompt: next,
      changeNote: `(离线优化)平均分 ${evaluation.averageScore},已较优,未做大改。`,
    };
  }

  if (!next.outputFormat?.trim()) {
    next.outputFormat = "用清晰的结构化格式输出,关键信息使用列表或字段呈现。";
    changes.push("补充了输出格式");
  }
  const hasUncertainty = next.constraints.some((c) => c.includes("信息不足") || c.includes("不确定"));
  if (!hasUncertainty) {
    next.constraints.push("信息不足时,先列出所做假设或提出澄清问题,不要凭空编造。");
    changes.push("增加了不确定情况的处理约束");
  }
  if (next.constraints.length < 3) {
    next.constraints.push("输出前自检:是否完全满足任务目标与上述全部约束。");
    changes.push("增加了输出前自检约束");
  }

  return {
    prompt: next,
    changeNote:
      changes.length > 0
        ? `(离线优化)${changes.join("、")}。`
        : "(离线优化)结构已较完整,未做大改。",
  };
}

/** 合并:用优化结果覆盖,但对缺失字段回退到原值 */
function mergePrompt(orig: StructuredPrompt, next: Partial<StructuredPrompt>): StructuredPrompt {
  return {
    role: next.role?.trim() || orig.role,
    task: next.task?.trim() || orig.task,
    context: next.context?.trim() || orig.context,
    constraints:
      Array.isArray(next.constraints) && next.constraints.length
        ? next.constraints.filter((c) => typeof c === "string" && c.trim())
        : orig.constraints,
    reasoning: next.reasoning?.trim() || orig.reasoning,
    outputFormat: next.outputFormat?.trim() || orig.outputFormat,
    examples:
      Array.isArray(next.examples) && next.examples.length
        ? next.examples
            .filter((e) => e && typeof e.input === "string" && typeof e.output === "string")
            .slice(0, 3)
        : orig.examples,
  };
}
