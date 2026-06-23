import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "godot/data/game_config.json");
const FACTIONS_PATH = path.join(ROOT, "godot/data/factions.json");
const DEFAULT_PORT = 8787;
const MAX_BODY_BYTES = 512 * 1024;

const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
const factions = JSON.parse(await readFile(FACTIONS_PATH, "utf8"));
const statKeys = new Set(Object.keys(config.stats));
const factionIds = new Set(factions.map((faction) => faction.id));

export function createBridgeServer() {
  return createServer(async (request, response) => {
    try {
      if (!isAllowedOrigin(request)) {
        sendJson(response, 403, { error: "forbidden_origin" });
        return;
      }

      if (request.method === "OPTIONS") {
        response.writeHead(403);
        response.end();
        return;
      }

      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, {
          ok: true,
          service: "god-is-offline-agent-bridge",
          provider: getProvider(),
          model: getModelName(),
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/resolve") {
        const payload = await readJsonBody(request);
        const result = await resolveWithAgent(payload);
        sendJson(response, 200, result);
        return;
      }

      sendJson(response, 404, { error: "not_found" });
    } catch (error) {
      console.error(error);
      sendJson(response, 500, {
        error: "agent_bridge_error",
        message: "Agent Bridge request failed. Check the bridge console for details.",
      });
    }
  });
}

export async function resolveWithAgent(payload) {
  const oracle = normalizeText(payload?.oracle);
  const game = payload?.game && typeof payload.game === "object" ? payload.game : {};

  if (!oracle) {
    throw new Error("oracle is required");
  }

  const provider = getProvider();
  const model = getModelName();
  const raw =
    provider === "ollama"
      ? await callOllama({ oracle, game, model })
      : provider === "openai"
        ? await callOpenAICompatible({ oracle, game, model })
        : createMockAgentOutput({ oracle, game });

  return sanitizeAgentOutput(raw, { oracle, provider, model });
}

export function sanitizeAgentOutput(raw, context = {}) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const fallback = createMockAgentOutput({ oracle: context.oracle ?? "神谕", game: {} });
  const factionOutcomes = Array.isArray(safe.faction_outcomes) ? safe.faction_outcomes : [];
  const byId = new Map(factionOutcomes.map((item) => [String(item?.agent_id ?? ""), item]));
  const sanitizedFactions = factions.map((faction) => {
    const item = byId.get(faction.id) ?? {};
    return {
      agent_id: faction.id,
      agent_name: faction.name,
      color: faction.color,
      voice: limitText(item.voice ?? faction.voice, 160),
      action: limitText(item.action ?? `重新解释神谕以扩大${faction.name}的影响`, 180),
      interpretation: limitText(
        item.interpretation ?? `「${context.oracle ?? "神谕"}」被${faction.name}解读成一次可利用的政治机会。`,
        420
      ),
      deltas: sanitizeDeltas(item.deltas ?? {}),
      suspicion: clampInteger(item.suspicion ?? 48, 0, 100),
      memory: limitText(item.memory ?? "", 220),
    };
  });

  const rumor = sanitizeReport(safe.rumor ?? fallback.rumor, "rumor", "谣言群体");
  const citizenSource = safe.citizen && typeof safe.citizen === "object" ? safe.citizen : fallback.citizen;
  const uiSource = safe.ui && typeof safe.ui === "object" ? safe.ui : fallback.ui;

  return {
    ok: true,
    llm_enabled: context.provider !== "mock",
    provider: context.provider ?? "mock",
    model: context.model ?? "mock",
    headline: limitText(safe.headline ?? fallback.headline, 220),
    director_note: limitText(safe.director_note ?? fallback.director_note, 360),
    faction_outcomes: sanitizedFactions,
    rumor,
    citizen: {
      from: limitText(citizenSource.from ?? "无名来信者", 40),
      role: limitText(citizenSource.role ?? "圣玻璃城居民", 40),
      summary: limitText(citizenSource.summary ?? "有人写来一封信。", 160),
      body: limitText(citizenSource.body ?? "如果你真的是神,请下一次说得更像人一点。", 520),
    },
    ui: {
      panels: sanitizePanels(uiSource.panels),
      summary: limitText(uiSource.summary ?? "UI Agent 切换到解释权战争视图。", 240),
    },
    memories: sanitizeMemories(safe.memories),
  };
}

