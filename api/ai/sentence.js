import { callTextModel, jsonError, jsonResponse } from "../_lib/ai/text.js";

const localAnalyze = (sentence) => {
  const clean = String(sentence || "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const subject = words.slice(0, Math.min(3, words.length)).join(" ");
  const predicate = words.slice(3, Math.min(7, words.length)).join(" ");
  const rest = words.slice(7).join(" ");
  return {
    sentence: clean,
    translation: "请结合上下文理解该句，重点先抓主干，再看修饰成分。",
    mainStructure: {
      subject: subject || "待识别主语",
      predicate: predicate || "待识别谓语",
      object: rest || "待识别宾语/补足语",
    },
    clauses: ["先找谓语动词，再向前确认主语，向后确认宾语、从句或状语。"],
    keyWords: words.slice(0, 8).map((word) => ({ word, meaning: "重点词" })),
    notes: ["这是基础规则拆解结果；配置 AI 文本接口后可获得更精细的语法说明。"],
    exercises: [
      { type: "main-structure", question: "这句话的主干是什么？", answer: `${subject} ${predicate}`.trim() },
      { type: "translation", question: "请选择或写出这句话的中文大意。", answer: "根据上下文翻译。" },
    ],
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") return jsonError(res, 405, "Only POST is supported.");
  const { sentence = "", level = "中级" } = req.body || {};
  if (!String(sentence).trim()) return jsonError(res, 400, "sentence is required.");
  const fallback = localAnalyze(sentence);

  try {
    const generated = await callTextModel({
      system: "You analyze difficult English sentences for Chinese learners.",
      user: `请分析这个英文长难句，难度 ${level}：${sentence}`,
      schemaHint:
        'Schema: {"sentence":"","translation":"","mainStructure":{"subject":"","predicate":"","object":""},"clauses":[""],"keyWords":[{"word":"","meaning":""}],"notes":[""],"exercises":[{"type":"","question":"","answer":""}]}',
    });
    const payload = generated?.mainStructure ? generated : fallback;
    return jsonResponse(res, { analysis: payload });
  } catch (error) {
    return jsonResponse(res, { analysis: fallback, warning: error.message || "AI sentence analysis fell back to local template." });
  }
}
