import { callTextModel, clampNumber, jsonError, jsonResponse } from "../_lib/ai/text.js";

const presetWords = {
  "餐厅点餐": ["menu", "order", "waiter", "bill", "table", "dish", "recommend", "reservation"],
  "课堂提问": ["question", "answer", "explain", "example", "notebook", "teacher", "classmate", "review"],
  "旅行问路": ["direction", "station", "corner", "map", "ticket", "platform", "nearby", "straight"],
  "天气交流": ["sunny", "cloudy", "forecast", "temperature", "raincoat", "windy", "humid", "storm"],
  "快递柜取件": ["locker", "parcel", "code", "screen", "delivery", "pickup", "neighbor", "package"],
  "校园生活": ["library", "lecture", "assignment", "dormitory", "cafeteria", "club", "deadline", "schedule"],
};

const fallbackScene = ({ scene, wordCount }) => {
  const title = scene || "校园生活";
  const pool = presetWords[title] || presetWords["校园生活"];
  const words = pool.slice(0, wordCount).map((word) => ({
    word,
    meaning: `${word} 的场景含义`,
    phonetic: "",
    example: `I use "${word}" in the ${title} scene.`,
    exampleCn: `在“${title}”情景中可以使用 ${word}。`,
    memoryTip: `把 ${word} 和“${title}”中的具体动作或物品联系起来记忆。`,
    scene: title,
    tags: [title],
  }));
  return {
    title,
    description: `围绕“${title}”构建的英语沉浸式学习情景，适合先看图理解，再学习关键词和表达。`,
    scenePrompt: `A realistic immersive English learning scene about ${title}, with clear people, objects, and actions, no text, no labels.`,
    words,
  };
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return jsonError(res, 405, "Only POST is supported.");
  const { scene = "校园生活", level = "中级", wordCount = 10, style = "realistic" } = req.body || {};
  const count = clampNumber(wordCount, 8, 20, 10);
  const fallback = fallbackScene({ scene, wordCount: count });

  try {
    const generated = await callTextModel({
      system: "You generate concise English-learning scene vocabulary data for Chinese learners.",
      user: `请为英语学习情景“${scene}”生成 ${count} 个相关英文单词/短语，难度 ${level}，图片风格 ${style}。`,
      schemaHint: 'Schema: {"title":"","description":"","scenePrompt":"","words":[{"word":"","meaning":"","phonetic":"","example":"","exampleCn":"","memoryTip":"","scene":"","tags":[""]}]}',
    });
    const payload = generated?.words?.length ? generated : fallback;
    return jsonResponse(res, { scene: payload });
  } catch (error) {
    return jsonResponse(res, { scene: fallback, warning: error.message || "AI scene generation fell back to local template." });
  }
}