function sanitizeReport(source, agentId, agentName) {
  return {
    agent_id: agentId,
    agent_name: limitText(source.agent_name ?? agentName, 50),
    voice: limitText(source.voice ?? "每个人都只转述自己害怕的那一半。", 160),
    action: limitText(source.action ?? "制造三个互相矛盾但都足够可信的版本", 180),
    interpretation: limitText(source.interpretation ?? "谣言把神谕拆成互相冲突的版本。", 420),
    deltas: sanitizeDeltas(source.deltas ?? {}),
    suspicion: clampInteger(source.suspicion ?? 60, 0, 100),
  };
}

function sanitizeDeltas(deltas) {
  const output = {};
  for (const [key, value] of Object.entries(deltas ?? {})) {
    if (!statKeys.has(key)) continue;
    output[key] = clampInteger(value, -18, 18);
  }
  return output;
}

function sanitizePanels(panels) {
  const defaults = ["今日新闻", "六大阵营热度", "神谕解释分歧", "LLM 阴谋线索"];
  const values = Array.isArray(panels) ? panels : defaults;
  return values.map((panel) => limitText(panel, 32)).filter(Boolean).slice(0, 8);
}

function sanitizeMemories(memories) {
  if (!Array.isArray(memories)) return [];
  return memories.map((memory) => limitText(memory, 180)).filter(Boolean).slice(0, 6);
}

async function callOpenAICompatible({ oracle, game, model }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or LLM_API_KEY is required for LLM_PROVIDER=openai");
  }

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: Number(process.env.LLM_TEMPERATURE ?? 0.9),
      response_format: { type: "json_object" },
      messages: buildMessages({ oracle, game }),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`OpenAI-compatible request failed: ${response.status} ${body.slice(0, 500)}`);
    throw new Error(`OpenAI-compatible request failed with HTTP ${response.status}`);
  }

  const json = await response.json();
  return parseJsonContent(json?.choices?.[0]?.message?.content);
}

