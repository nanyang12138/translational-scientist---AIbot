import type { RuntimeInfo } from "./types";

/**
 * LLM 客户端:封装 OpenAI 兼容的 Chat Completions 接口。
 *
 * 通过环境变量配置:
 *   - OPENAI_API_KEY   : 必填(缺失则进入 Mock 模式)
 *   - OPENAI_BASE_URL  : 选填,默认 https://api.openai.com/v1
 *   - OPENAI_MODEL     : 选填,默认 gpt-4o-mini
 *
 * 设计要点:没有 Key 时不报错,而是降级为离线 Mock,保证产品始终可演示。
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  /** 要求返回严格 JSON */
  json?: boolean;
  maxTokens?: number;
}

function config() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

export function isLive(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function runtimeInfo(): RuntimeInfo {
  const { model } = config();
  return isLive() ? { mode: "live", model } : { mode: "mock" };
}

/** 调用 LLM 进行一次对话补全。仅在 isLive() 为真时可用。 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const { apiKey, baseUrl, model } = config();
  if (!apiKey) {
    throw new Error("LLM 未配置(缺少 OPENAI_API_KEY),应使用 Mock 路径。");
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.json) body.response_format = { type: "json_object" };

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`LLM 请求失败 (${resp.status}): ${text.slice(0, 500)}`);
  }

  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * 调用 LLM 并解析为 JSON 对象。带一次容错:若返回包含多余文本,尝试截取第一个 JSON。
 */
export async function chatJSON<T>(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<T> {
  const raw = await chat(messages, { ...opts, json: true });
  return parseJSON<T>(raw);
}

export function parseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // 容错:截取首个 { ... } 或 [ ... ]
    const match = raw.match(/[{[][\s\S]*[}\]]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error("无法将 LLM 输出解析为 JSON。");
  }
}
