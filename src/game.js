const KEYWORDS = {
  food: ["food", "bread", "grain", "meal", "hunger", "hungry", "粮", "食物", "面包", "饥", "饭"],
  truth: ["truth", "lie", "lies", "honest", "shadow", "秘密", "真相", "谎", "影子", "说谎"],
  equality: ["equal", "equality", "fair", "justice", "平等", "公平", "正义"],
  death: ["death", "die", "kill", "blood", "war", "murder", "死", "杀", "血", "战争"],
  children: ["child", "children", "orphan", "school", "孩子", "儿童", "孤儿", "学校"],
  wealth: ["gold", "money", "rich", "tax", "market", "coin", "钱", "金币", "富", "税", "市场"],
  faith: ["god", "holy", "faith", "prayer", "miracle", "神", "圣", "信仰", "祈祷", "神迹"],
};

const TONE_LABELS = {
  food: "粮食",
  truth: "真相",
  equality: "平等",
  death: "死亡",
  children: "儿童",
  wealth: "财富",
  faith: "信仰",
};

const FIRST_NAMES = ["伊芙", "莫兰", "塞拉", "尼奥", "阿什", "露卡", "塔维", "米娅"];
const LAST_NAMES = ["玻璃匠", "钟表师", "清道夫", "旧护士", "门徒", "逃兵", "孤儿", "书记员"];

