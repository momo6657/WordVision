import { callTextModel, clampNumber, jsonError, jsonResponse } from "../_lib/ai/text.js";

const hasChinese = (value) => /[\u4e00-\u9fff]/.test(String(value || ""));

const cleanText = (value, max = 500) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const normalizeDialogue = (generated, { scene, role, count }) => {
  if (!generated || typeof generated !== "object") throw new Error("文字 AI 未返回有效对话结构。");
  const lines = Array.isArray(generated.lines)
    ? generated.lines
        .map((line, index) => ({
          role: cleanText(line?.role || (index % 2 === 0 ? role : "Partner"), 40),
          sentence: cleanText(line?.sentence, 260),
          translation: cleanText(line?.translation, 260),
          focus: cleanText(line?.focus, 160),
        }))
        .filter((line) => line.sentence && line.translation && hasChinese(line.translation))
    : [];

  const uniqueSentences = new Set(lines.map((line) => line.sentence.toLowerCase()));
  if (lines.length < Math.min(4, count)) throw new Error("文字 AI 生成的对话轮次不足。");
  if (uniqueSentences.size < Math.min(4, lines.length)) throw new Error("文字 AI 生成的对话内容重复，未形成真实情景对话。");
  if (lines.some((line) => /Could you help me with this|step by step/i.test(line.sentence))) {
    throw new Error("文字 AI 返回了模板化对话，已拒绝展示。");
  }

  return {
    title: cleanText(generated.title || `${scene}口语对话`, 80),
    scene: cleanText(generated.scene || scene, 120),
    lines: lines.slice(0, count),
    keyExpressions: Array.isArray(generated.keyExpressions)
      ? generated.keyExpressions.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 8)
      : [],
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

  try {
    const generated = await callTextModel({
      system:
        "You are a practical spoken English dialogue generator for Chinese learners. Generate realistic, non-repetitive, task-specific dialogues. Return strict JSON only.",
      user: `Generate a realistic spoken English dialogue for this exact scene: ${scene}

Learner role: ${role}
Difficulty: ${level}
Turns: ${count}

Requirements:
- The dialogue must be specific to the scene, not generic help phrases.
- Alternate roles naturally, for example Customer/Vendor for 买菜, Customer/Waiter for 餐厅点餐.
- Every line must have natural English sentence, accurate Chinese translation, and a speaking focus.
- Lines must not repeat.
- Do not mix Chinese words into English sentences unless the target scene naturally requires a proper noun.
- Include 4-8 useful key expressions.`,
      schemaHint: 'Schema: {"title":"","scene":"","lines":[{"role":"","sentence":"","translation":"","focus":""}],"keyExpressions":[""]}',
    });
    const payload = normalizeDialogue(generated, { scene, role, count });
    return jsonResponse(res, { dialogue: payload });
  } catch (error) {
    return jsonError(res, 503, error.message || "口语对话生成失败：文字 AI 当前不可用，请检查模型额度或稍后重试。");
  }
}
