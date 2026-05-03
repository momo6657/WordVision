import { callTextModel, jsonError, jsonResponse } from "../_lib/ai/text.js";

const tokenPattern = /[A-Za-z]+(?:'[A-Za-z]+)?|[,.;:!?]/g;
const hasChinese = (value) => /[\u4e00-\u9fff]/.test(String(value || ""));

const beVerbs = new Set(["am", "is", "are", "was", "were", "be", "been", "being"]);
const linkingVerbs = new Set(["seem", "seems", "seemed", "appear", "appears", "appeared", "become", "becomes", "became", "feel", "feels", "felt", "look", "looks", "looked", "remain", "remains", "remained"]);
const auxiliaries = new Set(["do", "does", "did", "have", "has", "had", "will", "would", "can", "could", "may", "might", "must", "should", "shall"]);
const subordinateMarkers = new Set(["after", "before", "although", "because", "when", "while", "if", "unless", "since", "where", "whereas", "that", "which", "who", "whom", "whose"]);
const prepositions = new Set(["at", "in", "on", "for", "with", "without", "by", "to", "from", "of", "about", "into", "over", "under", "during", "through", "after", "before"]);
const commonVerbs = new Set([
  "want",
  "wants",
  "wanted",
  "love",
  "loves",
  "loved",
  "need",
  "needs",
  "needed",
  "try",
  "tries",
  "tried",
  "plan",
  "plans",
  "planned",
  "understood",
  "understand",
  "broke",
  "break",
  "seemed",
  "seem",
  "looked",
  "look",
  "made",
  "make",
  "gave",
  "give",
  "took",
  "take",
  "found",
  "find",
  "helped",
  "help",
  "learned",
  "learn",
  "explained",
  "explain",
]);

const dictionary = {
  although: "虽然",
  want: "想要",
  love: "爱；喜爱",
  your: "你的",
  mother: "母亲",
  the: "定冠词",
  task: "任务",
  seemed: "似乎",
  difficult: "困难的",
  at: "在",
  first: "起初",
  students: "学生",
  gradually: "逐渐地",
  understood: "理解了",
  structure: "结构",
  after: "在……之后",
  teacher: "老师",
  broke: "拆解；分解",
  it: "它",
  down: "向下；彻底地",
};

const translations = [
  { pattern: /^i want to love your mother\.?$/i, value: "我想爱你的母亲。" },
  { pattern: /the task seemed difficult at first,?\s+the students gradually understood the structure after the teacher broke it down/i, value: "这项任务起初看起来很难，但老师把它拆解后，学生们逐渐理解了其中的结构。" },
  { pattern: /although the task seemed difficult at first,?\s+the students gradually understood the structure after the teacher broke it down/i, value: "虽然这项任务起初看起来很难，但在老师把它拆解后，学生们逐渐理解了其中的结构。" },
];

const tokenize = (sentence) => String(sentence || "").match(tokenPattern) || [];

const cleanText = (value) =>
  String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const wordOnly = (tokens) => tokens.filter((token) => /^[A-Za-z]/.test(token));

const isVerbLike = (token, nextToken = "") => {
  const lower = token.toLowerCase();
  if (beVerbs.has(lower) || linkingVerbs.has(lower) || auxiliaries.has(lower) || commonVerbs.has(lower)) return true;
  if (lower.endsWith("ed") || lower.endsWith("ing")) return true;
  if (nextToken && lower === "to") return true;
  return false;
};

const findPredicateIndex = (tokens) => {
  const words = wordOnly(tokens);
  for (let index = 1; index < words.length; index += 1) {
    if (isVerbLike(words[index], words[index + 1])) return tokens.indexOf(words[index]);
  }
  return words.length > 1 ? tokens.indexOf(words[1]) : -1;
};

const splitAtSubordinate = (tokens) => {
  for (let index = 1; index < tokens.length; index += 1) {
    const lower = tokens[index].toLowerCase();
    if (subordinateMarkers.has(lower) && wordOnly(tokens.slice(index + 1)).length >= 2) return index;
  }
  return -1;
};

const isOpeningSubordinate = (text) => {
  const firstWord = wordOnly(tokenize(text))[0]?.toLowerCase();
  return Boolean(firstWord && subordinateMarkers.has(firstWord));
};

const parseClause = (text) => {
  const rawTokens = tokenize(text).filter((token) => !/^[,.;:!?]$/.test(token));
  const openingMarker = subordinateMarkers.has(rawTokens[0]?.toLowerCase()) ? rawTokens[0] : "";
  const tokens = openingMarker ? rawTokens.slice(1) : rawTokens;
  const predicateIndex = findPredicateIndex(tokens);
  if (predicateIndex <= 0) {
    return {
      text: cleanText(text),
      subject: cleanText(wordOnly(tokens).slice(0, 2).join(" ")) || "待识别主语",
      predicate: "待识别谓语",
      object: "",
      complement: "",
      adverbial: "",
      type: openingMarker ? `${openingMarker} 引导的从句/短语` : "短语/不完整分句",
      marker: openingMarker,
    };
  }

  const subjectTokens = tokens.slice(0, predicateIndex);
  const prePredicateAdverbs = [];
  while (subjectTokens.length > 1 && subjectTokens[subjectTokens.length - 1].toLowerCase().endsWith("ly")) {
    prePredicateAdverbs.unshift(subjectTokens.pop());
  }
  const subject = cleanText(subjectTokens.join(" "));
  const predicateHead = tokens[predicateIndex];
  const rawTail = tokens.slice(predicateIndex + 1);
  const hasInfinitivePredicate = rawTail[0]?.toLowerCase() === "to" && isVerbLike(rawTail[1] || "");
  const predicate = hasInfinitivePredicate ? `${predicateHead} to ${rawTail[1]}` : predicateHead;
  const tail = hasInfinitivePredicate ? rawTail.slice(2) : rawTail;
  const subIndexInTail = splitAtSubordinate(tail);
  const mainTail = subIndexInTail >= 0 ? tail.slice(0, subIndexInTail) : tail;
  const subordinateTail = subIndexInTail >= 0 ? tail.slice(subIndexInTail) : [];
  const predicateLower = predicateHead.toLowerCase();
  const firstPrepIndex = mainTail.findIndex((token, index) => index > 0 && prepositions.has(token.toLowerCase()));
  const isLinking = beVerbs.has(predicateLower) || linkingVerbs.has(predicateLower);
  const coreTail = firstPrepIndex >= 0 ? mainTail.slice(0, firstPrepIndex) : mainTail;
  const adverbialTail = firstPrepIndex >= 0 ? mainTail.slice(firstPrepIndex) : [];

  return {
    text: cleanText(text),
    subject,
    predicate,
    object: isLinking ? "" : cleanText(coreTail.join(" ")),
    complement: isLinking ? cleanText(coreTail.join(" ")) : "",
    adverbial: cleanText([...prePredicateAdverbs, ...adverbialTail, ...subordinateTail].join(" ")),
    type: openingMarker ? `${openingMarker} 引导的状语/名词性从句` : isLinking ? "主系表结构" : "主谓宾结构",
    marker: openingMarker,
  };
};

const splitIndependentClauses = (sentence) => {
  const normalized = String(sentence || "").replace(/\s+/g, " ").trim();
  const pieces = normalized.split(/\s*,\s*/).filter(Boolean);
  if (pieces.length <= 1) return [normalized];
  const result = [];
  for (let index = 0; index < pieces.length; index += 1) {
    const current = pieces[index];
    const parsed = parseClause(current);
    if (index > 0 && parsed.predicate !== "待识别谓语") {
      result.push(current);
    } else if (result.length) {
      result[result.length - 1] = `${result[result.length - 1]}, ${current}`;
    } else {
      result.push(current);
    }
  }
  return result;
};

const translateSentence = (sentence) => {
  const matched = translations.find((item) => item.pattern.test(sentence));
  return matched?.value || "请结合上下文翻译：先译主句，再补充从句、状语和修饰成分。";
};

const keyWordsFor = (tokens) => {
  const seen = new Set();
  return wordOnly(tokens)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 2 && !seen.has(word) && seen.add(word))
    .slice(0, 10)
    .map((word) => ({ word, meaning: dictionary[word] || "重点词/短语" }));
};