const FACTIONS = [
  {
    id: "council",
    name: "市政厅",
    voice: "秩序必须看起来仍然存在。",
    baseAction: "把神谕写成紧急行政令,并要求所有街区登记执行结果",
    distortion: "把神的意思解释成授权临时管制",
    statDeltas: { order: 9, unrest: -3, freedom: -7, faith: 2 },
    triggers: {
      food: {
        action: "征用富人区粮仓,再把配给权交给区长",
        deltas: { hunger: -16, unrest: 7, order: 4, inequality: 5 },
      },
      truth: {
        action: "成立影子审查局,要求所有证词在强光下完成",
        deltas: { secrecy: -7, freedom: -10, paranoia: 11, order: 3 },
      },
      equality: {
        action: "宣布所有阶层头衔暂停使用,但保留财产登记",
        deltas: { inequality: -6, order: 3, unrest: 4 },
      },
      death: {
        action: "以防止流血为名扩大宵禁范围",
        deltas: { unrest: -4, freedom: -9, paranoia: 6 },
      },
      children: {
        action: "把儿童保护改造成强制收容计划",
        deltas: { faith: 3, freedom: -6, unrest: 6 },
      },
    },
  },
  {
    id: "church",
    name: "圣玻璃教会",
    voice: "神谕不是政策,是解释权。",
    baseAction: "宣布神终于重新开口,并收集所有人的祈祷誓言",
    distortion: "把模糊处解释成教会拥有唯一译本",
    statDeltas: { faith: 12, order: 2, secrecy: 4, freedom: -3 },
    triggers: {
      food: {
        action: "把面包做成圣餐,优先发给愿意受洗的人",
        deltas: { hunger: -8, faith: 10, inequality: 4, unrest: 3 },
      },
      truth: {
        action: "审判无影者与长影者,把光源放进圣坛",
        deltas: { faith: 8, paranoia: 12, secrecy: -3, unrest: 4 },
      },
      equality: {
        action: "宣称所有人在神前平等,但神职人员更接近神",
        deltas: { faith: 7, inequality: -3, unrest: 2 },
      },
      death: {
        action: "为死者建立公开忏悔墙",
        deltas: { faith: 6, paranoia: 4, unrest: -2 },
      },
      faith: {
        action: "把这句神谕刻上穹顶,要求城市每日复诵",
        deltas: { faith: 15, freedom: -5, order: 4 },
      },
    },
  },
  {
    id: "merchants",
    name: "金线商会",
    voice: "每个神迹都有价格。",
    baseAction: "发行神谕期货,押注哪条街会先被祝福",
    distortion: "把祝福拆成可交易凭证",
    statDeltas: { wealth: 8, inequality: 7, unrest: 3, faith: -1 },
    triggers: {
      food: {
        action: "推出神赐粮券,让穷人用明年的劳役抵今天的面包",
        deltas: { hunger: -10, wealth: 9, inequality: 10, unrest: 6 },
      },
      truth: {
        action: "开设影子保险,承保说谎者被发现后的损失",
        deltas: { wealth: 7, secrecy: 5, paranoia: 6 },
      },
      equality: {
        action: "发明平等股份,每个人都能买一小块无法兑现的未来",
        deltas: { wealth: 6, inequality: 2, unrest: 4 },
      },
      death: {
        action: "垄断棺木、药剂和雇佣护卫",
        deltas: { wealth: 11, inequality: 5, unrest: 5 },
      },
      wealth: {
        action: "把神谕铸成纪念币,宣布持币者受神注视",
        deltas: { wealth: 12, faith: 3, inequality: 6 },
      },
    },
  },
  {
    id: "syndicate",
    name: "黑烛帮",
    voice: "混乱是一条暗巷,暗巷通向我们。",
    baseAction: "伪造神谕副本,在夜市换取保护费",
    distortion: "把神的沉默解释成默许地下秩序",
    statDeltas: { secrecy: 10, unrest: 6, order: -7, fear: 5 },
    triggers: {
      food: {
        action: "劫走一半配给,再以神的名义低价出售",
        deltas: { hunger: -6, secrecy: 7, unrest: 8, inequality: 6 },
      },
      truth: {
        action: "训练说谎者控制影子长度,并出售伪证课程",
        deltas: { secrecy: 12, paranoia: 8, wealth: 5 },
      },
      equality: {
        action: "让贵族和平民在同一个债务名单上平等",
        deltas: { inequality: -2, unrest: 7, secrecy: 8 },
      },
      death: {
        action: "把复仇包装成神罚,清理旧敌人",
        deltas: { fear: 10, unrest: 8, order: -5 },
      },
      children: {
        action: "保护孤儿,但训练他们成为信使",
        deltas: { secrecy: 8, faith: 2, unrest: 3 },
      },
    },
  },
  {
    id: "revolt",
    name: "无冠者革命军",
    voice: "如果神会说话,人民也必须会说话。",
    baseAction: "把神谕印成传单,号召街区议会重写城市契约",
    distortion: "把每一句神谕都解释成旧秩序腐败的证据",
    statDeltas: { unrest: 10, freedom: 6, order: -8, faith: -2 },
    triggers: {
      food: {
        action: "占领粮仓,宣布第一块面包必须给最饿的人",
        deltas: { hunger: -14, unrest: 9, inequality: -7, order: -5 },
      },
      truth: {
        action: "公开官员密信,但也公布未经证实的仇敌名单",
        deltas: { secrecy: -10, unrest: 10, paranoia: 7, freedom: 5 },
      },
      equality: {
        action: "建立平等公社,要求贵族交出住宅",
        deltas: { inequality: -14, unrest: 12, order: -7, freedom: 4 },
      },
      death: {
        action: "用死者名字命名街垒,让哀悼变成动员",
        deltas: { unrest: 11, faith: -2, fear: 4 },
      },
      children: {
        action: "让孩子朗读自由宣言,逼迫士兵不敢开枪",
        deltas: { freedom: 8, unrest: 6, faith: 3 },
      },
    },
  },
  {
    id: "gazette",
    name: "棱镜公报",
    voice: "现实不会自己传播,标题会。",
    baseAction: "把神谕拆成七个互相矛盾的头版标题",
    distortion: "把不确定性做成连续报道",
    statDeltas: { paranoia: 8, unrest: 4, faith: 3, secrecy: -2 },
    triggers: {
      food: {
        action: "追踪第一块神赐面包,把饥饿拍成全民直播",
        deltas: { hunger: -3, unrest: 5, faith: 4, paranoia: 3 },
      },
      truth: {
        action: "推出影子排行榜,每天公布最可疑的十个人",
        deltas: { paranoia: 13, secrecy: -5, unrest: 5 },
      },
      equality: {
        action: "举办谁更平等的公众辩论,让每派都觉得自己赢了",
        deltas: { unrest: 6, faith: 2, freedom: 3 },
      },
      death: {
        action: "把每一次死亡都做成倒计时专题",
        deltas: { fear: 8, paranoia: 5, unrest: 4 },
      },
      faith: {
        action: "开设神是否在线专栏,邀请骗子、圣徒和统计学家同台",
        deltas: { faith: 5, paranoia: 5, freedom: 2 },
      },
    },
  },
];

