import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAzureOpenAIRequest,
  buildOpenAICompatibleRequest,
  createBridgeServer,
  resolveWithAgent,
  sanitizeAgentOutput,
} from "../tools/agent_bridge_server.mjs";

test("agent bridge mock mode returns a complete sanitized turn", async () => {
  const previousProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "mock";

  const result = await resolveWithAgent({
    oracle: "让每个孩子都学会识别伪造神谕。",
    game: {
      turn: 2,
      prophecy: "当圣玻璃城不再需要神时,游戏结束。",
      stats: { faith: 31, unrest: 44, paranoia: 22 },
      factions: [],
      memories: [],
    },
  });

  process.env.LLM_PROVIDER = previousProvider;

  assert.equal(result.ok, true);
  assert.equal(result.provider, "mock");
  assert.equal(result.faction_outcomes.length, 6);
  assert.ok(result.headline.includes("控制台"));
  assert.ok(result.ui.panels.includes("LLM 阴谋线索"));
});

test("agent bridge sanitizer clamps deltas and removes unknown stat keys", () => {
  const result = sanitizeAgentOutput(
    {
      headline: "x".repeat(400),
      faction_outcomes: [
        {
          agent_id: "council",
          action: "test",
          interpretation: "test",
          deltas: {
            unrest: 999,
            unknown_stat: 999,
          },
          suspicion: 999,
        },
      ],
      rumor: {
        deltas: {
          paranoia: -999,
          invalid: 4,
        },
      },
      memories: Array.from({ length: 10 }, (_, index) => `memory ${index}`),
    },
    { oracle: "测试神谕", provider: "openai", model: "test-model" }
  );

  assert.equal(result.llm_enabled, true);
  assert.equal(result.faction_outcomes.length, 6);
  assert.equal(result.faction_outcomes[0].deltas.unrest, 18);
  assert.equal(result.faction_outcomes[0].deltas.unknown_stat, undefined);
  assert.equal(result.faction_outcomes[0].suspicion, 100);
  assert.equal(result.rumor.deltas.paranoia, -18);
  assert.equal(result.rumor.deltas.invalid, undefined);
  assert.equal(result.memories.length, 6);
  assert.ok(result.headline.length <= 220);
});

test("agent bridge rejects browser origin requests by default", async () => {
  const server = createBridgeServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil.example",
    },
    body: JSON.stringify({ oracle: "测试", game: {} }),
  });

  server.close();
  assert.equal(response.status, 403);
});

test("agent bridge builds AMD-style OpenAI-compatible gateway request", () => {
  const previous = snapshotEnv([
    "LLM_PROVIDER",
    "LLM_BASE_URL",
    "LLM_API_KEY",
    "LLM_MODEL",
    "LLM_GATEWAY_SUBSCRIPTION_KEY",
    "LLM_GATEWAY_USER",
    "LLM_DISABLE_RESPONSE_FORMAT",
    "LLM_CHAT_COMPLETIONS_PATH",
    "LLM_CHAT_COMPLETIONS_URL",
    "LLM_USE_DEPLOYMENT_PATH",
    "LLM_DEPLOYMENT_PATH_TEMPLATE",
    "LLM_ENABLE_RESPONSE_FORMAT",
  ]);
  Object.assign(process.env, {
    LLM_PROVIDER: "gateway",
    LLM_BASE_URL: "https://llm-api.example.com/OnPrem",
    LLM_API_KEY: "dummy",
    LLM_MODEL: "GPT-oss-20B",
    LLM_GATEWAY_SUBSCRIPTION_KEY: "subscription-placeholder",
    LLM_GATEWAY_USER: "test-user",
    LLM_DISABLE_RESPONSE_FORMAT: "1",
  });

  const request = buildOpenAICompatibleRequest({ oracle: "测试", game: {}, provider: "gateway" });
  const body = JSON.parse(request.init.body);
  restoreEnv(previous);

  assert.equal(request.url, "https://llm-api.example.com/OnPrem/chat/completions");
  assert.equal(request.init.headers.Authorization, "Bearer dummy");
  assert.equal(request.init.headers["Ocp-Apim-Subscription-Key"], "subscription-placeholder");
  assert.equal(request.init.headers.user, "test-user");
  assert.equal(body.model, "GPT-oss-20B");
  assert.equal(body.max_completion_tokens, 1200);
  assert.equal(body.response_format, undefined);
});

