import { createGame, describeStats, resolveOracle, setProphecy, STAT_LABELS } from "./game.js";

const state = {
  game: createGame("god-is-offline-demo"),
};

const elements = {
  prophecyForm: document.querySelector("[data-prophecy-form]"),
  prophecyInput: document.querySelector("[data-prophecy-input]"),
  oracleForm: document.querySelector("[data-oracle-form]"),
  oracleInput: document.querySelector("[data-oracle-input]"),
  prophecy: document.querySelector("[data-prophecy]"),
  turn: document.querySelector("[data-turn]"),
  headline: document.querySelector("[data-headline]"),
  statGrid: document.querySelector("[data-stat-grid]"),
  factionGrid: document.querySelector("[data-faction-grid]"),
  reports: document.querySelector("[data-reports]"),
  memories: document.querySelector("[data-memories]"),
  panels: document.querySelector("[data-panels]"),
  error: document.querySelector("[data-error]"),
};

const SAMPLE_ORACLES = [
  "让贫民区今晚得到食物。",
  "从今夜开始,说谎者的影子会变长。",
  "禁止贵族拥有军队。",
  "每个孩子都必须被安全带回家。",
  "所有死者的名字都要被看见。",
];

document.querySelectorAll("[data-sample-oracle]").forEach((button, index) => {
  button.textContent = SAMPLE_ORACLES[index];
  button.addEventListener("click", () => {
    elements.oracleInput.value = SAMPLE_ORACLES[index];
    elements.oracleInput.focus();
  });
});

elements.prophecyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.game = setProphecy(state.game, elements.prophecyInput.value);
  elements.prophecyInput.value = "";
  render();
});

elements.oracleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();

  try {
    state.game = resolveOracle(state.game, elements.oracleInput.value);
    elements.oracleInput.value = "";
    render();
  } catch (error) {
    showError(error.message);
  }
});

render();

function render() {
  elements.prophecy.textContent = state.game.prophecy;
  elements.turn.textContent = String(state.game.turn);
  elements.headline.textContent =
    state.game.lastOutcome?.headline ?? "神已离线七年。今晚,旧控制台第一次等待你的神谕。";

  renderStats();
  renderFactions();
  renderReports();
  renderMemories();
  renderPanels();
}

function renderStats() {
  elements.statGrid.innerHTML = describeStats(state.game.stats)
    .map(
      (stat) => `
        <article class="stat-card stat-card--${stat.level}">
          <div class="stat-card__top">
            <span>${stat.label}</span>
            <strong>${stat.value}</strong>
          </div>
          <div class="meter" aria-label="${stat.label}: ${stat.value}">
            <span style="width: ${stat.value}%"></span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderFactions() {
  elements.factionGrid.innerHTML = state.game.factions
    .map(
      (faction) => `
        <article class="faction-card">
          <h3>${faction.name}</h3>
          <dl>
            <div><dt>信任</dt><dd>${faction.trust}</dd></div>
            <div><dt>热度</dt><dd>${faction.heat}</dd></div>
          </dl>
        </article>
      `
    )
    .join("");
}

function renderReports() {
  const outcome = state.game.lastOutcome;

  if (!outcome) {
    elements.reports.innerHTML = `
      <article class="empty-state">
        <h3>等待第一句神谕</h3>
        <p>你不是英雄。你是一个每回合只能说一句话、还会被世界曲解的旧神接口。</p>
      </article>
    `;
    return;
  }

  elements.reports.innerHTML = `
    <article class="report report--lead">
      <p class="eyebrow">棱镜公报</p>
      <h3>${outcome.headline}</h3>
      <p>歧义指数: <strong>${outcome.ambiguity}</strong> / 100。主题: ${formatTopics(outcome.topics)}。</p>
    </article>
    ${outcome.factionOutcomes
      .map(
        (report) => `
          <article class="report">
            <p class="eyebrow">${report.agentName}</p>
            <h3>${report.action}</h3>
            <p>${report.voice}</p>
            <p>${report.interpretation}</p>
            <p class="delta-line">${formatDeltas(report.deltas)}</p>
          </article>
        `
      )
      .join("")}
    <article class="report">
      <p class="eyebrow">${outcome.rumor.agentName}</p>
      <h3>${outcome.rumor.action}</h3>
      <p>${outcome.rumor.interpretation}</p>
      <p class="delta-line">${formatDeltas(outcome.rumor.deltas)}</p>
    </article>
    <article class="report report--letter">
      <p class="eyebrow">关键人物来信 / ${outcome.citizen.role}</p>
      <h3>${outcome.citizen.from}</h3>
      <p>${outcome.citizen.body}</p>
    </article>
    <article class="report report--terminal">
      <p class="eyebrow">终局预言压力</p>
      <h3>${outcome.terminalPressure.score}%</h3>
      <ul>${outcome.terminalPressure.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul>
    </article>
  `;
}

function renderMemories() {
  elements.memories.innerHTML = state.game.memories.map((memory) => `<li>${memory}</li>`).join("");
}

function renderPanels() {
  const panels = state.game.lastOutcome?.ui.panels ?? ["今日新闻", "五大阵营热度", "神谕解释分歧"];
  elements.panels.innerHTML = panels.map((panel) => `<span>${panel}</span>`).join("");
}

function formatTopics(topics) {
  if (!topics.length) return "未命名神秘";

  const labels = {
    food: "粮食",
    truth: "真相",
    equality: "平等",
    death: "死亡",
    children: "儿童",
    wealth: "财富",
    faith: "信仰",
  };

  return topics.map((topic) => labels[topic]).join("、");
}

function formatDeltas(deltas) {
  return Object.entries(deltas)
    .map(([key, value]) => {
      const sign = value > 0 ? "+" : "";
      return `${STAT_LABELS[key] ?? key} ${sign}${value}`;
    })
    .join(" / ");
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function clearError() {
  elements.error.textContent = "";
  elements.error.hidden = true;
}
