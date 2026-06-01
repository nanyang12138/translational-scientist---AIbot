import { NextResponse } from "next/server";
import { runtimeInfo } from "@/lib/llm";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ runtime: runtimeInfo() });
}
