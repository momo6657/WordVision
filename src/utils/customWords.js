const normalizeWord = (value) => String(value || "").trim().toLowerCase();

const slugify = (value) =>
  normalizeWord(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const firstMeaning = (meaning) => String(meaning || "").split(/[；;,，]/)[0]?.trim() || String(meaning || "").trim();

export const createCustomWord = (input, existingWord) => {
  const now = new Date().toISOString();
  const word = normalizeWord(input.word);
  const meaning = String(input.meaning || "").trim();
  const id = existingWord?.id || input.id || `custom-${slugify(word) || Date.now()}`;
  const simpleMeaning = firstMeaning(input.simpleMeaning || meaning);
  const example = String(input.example || "").trim() || `I want to remember the word "${word}".`;
  const exampleCn = String(input.exampleCn || "").trim() || `${word} 的核心含义是“${simpleMeaning || "待补充"}”。`;
  const scene = String(input.scene || "").trim();
  const tags = Array.isArray(input.tags)
    ? input.tags
    : String(input.tags || "")
        .split(/[,，;；\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    id,
    category: "CUSTOM",
    source: "custom",
    word,
    phonetic: String(input.phonetic || "").trim(),
    meaning,
    simpleMeaning,
    definition: String(input.definition || "").trim(),
    pos: String(input.pos || "").trim(),
    sourceTags: tags.join(" "),
    example,
    exampleCn,
    memoryTip:
      String(input.memoryTip || "").trim() ||
      `把 ${word} 放进“${scene || simpleMeaning || "熟悉场景"}”里联想，先记住核心含义，再通过例句理解用法。`,
    imagePrompt:
      String(input.imagePrompt || "").trim() ||
      `A realistic visual vocabulary card scene for "${word}", meaning "${simpleMeaning}", ${scene || "clear everyday context"}, no text.`,
    scene,
    tags,
    imageUrl: existingWord?.imageUrl || input.imageUrl || "",
    imageStatus: existingWord?.imageStatus || input.imageStatus || "idle",
    imageProvider: existingWord?.imageProvider || input.imageProvider || "",
    imageModel: existingWord?.imageModel || input.imageModel || "",
    imageGeneratedAt: existingWord?.imageGeneratedAt || input.imageGeneratedAt || null,
    imageError: existingWord?.imageError || input.imageError || "",
    learned: Boolean(existingWord?.learned || input.learned),
    wrongCount: Number(existingWord?.wrongCount || input.wrongCount) || 0,
    favorite: Boolean(existingWord?.favorite || input.favorite),
    lastStudiedAt: existingWord?.lastStudiedAt || input.lastStudiedAt || null,
    dueAt: existingWord?.dueAt || input.dueAt || null,
    ease: Number(existingWord?.ease || input.ease) || 2.5,
    intervalDays: Number(existingWord?.intervalDays || input.intervalDays) || 0,
    reviewCount: Number(existingWord?.reviewCount || input.reviewCount) || 0,
    createdAt: existingWord?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
};

export const parseCustomWordRows = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ",";
      const [word, meaning, phonetic = "", example = "", exampleCn = "", scene = "", tags = ""] = line
        .split(delimiter)
        .map((item) => item.trim());
      return { word, meaning, phonetic, example, exampleCn, scene, tags };
    })
    .filter((item) => item.word && item.meaning);