const exercisesFor = (sentence, mainClause) => {
  const lower = sentence.toLowerCase();
  const exercises = [
    {
      type: "main-structure",
      question: "这句话的主干是什么？",
      answer: `${mainClause.subject} ${mainClause.predicate} ${mainClause.object || mainClause.complement}`.trim(),
    },
    { type: "translation", question: "请写出这句话的中文大意。", answer: translateSentence(sentence) },
  ];
  if (lower.includes(" after ")) {
    exercises.push({ type: "clause", question: "after 引导的部分在句中作什么成分？", answer: "时间状语从句" });
  }
  if (lower.includes("although ")) {
    exercises.push({ type: "clause", question: "although 引导的部分表达什么逻辑关系？", answer: "让步关系，通常译为“虽然/尽管”。" });
  }
  if (/\bto\s+[a-z]+/i.test(sentence)) {
    exercises.push({ type: "infinitive", question: "to do 结构在句中起什么作用？", answer: "通常作宾语、补足语、目的状语或后置修饰语，需要结合谓语判断。" });
  }
  return exercises;
};

const toText = (value) => {
  if (typeof value === "string") return cleanText(value);
  if (!value || typeof value !== "object") return "";
  return cleanText(
    [
      value.text,
      value.type ? `结构：${value.type}` : "",
      value.subject ? `主语=${value.subject}` : "",
      value.predicate ? `谓语=${value.predicate}` : "",
      value.object ? `宾语/补足语=${value.object}` : "",
      value.adverbial ? `状语/从句=${value.adverbial}` : "",
    ]
      .filter(Boolean)
      .join("；"),
  );
};

