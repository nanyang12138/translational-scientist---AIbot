import type {
  EvaluationReport,
  StructuredPrompt,
  TestCase,
  TestResult,
} from "./types";
import { chat, chatJSON, isLive } from "./llm";
import { renderPrompt } from "./templates";

const PASS_THRESHOLD = 70;

const JUDGE_SYSTEM = `你是一名严格的提示词评审专家。给定"提示词"、"输入"、"模型实际输出"以及可选的"期望表现",请按以下维度评分(0-100):
- 是否准确完成任务
- 是否满足输出格式与约束
- 是否完整、无明显遗漏或幻觉

严格输出 JSON: {"score": 0-100 的整数, "feedback": "简明指出问题与改进建议"}
只输出 JSON。`;

/**
 * 针对一组测试用例评估提示词。
 * Live 模式:先用被测提示词跑出每个输入的输出,再用 LLM-as-Judge 打分。
 * Mock 模式:用启发式给出可解释的占位评分,保证离线可演示。
 */
export async function evaluatePrompt(
  prompt: StructuredPrompt,
  cases: TestCase[],
): Promise<EvaluationReport> {
  const rendered = renderPrompt(prompt);
  const results: TestResult[] = [];

  for (const c of cases) {
    if (!isLive()) {
      results.push(mockResult(prompt, c));
      continue;
    }
    try {
      const output = await chat(
        [
          { role: "system", content: rendered },
          { role: "user", content: c.input },
        ],
        { temperature: 0.3 },
      );
      const judged = await chatJSON<{ score: number; feedback: string }>(
        [
          { role: "system", content: JUDGE_SYSTEM },
          {
            role: "user",
            content:
              `# 提示词\n${rendered}\n\n# 输入\n${c.input}\n\n# 模型输出\n${output}\n\n# 期望表现\n${c.expectation || "(未指定,按任务合理性判断)"}`,
          },
        ],
        { temperature: 0 },
      );
      const score = clamp(Math.round(judged.score));
      results.push({
        caseId: c.id,
        input: c.input,
        output,
        score,
        passed: score >= PASS_THRESHOLD,
        feedback: judged.feedback || "",
      });
    } catch {
      results.push(mockResult(prompt, c));
    }
  }

  return summarize(results);
}

function summarize(results: TestResult[]): EvaluationReport {
  const n = results.length || 1;
  const averageScore = Math.round(
    results.reduce((s, r) => s + r.score, 0) / n,
  );
  const passRate = Math.round(
    (results.filter((r) => r.passed).length / n) * 100,
  );
  return { averageScore, passRate, results };
}

/** Mock 评估:基于提示词完整度给出可解释的启发式分数 */
function mockResult(prompt: StructuredPrompt, c: TestCase): TestResult {
  let score = 55;
  const notes: string[] = [];
  if (prompt.outputFormat?.trim()) {
    score += 15;
  } else {
    notes.push("缺少明确的输出格式说明");
  }
  if (prompt.constraints?.length >= 2) {
    score += 12;
  } else {
    notes.push("约束偏少,边界情况可能处理不稳");
  }
  if (prompt.role?.trim()) score += 8;
  if (prompt.examples?.length) score += 8;
  if (prompt.reasoning?.trim()) score += 2;
  score = clamp(score);

  const feedback =
    notes.length > 0
      ? `(离线评估)结构较完整,但${notes.join("、")}。配置 OPENAI_API_KEY 后可获得真实模型评分。`
      : "(离线评估)提示词结构完整。配置 OPENAI_API_KEY 后可获得真实模型评分。";

  return {
    caseId: c.id,
    input: c.input,
    output: "(Mock 模式:未实际调用模型生成输出)",
    score,
    passed: score >= PASS_THRESHOLD,
    feedback,
  };
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