async function callOllama({ oracle, game, model }) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: {
        temperature: Number(process.env.LLM_TEMPERATURE ?? 0.9),
      },
      messages: buildMessages({ oracle, game }),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Ollama request failed: ${response.status} ${body.slice(0, 500)}`);
    throw new Error(`Ollama request failed with HTTP ${response.status}`);
  }

  const json = await response.json();
  return parseJsonContent(json?.message?.content);
}

function buildMessages({ oracle, game }) {
  const compactState = {
    turn: game.turn ?? 0,
    prophecy: game.prophecy ?? config.default_prophecy,
    stats: game.stats ?? {},
    factions: game.factions ?? [],
    memories: Array.isArray(game.memories) ? game.memories.slice(0, 8) : [],
  };

  return [
    {
      role: "system",
      content:
        "你是《神已离线》的多 agent 导演系统。你必须只输出 JSON。你负责让圣玻璃城变得活、不可预测、有阴谋,但不能破坏本地规则引擎。所有文本使用简体中文。不要输出 markdown。",
    },
    {
      role: "user",
      content: JSON.stringify({
        task:
          "根据玩家神谕生成一轮 agent 叙事。六个 faction_outcomes 必须对应 council/church/merchants/syndicate/revolt/gazette。deltas 只能使用给定 stats key,每个数值建议在 -12 到 12。必须包含 headline/director_note/faction_outcomes/rumor/citizen/ui/memories。",
        oracle,
        allowed_stat_keys: [...statKeys],
        required_faction_ids: [...factionIds],
        world_state: compactState,
      }),
    },
  ];
}

function createMockAgentOutput({ oracle, game }) {
  const crisis = strongestStat(game?.stats ?? {});
  const seed = Math.abs(hashCode(`${oracle}:${Date.now()}:${Math.random()}`));
  const twist = [
    "有人伪造了第二版神谕",
    "一个孩子发现神谕里有只有死者才懂的语法",
    "教会和黑帮同时宣称自己听见了神的停顿",
    "媒体把你的沉默剪辑成新的证词",
    "革命军开始研究你每次偏袒谁",
  ][seed % 5];

  return {
    headline: `控制台发声: 「${oracle}」之后,${twist},${crisis.label}成为今日裂缝。`,
    director_note: `本轮 LLM mock 导演选择把玩家神谕转化为社会误读,并让阵营开始学习玩家偏好。`,
    faction_outcomes: factions.map((faction, index) => ({
      agent_id: faction.id,
      agent_name: faction.name,
      color: faction.color,
      voice: faction.voice,
      action: `${faction.name}秘密召开午夜会议,把神谕改写成自己的行动许可`,
      interpretation: `「${oracle}」被${faction.name}解释为: ${twist}; 他们相信这能扩大自己的解释权。`,
      deltas: {
        [index % 2 === 0 ? "unrest" : "paranoia"]: 3 + ((seed + index) % 5),
        [index % 3 === 0 ? "faith" : "secrecy"]: index % 3 === 0 ? 2 : 4,
      },
      suspicion: 45 + ((seed + index * 7) % 35),
      memory: `${faction.name}记住了玩家在「${oracle}」里的偏好。`,
    })),
    rumor: {
      agent_id: "rumor",
      agent_name: "谣言群体",
      voice: "越像真相的谣言,越适合过夜。",
      action: "把神谕拆成三个版本并投喂给不同街区",
      interpretation: `谣言声称「${oracle}」其实漏掉了后半句,而后半句正好对每个人不利。`,
      deltas: { paranoia: 8, unrest: 5, secrecy: 3 },
      suspicion: 72,
    },
    citizen: {
      from: "米娅书记员",
      role: "地下档案员",
      summary: `米娅记录了「${oracle}」后的第一场失踪。`,
      body: `我不知道你是不是神。但今晚有人开始模仿你的语气写命令,而守卫照做了。`,
    },
    ui: {
      panels: ["今日新闻", "六大阵营热度", "神谕解释分歧", "LLM 阴谋线索", "伪造神谕追踪"],
      summary: "情报官 UI Agent 认为本轮重点不在结果,而在谁开始复制神的语法。",
    },
    memories: [`${twist}。`, `城市开始把玩家的措辞当成可研究对象。`],
  };
}

function strongestStat(stats) {
  let key = "faith";
  let value = -1;
  for (const [statKey, statValue] of Object.entries(stats)) {
    if (Number(statValue) > value) {
      key = statKey;
      value = Number(statValue);
    }
  }
  return { key, label: config.stats[key]?.label ?? key, value };
}

function parseJsonContent(content) {
  if (!content || typeof content !== "string") {
    throw new Error("LLM returned empty content");
  }
  try {
    return JSON.parse(content);
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : content;
    const balanced = extractFirstJsonObject(candidate);
    if (!balanced) throw new Error("LLM did not return JSON");
    return JSON.parse(balanced);
  }
}

function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const allowed = process.env.AGENT_BRIDGE_ALLOWED_ORIGIN;
  return Boolean(allowed && origin === allowed);
}

function getProvider() {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (provider === "openai" || provider === "ollama" || provider === "mock") return provider;
  if (process.env.OPENAI_API_KEY || process.env.LLM_API_KEY) return "openai";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  return "mock";
}

function getModelName() {
  const provider = getProvider();
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  if (provider === "ollama") return "llama3.1";
  if (provider === "openai") return "gpt-4o-mini";
  return "mock-agent";
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function limitText(value, maxLength) {
  const text = normalizeText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function hashCode(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (Math.imul(31, hash) + text.charCodeAt(index)) | 0;
  }
  return hash;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.AGENT_BRIDGE_PORT || DEFAULT_PORT);
  createBridgeServer().listen(port, "127.0.0.1", () => {
    console.log(`God Is Offline Agent Bridge listening at http://127.0.0.1:${port}`);
    console.log(`Provider: ${getProvider()} / Model: ${getModelName()}`);
  });
}