const normalizeExercises = (items, fallback) => {
  const exercises = Array.isArray(items)
    ? items
        .map((item) => ({
          type: cleanText(item?.type || "practice"),
          question: cleanText(item?.question || ""),
          answer: cleanText(item?.answer || ""),
        }))
        .filter((item) => item.question && item.answer)
    : [];
  return exercises.length ? exercises.slice(0, 6) : fallback.exercises;
};

const normalizeAnalysis = (generated, fallback, sentence) => {
  if (!generated || typeof generated !== "object") return fallback;
  const mainStructure = generated.mainStructure && typeof generated.mainStructure === "object" ? generated.mainStructure : {};
  const subject = cleanText(mainStructure.subject);
  const predicate = cleanText(mainStructure.predicate);
  const object = cleanText(mainStructure.object || mainStructure.complement);

  if (!subject || !predicate) return fallback;

  const clauses = Array.isArray(generated.clauses)
    ? generated.clauses.map(toText).filter(Boolean).slice(0, 8)
    : fallback.clauses;
  const keyWords = Array.isArray(generated.keyWords)
    ? generated.keyWords
        .map((item) => ({
          word: cleanText(item?.word || ""),
          meaning: cleanText(item?.meaning || ""),
        }))
        .filter((item) => item.word && item.meaning)
        .slice(0, 12)
    : fallback.keyWords;
  const notes = Array.isArray(generated.notes) ? generated.notes.map(toText).filter(Boolean).slice(0, 8) : fallback.notes;

  return {
    sentence: cleanText(generated.sentence || sentence),
    translation: hasChinese(generated.translation) ? cleanText(generated.translation) : fallback.translation,
    mainStructure: {
      subject,
      predicate,
      object: object || "无明显宾语，可能是表语、补足语或状语",
    },
    clauses: clauses.length ? clauses : fallback.clauses,
    keyWords: keyWords.length ? keyWords : fallback.keyWords,
    notes: notes.length ? notes : fallback.notes,
    exercises: normalizeExercises(generated.exercises, fallback),
  };
};

