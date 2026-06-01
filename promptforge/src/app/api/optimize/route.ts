import { NextResponse } from "next/server";
import type { EvaluationReport, StructuredPrompt } from "@/lib/types";
import { optimizePrompt } from "@/lib/optimize";
import { renderPrompt } from "@/lib/templates";
import { runtimeInfo } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      prompt?: StructuredPrompt;
      evaluation?: EvaluationReport;
    };
    if (!body.prompt || !body.evaluation) {
      return NextResponse.json(
        { error: "需要 prompt 与 evaluation 才能优化。" },
        { status: 400 },
      );
    }
    const result = await optimizePrompt(body.prompt, body.evaluation);
    return NextResponse.json({
      prompt: result.prompt,
      rendered: renderPrompt(result.prompt),
      changeNote: result.changeNote,
      runtime: runtimeInfo(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "优化失败" },
      { status: 500 },
    );
  }
}