test("agent bridge supports chat completions path and full URL overrides", () => {
  const previous = snapshotEnv([
    "LLM_PROVIDER",
    "LLM_BASE_URL",
    "LLM_API_KEY",
    "LLM_MODEL",
    "LLM_CHAT_COMPLETIONS_PATH",
    "LLM_CHAT_COMPLETIONS_URL",
  ]);
  Object.assign(process.env, {
    LLM_PROVIDER: "gateway",
    LLM_BASE_URL: "https://gateway.example.com/root",
    LLM_API_KEY: "dummy",
    LLM_MODEL: "custom-model",
    LLM_CHAT_COMPLETIONS_PATH: "v1/chat/completions",
  });

  const pathRequest = buildOpenAICompatibleRequest({ oracle: "测试", game: {}, provider: "gateway" });
  process.env.LLM_CHAT_COMPLETIONS_URL = "https://gateway.example.com/custom/chat";
  const fullUrlRequest = buildOpenAICompatibleRequest({ oracle: "测试", game: {}, provider: "gateway" });
  restoreEnv(previous);

  assert.equal(pathRequest.url, "https://gateway.example.com/root/v1/chat/completions");
  assert.equal(fullUrlRequest.url, "https://gateway.example.com/custom/chat");
});

test("agent bridge supports deployment-style gateway URLs for gpt-5 models", () => {
  const previous = snapshotEnv([
    "LLM_PROVIDER",
    "LLM_BASE_URL",
    "LLM_API_KEY",
    "LLM_MODEL",
    "LLM_USE_DEPLOYMENT_PATH",
    "LLM_DEPLOYMENT_PATH_TEMPLATE",
    "LLM_TEMPERATURE",
    "LLM_ENABLE_RESPONSE_FORMAT",
  ]);
  Object.assign(process.env, {
    LLM_PROVIDER: "gateway",
    LLM_BASE_URL: "https://llm-api.example.com/OnPrem",
    LLM_API_KEY: "dummy",
    LLM_MODEL: "gpt-5.5",
    LLM_USE_DEPLOYMENT_PATH: "1",
  });

  const defaultDeploymentRequest = buildOpenAICompatibleRequest({ oracle: "测试", game: {}, provider: "gateway" });
  const defaultBody = JSON.parse(defaultDeploymentRequest.init.body);
  process.env.LLM_DEPLOYMENT_PATH_TEMPLATE = "vertex/gemini/deployments/{model}/chat/completions";
  const customDeploymentRequest = buildOpenAICompatibleRequest({
    oracle: "测试",
    game: {},
    model: "gemini-2.5-flash",
    provider: "gateway",
  });
  restoreEnv(previous);

  assert.equal(
    defaultDeploymentRequest.url,
    "https://llm-api.example.com/OnPrem/openai/deployments/gpt-5.5/chat/completions"
  );
  assert.equal(defaultBody.temperature, 1);
  assert.equal(defaultBody.response_format, undefined);
  assert.equal(
    customDeploymentRequest.url,
    "https://llm-api.example.com/OnPrem/vertex/gemini/deployments/gemini-2.5-flash/chat/completions"
  );
});

test("agent bridge builds Azure OpenAI deployment request", () => {
  const previous = snapshotEnv([
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT",
    "AZURE_OPENAI_API_VERSION",
    "AZURE_OPENAI_API_KEY",
    "LLM_EXTRA_HEADERS_JSON",
  ]);
  Object.assign(process.env, {
    AZURE_OPENAI_ENDPOINT: "https://example-azure.openai.azure.com",
    AZURE_OPENAI_DEPLOYMENT: "gpt-5.5",
    AZURE_OPENAI_API_VERSION: "2025-01-01-preview",
    AZURE_OPENAI_API_KEY: "azure-key-placeholder",
    LLM_EXTRA_HEADERS_JSON: JSON.stringify({ "x-ms-useragent": "god-is-offline-test" }),
  });

  const request = buildAzureOpenAIRequest({ oracle: "测试", game: {} });
  const body = JSON.parse(request.init.body);
  restoreEnv(previous);

  assert.equal(
    request.url,
    "https://example-azure.openai.azure.com/openai/deployments/gpt-5.5/chat/completions?api-version=2025-01-01-preview"
  );
  assert.equal(request.init.headers["api-key"], "azure-key-placeholder");
  assert.equal(request.init.headers["x-ms-useragent"], "god-is-offline-test");
  assert.equal(body.model, "gpt-5.5");
});

function snapshotEnv(keys) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
