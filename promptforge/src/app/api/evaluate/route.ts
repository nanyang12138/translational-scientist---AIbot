import { NextResponse } from "next/server";
import type { StructuredPrompt, TestCase } from "@/lib/types";
import { evaluatePrompt } from "@/lib/evaluate";
import { runtimeInfo } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      prompt?: StructuredPrompt;
      cases?: TestCase[];
    };
    if (!body.prompt) {
      return NextResponse.json({ error: "缺少 prompt。" }, { status: 400 });
    }
    const cases = (body.cases || []).filter((c) => c?.input?.trim());
    if (cases.length === 0) {
      return NextResponse.json(
        { error: "请至少提供一个测试用例。" },
        { status: 400 },
      );
    }
    const evaluation = await evaluatePrompt(body.prompt, cases);
    return NextResponse.json({ evaluation, runtime: runtimeInfo() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "评估失败" },
      { status: 500 },
    );
  }
}
