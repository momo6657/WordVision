import { callTextModel, clampNumber, jsonError, jsonResponse } from "../_lib/ai/text.js";

const fallbackDialogue = ({ scene, turns }) => {
  const lines = Array.from({ length: turns }, (_, index) => {
    const role = index % 2 === 0 ? "Learner" : "Partner";
    const sentence =
      index % 2 === 0
        ? `Could you help me with this ${scene || "situation"}?`
        : `Sure, I can explain it step by step.`;
    return {
      role,
      sentence,
      translation: index % 2 === 0 ? `你能帮我处理这个${scene || "情景"}吗？` : "当然，我可以一步一步解释。",
      focus: index % 2 === 0 ? "polite request" : "helpful response",
    };
  });
  return {
    title: `${scene || "情景"}口语对话`,
    scene: scene || "daily conversation",
    lines,
    keyExpressions: ["Could you help me?", "step by step", "Sure"],
  };
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return jsonError(res, 405, "Only POST is supported.");
  const { scene = "校园生活", role = "Learner", level = "中级", turns = 6 } = req.body || {};
  const count = clampNumber(turns, 4, 10, 6);
  const fallback = fallbackDialogue({ scene, turns: count });

  try {
    const generated = await callTextModel({
      system: "You generate short practical English dialogues for Chinese learners.",
      user: `请生成“${scene}”情景下 ${count} 轮英语对话，用户扮演 ${role}，难度 ${level}。`,
      schemaHint: 'Schema: {"title":"","scene":"","lines":[{"role":"","sentence":"","translation":"","focus":""}],"keyExpressions":[""]}',
    });
    const payload = generated?.lines?.length ? generated : fallback;
    return jsonResponse(res, { dialogue: payload });
  } catch (error) {
    return jsonResponse(res, { dialogue: fallback, warning: error.message || "AI dialogue generation fell back to local template." });
  }
}
