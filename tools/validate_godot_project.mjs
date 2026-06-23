import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const godotRoot = path.join(root, "godot");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function parseJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

const project = await read("godot/project.godot");
assert.match(project, /config\/name="God Is Offline"/);
assert.match(project, /run\/main_scene="res:\/\/scenes\/main\.tscn"/);
assert.match(project, /window\/size\/viewport_width=1600/);

const scene = await read("godot/scenes/main.tscn");
assert.match(scene, /res:\/\/scripts\/main_controller\.gd/);

const config = await parseJson("godot/data/game_config.json");
assert.equal(config.city_name, "圣玻璃城");
assert.ok(Object.keys(config.stats).length >= 10, "expected at least ten city stats");
assert.ok(Object.keys(config.topics).length >= 7, "expected at least seven oracle topics");
assert.ok(config.samples.length >= 5, "expected sample oracles");
const statKeys = new Set(Object.keys(config.stats));
const topicKeys = new Set(Object.keys(config.topics));

const factions = await parseJson("godot/data/factions.json");
assert.equal(factions.length, 6, "expected six faction agents");
for (const faction of factions) {
  assert.ok(faction.id);
  assert.ok(faction.name);
  assert.ok(faction.voice);
  assert.ok(faction.base_action);
  assert.ok(faction.stat_deltas);
  for (const key of Object.keys(faction.stat_deltas)) {
    assert.ok(statKeys.has(key), `unknown stat delta "${key}" in faction ${faction.id}`);
  }
  for (const [topic, trigger] of Object.entries(faction.triggers ?? {})) {
    assert.ok(topicKeys.has(topic), `unknown trigger topic "${topic}" in faction ${faction.id}`);
    for (const key of Object.keys(trigger.deltas ?? {})) {
      assert.ok(statKeys.has(key), `unknown trigger delta "${key}" in faction ${faction.id}/${topic}`);
    }
  }
}

const mainScript = await read("godot/scripts/main_controller.gd");
assert.match(mainScript, /func _show_main_menu/);
assert.match(mainScript, /func _show_control_room/);
assert.match(mainScript, /func _submit_oracle/);
assert.match(mainScript, /func _save_current_game/);
assert.match(mainScript, /llm_agent_client\.gd/);
assert.match(mainScript, /resolve_oracle_with_agent/);
assert.match(mainScript, /直连 AMD LLM Gateway/);

const engineScript = await read("godot/scripts/oracle_engine.gd");
assert.match(engineScript, /class_name OracleEngine/);
assert.match(engineScript, /func resolve_oracle/);
assert.match(engineScript, /func resolve_oracle_with_agent/);
assert.match(engineScript, /func detect_topics/);
assert.match(engineScript, /res:\/\/data\/game_config\.json/);
assert.match(engineScript, /res:\/\/data\/factions\.json/);

const llmClientScript = await read("godot/scripts/llm_agent_client.gd");
assert.match(llmClientScript, /class_name LLMAgentClient/);
assert.match(llmClientScript, /HTTPRequest/);
assert.match(llmClientScript, /func resolve_oracle/);
assert.match(llmClientScript, /func resolve_oracle_direct_openai/);
assert.match(llmClientScript, /Ocp-Apim-Subscription-Key/);

const saveScript = await read("godot/scripts/save_system.gd");
assert.match(saveScript, /class_name SaveSystem/);
assert.match(saveScript, /func save_game/);
assert.match(saveScript, /func load_game/);
assert.match(saveScript, /func _is_valid_game/);

const exports = await read("godot/export_presets.cfg");
assert.match(exports, /name="Windows Desktop"/);
assert.match(exports, /name="Linux\/X11"/);
assert.match(exports, /name="macOS"/);

const bridgeScript = await read("tools/agent_bridge_server.mjs");
assert.match(bridgeScript, /createBridgeServer/);
assert.match(bridgeScript, /callOpenAICompatible/);
assert.match(bridgeScript, /buildOpenAICompatibleRequest/);
assert.match(bridgeScript, /buildAzureOpenAIRequest/);
assert.match(bridgeScript, /callOllama/);
assert.match(bridgeScript, /LLM_GATEWAY_SUBSCRIPTION_KEY/);
assert.match(bridgeScript, /AMD_LLM_GATEWAY_KEY/);
assert.match(bridgeScript, /llm-api\.amd\.com\/OpenAI/);
assert.match(bridgeScript, /LLM_CHAT_COMPLETIONS_PATH/);
assert.match(bridgeScript, /LLM_USE_DEPLOYMENT_PATH/);
assert.match(bridgeScript, /LLM_DEPLOYMENT_PATH_TEMPLATE/);

const gatewayTestScript = await read("tools/test_llm_gateway.mjs");
assert.match(gatewayTestScript, /diagnoseNetworkError/);
assert.match(gatewayTestScript, /buildOpenAICompatibleRequest/);

console.log(`Validated Godot project at ${godotRoot}`);