const INITIAL_STATS = {
  order: 46,
  faith: 31,
  hunger: 52,
  unrest: 38,
  secrecy: 44,
  inequality: 57,
  freedom: 36,
  wealth: 42,
  paranoia: 28,
  fear: 33,
};

export const STAT_LABELS = {
  order: "秩序",
  faith: "信仰",
  hunger: "饥饿",
  unrest: "动荡",
  secrecy: "秘密",
  inequality: "不平等",
  freedom: "自由",
  wealth: "财富",
  paranoia: "猜疑",
  fear: "恐惧",
};

export function createGame(seed = Date.now()) {
  const rng = createRng(seed);
  return {
    seed,
    turn: 0,
    prophecy: "当圣玻璃城不再需要神时,游戏结束。",
    cityName: "圣玻璃城",
    stats: { ...INITIAL_STATS },
    factions: FACTIONS.map((faction) => ({
      id: faction.id,
      name: faction.name,
      trust: bounded(42 + Math.round(rng() * 18)),
      heat: bounded(25 + Math.round(rng() * 22)),
    })),
    memories: [
      "神已离线七年,穹顶下的钟仍每天敲响十三次。",
      "所有阵营都相信控制台存在,但没人知道它是否仍能听见人。",
    ],
    people: createPeople(rng),
    lastOutcome: null,
  };
}

export function setProphecy(game, prophecy) {
  const clean = normalizeInput(prophecy);
  return {
    ...game,
    prophecy: clean || game.prophecy,
    memories: clean
      ? [`终局预言被写入控制台:「${clean}」`, ...game.memories].slice(0, 8)
      : game.memories,
  };
}

export function resolveOracle(game, oracleText) {
  const oracle = normalizeInput(oracleText);

  if (!oracle) {
    throw new Error("神谕不能为空。");
  }

  const topics = detectTopics(oracle);
  const primaryTopic = topics[0] ?? "faith";
  const ambiguity = calculateAmbiguity(oracle, topics);
  const rng = createRng(`${game.seed}:${game.turn + 1}:${oracle}`);
  const factionOutcomes = FACTIONS.map((faction) => interpretFaction(faction, topics, oracle, ambiguity, rng));
  const rumor = createRumorAgentOutcome(oracle, topics, ambiguity, rng);
  const ui = createUiAgentOutcome(game, topics, ambiguity);

  const nextStats = applyOutcomes(game.stats, [...factionOutcomes, rumor]);
  const changedFactions = updateFactions(game.factions, factionOutcomes, nextStats, rng);
  const citizen = createCitizenLetter(game, oracle, primaryTopic, nextStats, rng);
  const headline = createHeadline(oracle, primaryTopic, ambiguity, nextStats);
  const terminalPressure = getTerminalPressure(game.prophecy, nextStats, primaryTopic);
  const memories = [
    `第 ${game.turn + 1} 回合神谕:「${oracle}」`,
    headline,
    citizen.summary,
    ...game.memories,
  ].slice(0, 10);

  return {
    ...game,
    turn: game.turn + 1,
    stats: nextStats,
    factions: changedFactions,
    memories,
    lastOutcome: {
      oracle,
      topics,
      ambiguity,
      headline,
      factionOutcomes,
      rumor,
      ui,
      citizen,
      terminalPressure,
      crisis: detectCrisis(nextStats),
    },
  };
}

