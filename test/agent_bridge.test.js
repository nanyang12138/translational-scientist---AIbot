import assert from "node:assert/strict";
import test from "node:test";

import { createBridgeServer, resolveWithAgent, sanitizeAgentOutput } from "../tools/agent_bridge_server.mjs";

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
