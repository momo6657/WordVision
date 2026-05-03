import { callTextModel, clampNumber, jsonError, jsonResponse } from "../_lib/ai/text.js";

const hasChinese = (value) => /[\u4e00-\u9fff]/.test(String(value || ""));

const cleanText = (value, max = 600) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const normalizeScene = (generated, { scene, count }) => {
  if (!generated || typeof generated !== "object") throw new Error("文字 AI 未返回有效情景结构。");
  const words = Array.isArray(generated.words)
    ? generated.words
        .map((word) => ({
          word: cleanText(word?.word, 80),
          meaning: cleanText(word?.meaning, 160),
          phonetic: cleanText(word?.phonetic, 80),
          example: cleanText(word?.example, 260),
          exampleCn: cleanText(word?.exampleCn, 260),
          memoryTip: cleanText(word?.memoryTip, 260),
          scene: cleanText(word?.scene || generated.title || scene, 120),
          tags: Array.isArray(word?.tags) ? word.tags.map((tag) => cleanText(tag, 40)).filter(Boolean).slice(0, 6) : [scene],
        }))
        .filter((word) => word.word && word.meaning && hasChinese(word.meaning) && word.example && word.exampleCn && hasChinese(word.exampleCn))
    : [];

  const uniqueWords = new Set(words.map((word) => word.word.toLowerCase()));
  if (words.length < Math.min(8, count)) throw new Error("文字 AI 生成的情景词汇数量不足。");
  if (uniqueWords.size < words.length) throw new Error("文字 AI 生成的情景词汇存在重复。");
  if (words.some((word) => /场景含义|I use ".+" in the/i.test(`${word.meaning} ${word.example}`))) {
    throw new Error("文字 AI 返回了模板化词汇，已拒绝展示。");
  }

  const title = cleanText(generated.title || scene, 100);
  const description = cleanText(generated.description, 360);
  const scenePrompt = cleanText(generated.scenePrompt, 900);
  if (!title || !description || !hasChinese(description) || !scenePrompt) {
    throw new Error("文字 AI 生成的情景说明或图片提示词不完整。");
  }

  return {
    title,
    description,
    scenePrompt,
    words: words.slice(0, count),
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

  try {
    const generated = await callTextModel({
      system:
        "You generate immersive English-learning scene vocabulary data for Chinese learners. Output realistic, scene-specific vocabulary and examples. Return strict JSON only.",
      user: `Generate an immersive English learning scene for: ${scene}

Difficulty: ${level}
Word count: ${count}
Image style: ${style}

Requirements:
- title and description must be Chinese and specific to the scene.
- scenePrompt must be English and describe one realistic scene image with people, objects, and actions; no text, no labels.
- Generate ${count} useful English words or short phrases that are genuinely used in this scene.
- Each word must include accurate Chinese meaning, natural English example, Chinese example translation, and memoryTip in Chinese.
- Do not output placeholders like "word 的场景含义" or "I use word in the scene".
- For 餐厅点餐 include practical items like menu, reservation, order, appetizer, main course, bill, split the bill, recommend.
- For 买菜 include practical items like vegetable stall, weigh, price, fresh, discount, cash, QR code, plastic bag, bunch, ripe.`,
      schemaHint: 'Schema: {"title":"","description":"","scenePrompt":"","words":[{"word":"","meaning":"","phonetic":"","example":"","exampleCn":"","memoryTip":"","scene":"","tags":[""]}]}',
    });
    const payload = normalizeScene(generated, { scene, count });
    return jsonResponse(res, { scene: payload });
  } catch (error) {
    return jsonError(res, 503, error.message || "情景生成失败：文字 AI 当前不可用，请检查模型额度或稍后重试。");
  }
}