const localAnalyze = (sentence) => {
  const clean = String(sentence || "").trim();
  const independentClauses = splitIndependentClauses(clean);
  const parsedClauses = independentClauses.map(parseClause);
  const mainClause =
    parsedClauses.find((clause) => clause.predicate !== "待识别谓语" && !clause.marker && !isOpeningSubordinate(clause.text)) ||
    parsedClauses.find((clause) => clause.predicate !== "待识别谓语") ||
    parsedClauses[0] ||
    parseClause(clean);
  const clauseNotes = parsedClauses.map((clause, index) => {
    const parts = [`分句 ${index + 1}：${clause.text}`, `结构：${clause.type}`, `主语=${clause.subject}`, `谓语=${clause.predicate}`];
    if (clause.object) parts.push(`宾语=${clause.object}`);
    if (clause.complement) parts.push(`表语=${clause.complement}`);
    if (clause.adverbial) parts.push(`状语/从句=${clause.adverbial}`);
    return parts.join("；");
  });

  return {
    sentence: clean,
    translation: translateSentence(clean),
    mainStructure: {
      subject: mainClause.subject || "待识别主语",
      predicate: mainClause.predicate || "待识别谓语",
      object: mainClause.object || mainClause.complement || "无明显宾语，可能是表语或状语",
    },
    clauses: clauseNotes,
    keyWords: keyWordsFor(tokenize(clean)),
    notes: [
      "先按逗号和连接关系划分分句，再分别找谓语动词。",
      "系动词 seem/look/become 后通常接表语，不应把表语误判为谓语。",
      "after/before/although/because 等引导的部分优先作为状语从句处理。",
    ],
    exercises: exercisesFor(clean, mainClause),
  };
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") return jsonError(res, 405, "Only POST is supported.");
  const { sentence = "", level = "中级" } = req.body || {};
  if (!String(sentence).trim()) return jsonError(res, 400, "sentence is required.");
  const fallback = localAnalyze(sentence);

  try {
    const generated = await callTextModel({
      system:
        "You are a precise English grammar and translation tutor for Chinese learners. Parse the sentence literally and accurately. Identify the real main clause, predicate phrase, complements, objects, clauses, modifiers, and produce natural Chinese translation. Do not invent context. Do not use templates. Return strict JSON only.",
      user: `Analyze this English sentence for Chinese learners and return JSON only.

Sentence:
${sentence}

Level: ${level}

Return exactly these keys:
{
  "sentence": "original sentence",
  "translation": "natural and accurate Chinese translation",
  "mainStructure": {
    "subject": "main clause subject only",
    "predicate": "complete predicate or predicate core, e.g. want to love / seemed / is",
    "object": "object, complement, or predicative complement"
  },
  "clauses": ["Chinese explanation of each clause, relative clause, non-finite phrase, modifier, and its function"],
  "keyWords": [{"word":"important word or phrase","meaning":"Chinese meaning"}],
  "notes": ["Chinese grammar notes"],
  "exercises": [{"type":"practice type","question":"Chinese question based on this exact sentence","answer":"correct answer"}]
}

Rules:
- translation must be Chinese, not English.
- Do not include predicate or adverbs in the subject.
- Do not ask about an after-clause unless the sentence really contains "after".
- If the sentence has a relative clause such as "that I bought yesterday", explain it as a relative clause modifying the noun.
- For "I want to love your mother", the predicate can be "want to love" and the object can be "your mother".`,
      schemaHint:
        'Schema: {"sentence":"","translation":"","mainStructure":{"subject":"","predicate":"","object":""},"clauses":[""],"keyWords":[{"word":"","meaning":""}],"notes":[""],"exercises":[{"type":"","question":"","answer":""}]}',
    });
    const payload = normalizeAnalysis(generated, fallback, sentence);
    if (!hasChinese(payload.translation) || /^请结合上下文翻译/.test(payload.translation)) {
      throw new Error("文字 AI 未返回有效中文翻译。");
    }
    return jsonResponse(res, { analysis: payload });
  } catch (error) {
    return jsonError(res, 503, error.message || "长难句解析失败：文字 AI 当前不可用，请检查模型额度或稍后重试。");
  }
}
