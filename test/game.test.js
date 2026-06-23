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

test("resolveOracle models ambiguity as social risk", () => {
  const game = createGame("ambiguity-seed");
  const vague = resolveOracle(game, "救他们?");
  const precise = resolveOracle(game, "让贫民区今晚得到食物。");

  assert.ok(vague.lastOutcome.ambiguity > precise.lastOutcome.ambiguity);
  assert.ok(vague.lastOutcome.rumor.deltas.paranoia >= precise.lastOutcome.rumor.deltas.paranoia);
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
