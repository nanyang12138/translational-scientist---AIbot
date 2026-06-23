import assert from "node:assert/strict";
import test from "node:test";

import { createGame, detectTopics, resolveOracle, setProphecy } from "../src/game.js";

test("detectTopics recognizes Chinese and English oracle themes", () => {
  assert.deepEqual(detectTopics("让贫民区今晚得到食物,并让说谎者的影子变长。"), ["food", "truth"]);
  assert.deepEqual(detectTopics("Give every child bread and justice."), ["food", "equality", "children"]);
});

test("resolveOracle advances the turn and lets faction agents produce outcomes", () => {
  const game = createGame("test-seed");
  const next = resolveOracle(game, "让贫民区今晚得到食物。");

  assert.equal(next.turn, 1);
  assert.equal(next.lastOutcome.topics.includes("food"), true);
  assert.equal(next.lastOutcome.factionOutcomes.length, 6);
  assert.ok(next.lastOutcome.factionOutcomes.every((outcome) => outcome.interpretation.includes("食物")));
  assert.notDeepEqual(next.stats, game.stats);
  assert.ok(next.stats.hunger < game.stats.hunger, "food oracle should reduce hunger in the short term");
});

test("resolveOracle does not mutate the previous game state", () => {
  const game = createGame("immutability-seed");
  const snapshot = structuredClone(game);

  resolveOracle(game, "禁止贵族拥有军队。");

  assert.deepEqual(game, snapshot);
});

test("resolveOracle models ambiguity as social risk", () => {
  const game = createGame("ambiguity-seed");
  const vague = resolveOracle(game, "救他们?");
  const precise = resolveOracle(game, "让贫民区今晚得到食物。");

  assert.ok(vague.lastOutcome.ambiguity > precise.lastOutcome.ambiguity);
  assert.ok(vague.lastOutcome.rumor.deltas.paranoia >= precise.lastOutcome.rumor.deltas.paranoia);
});

test("UI agent panels reflect post-resolution city state", () => {
  const game = createGame("ui-seed");
  const next = resolveOracle(game, "让钱币在今晚翻倍。");

  assert.ok(next.stats.inequality > 62);
  assert.ok(next.lastOutcome.ui.panels.includes("阶层冲突图"));
});

test("multi-turn simulation keeps bounded state and capped memory", () => {
  const oracles = [
    "让贫民区今晚得到食物。",
    "从今夜开始,说谎者的影子会变长。",
    "每个孩子都必须被安全带回家。",
    "禁止贵族拥有军队。",
    "所有死者的名字都要被看见。",
    "让钱币在今晚翻倍。",
  ];
  const finalGame = oracles.reduce((game, oracle) => resolveOracle(game, oracle), createGame("bounds-seed"));
  const statValues = Object.values(finalGame.stats);
  const factionValues = finalGame.factions.flatMap((faction) => [faction.trust, faction.heat]);

  assert.ok([...statValues, ...factionValues].every((value) => value >= 0 && value <= 100));
  assert.ok(finalGame.memories.length <= 10);
});

test("setProphecy stores a player-authored terminal condition", () => {
  const game = createGame("prophecy-seed");
  const next = setProphecy(game, "当所有人都知道真相时,游戏结束。");

  assert.equal(next.prophecy, "当所有人都知道真相时,游戏结束。");
  assert.ok(next.memories[0].includes("终局预言"));
});

test("resolveOracle rejects empty input", () => {
  const game = createGame("empty-seed");

  assert.throws(() => resolveOracle(game, "   "), /神谕不能为空/);
});