export function detectTopics(text) {
  const lower = text.toLowerCase();
  return Object.entries(KEYWORDS)
    .filter(([, words]) => words.some((word) => lower.includes(word.toLowerCase())))
    .map(([topic]) => topic);
}

export function describeStats(stats) {
  return Object.entries(STAT_LABELS).map(([key, label]) => ({
    key,
    label,
    value: stats[key],
    level: stats[key] >= 70 ? "high" : stats[key] <= 30 ? "low" : "mid",
  }));
}

function interpretFaction(faction, topics, oracle, ambiguity, rng) {
  const relevantTopic = topics.find((topic) => faction.triggers[topic]);
  const trigger = relevantTopic ? faction.triggers[relevantTopic] : null;
  const action = trigger?.action ?? faction.baseAction;
  const deltas = mergeDeltas(faction.statDeltas, trigger?.deltas ?? {});
  const opportunism = Math.round((ambiguity - 35) / 8);
  const adjustedDeltas = Object.fromEntries(
    Object.entries(deltas).map(([key, value]) => [key, value + Math.round(opportunism * rng())])
  );

  return {
    agentId: faction.id,
    agentName: faction.name,
    voice: faction.voice,
    interpretation: `「${oracle}」被${faction.name}理解为: ${trigger ? action : faction.distortion}。`,
    action,
    deltas: adjustedDeltas,
    suspicion: bounded(20 + ambiguity + Math.round(rng() * 24)),
  };
}

function createRumorAgentOutcome(oracle, topics, ambiguity, rng) {
  const labels = topics.map((topic) => TONE_LABELS[topic]).join("、") || "神秘";
  const deltas = {
    paranoia: Math.round(5 + ambiguity / 9),
    unrest: Math.round(3 + ambiguity / 12),
    secrecy: Math.round(rng() * 5),
  };

  return {
    agentId: "rumor",
    agentName: "谣言群体",
    voice: "每个人都只转述自己害怕的那一半。",
    interpretation: `谣言 agent 把神谕压缩成「${labels}之夜将至」,并在酒馆、学校和地下礼拜中扩散。`,
    action: "制造三个互相矛盾但都足够可信的版本",
    deltas,
    suspicion: bounded(50 + ambiguity + Math.round(rng() * 15)),
  };
}

function createUiAgentOutcome(game, topics, ambiguity) {
  const panels = new Set(["今日新闻", "五大阵营热度", "神谕解释分歧"]);

  if (topics.includes("food") || game.stats.hunger > 60) panels.add("粮仓与黑市价格");
  if (topics.includes("truth") || game.stats.paranoia > 55) panels.add("影子审判名单");
  if (topics.includes("equality") || game.stats.inequality > 62) panels.add("阶层冲突图");
  if (topics.includes("children")) panels.add("儿童来信");
  if (ambiguity > 62) panels.add("失真传播链");

  return {
    agentId: "ui",
    agentName: "情报官 UI Agent",
    panels: [...panels],
    summary: `UI Agent 判断本轮应展示 ${[...panels].join("、")},因为神谕的歧义指数为 ${ambiguity}。`,
  };
}

function applyOutcomes(stats, outcomes) {
  const next = { ...stats };

  for (const outcome of outcomes) {
    for (const [key, value] of Object.entries(outcome.deltas ?? {})) {
      next[key] = bounded((next[key] ?? 0) + value);
    }
  }

  return next;
}

function updateFactions(factions, outcomes, stats, rng) {
  return factions.map((faction) => {
    const outcome = outcomes.find((item) => item.agentId === faction.id);
    const heatDelta = Math.round((outcome?.suspicion ?? 35) / 12) + Math.round(stats.unrest / 28) - 2;
    const trustDelta = Math.round((stats.faith - stats.paranoia) / 24) + Math.round(rng() * 4) - 2;

    return {
      ...faction,
      heat: bounded(faction.heat + heatDelta),
      trust: bounded(faction.trust + trustDelta),
    };
  });
}

