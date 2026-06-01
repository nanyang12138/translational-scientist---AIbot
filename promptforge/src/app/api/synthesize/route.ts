import { NextResponse } from "next/server";
import type { PromptIntent } from "@/lib/types";
import { synthesizePrompt } from "@/lib/synthesize";
import { renderPrompt } from "@/lib/templates";
import { runtimeInfo } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { intent?: PromptIntent };
    const intent = body.intent;
    if (!intent?.goal?.trim()) {
      return NextResponse.json(
        { error: "请填写你想让模型完成的目标(goal)。" },
        { status: 400 },
      );
    }
    const prompt = await synthesizePrompt(intent);
    return NextResponse.json({
      prompt,
      rendered: renderPrompt(prompt),
      runtime: runtimeInfo(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "合成失败" },
      { status: 500 },
    );
  }
}