function createCitizenLetter(game, oracle, primaryTopic, stats, rng) {
  const person = game.people[Math.floor(rng() * game.people.length)];
  const pressure = detectCrisis(stats);
  const topicLine = {
    food: "今天我真的拿到了一小块面包,但给面包的人要我明天替他作证。",
    truth: "他们让我站到灯下证明自己没有撒谎,可我害怕我的影子比别人长。",
    equality: "广场上每个人都说自己终于平等,但士兵仍然站在高台上。",
    death: "有人把死者的名字刻在墙上,然后要求我们继续活得更像旗帜。",
    children: "学校关门了,老师说这是保护,我不知道保护为什么需要锁。",
    wealth: "钱币上印着神的眼睛,穷人说那只眼睛从不看他们。",
    faith: "教堂今天很满,但我听见有人在祈祷你不要再开口。",
  }[primaryTopic];

  return {
    from: `${person.first}${person.last}`,
    role: person.role,
    summary: `${person.first}${person.last}写来一封关于「${oracle}」的信。`,
    body: `${topicLine} 如果这是你的意思,请下一次说得更像人一点。现在城里最重的词是「${pressure.label}」。`,
  };
}

function createHeadline(oracle, primaryTopic, ambiguity, stats) {
  const topic = TONE_LABELS[primaryTopic] ?? "神谕";
  const crisis = detectCrisis(stats);
  const prefix = ambiguity > 60 ? "七种译本同时流传" : "控制台重新发声";

  return `${prefix}: 「${oracle}」引爆${topic}争夺,${crisis.label}成为圣玻璃城今日主词。`;
}

function detectCrisis(stats) {
  const [key, value] = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
  return {
    key,
    value,
    label: STAT_LABELS[key],
  };
}

function getTerminalPressure(prophecy, stats, primaryTopic) {
  const lower = prophecy.toLowerCase();
  let pressure = 0;
  const reasons = [];

  if ((lower.includes("平等") || lower.includes("equal")) && stats.inequality < 35) {
    pressure += 30;
    reasons.push("不平等正在下降,但各阵营开始争夺谁有资格定义平等");
  }

  if ((lower.includes("真相") || lower.includes("truth")) && stats.secrecy < 30) {
    pressure += 28;
    reasons.push("秘密被撕开,城市越来越接近预言里的真相");
  }

  if ((lower.includes("不再需要神") || lower.includes("without god")) && stats.faith < 24) {
    pressure += 34;
    reasons.push("信仰降低,人们开始讨论没有神的制度");
  }

  if (primaryTopic === "children" && stats.fear > 65) {
    pressure += 18;
    reasons.push("儿童成为所有阵营向神施压的语言");
  }

  return {
    score: bounded(pressure),
    reasons: reasons.length ? reasons : ["终局预言尚未被明显推进,但世界正在学习你的偏好。"],
  };
}

function calculateAmbiguity(text, topics) {
  const shortTextPenalty = text.length < 12 ? 24 : 0;
  const modalWords = ["应该", "也许", "可能", "希望", "some", "maybe", "should", "might"];
  const modalScore = modalWords.some((word) => text.toLowerCase().includes(word)) ? 14 : 0;
  const topicScore = Math.max(0, 26 - topics.length * 7);
  const punctuationScore = /[?？]/.test(text) ? 10 : 0;

  return bounded(28 + shortTextPenalty + modalScore + topicScore + punctuationScore);
}

function mergeDeltas(base, extra) {
  const merged = { ...base };

  for (const [key, value] of Object.entries(extra)) {
    merged[key] = (merged[key] ?? 0) + value;
  }

  return merged;
}

function createPeople(rng) {
  return Array.from({ length: 14 }, (_, index) => ({
    first: FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)],
    last: LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)],
    role: ["送水人", "见习修女", "地下印刷工", "粮仓守夜人", "弃誓士兵", "玻璃校舍学生", "市场账房"][index % 7],
  }));
}

function normalizeInput(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function bounded(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createRng(seedInput) {
  let seed = hashSeed(seedInput);

  return function rng() {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seedInput) {
  const text = String(seedInput);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
