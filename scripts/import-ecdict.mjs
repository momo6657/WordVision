import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cacheDir = path.join(root, ".cache");
const csvPath = path.join(cacheDir, "ecdict.csv");
const outputPath = path.join(root, "src", "data", "words.js");
const docsDir = path.join(root, "docs");
const reportPath = path.join(docsDir, "VOCAB_SOURCE.md");
const sourceUrl = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv";

const books = [
  {
    id: "gaokao",
    tag: "gk",
    category: "GAOKAO",
    name: "高考词汇",
    level: "高中",
    description: "基于公开词典考试标签整理的高考英语核心词汇，适合高中英语与高考复习。",
  },
  {
    id: "cet4",
    tag: "cet4",
    category: "CET4",
    name: "四级词汇",
    level: "大学",
    description: "基于公开词典考试标签整理的大学英语四级词汇，适合 CET-4 备考。",
  },
  {
    id: "cet6",
    tag: "cet6",
    category: "CET6",
    name: "六级词汇",
    level: "大学",
    description: "基于公开词典考试标签整理的大学英语六级词汇，适合 CET-6 备考。",
  },
];

const ensureDir = (target) => fs.mkdirSync(target, { recursive: true });

const download = async () => {
  ensureDir(cacheDir);
  if (fs.existsSync(csvPath) && fs.statSync(csvPath).size > 1024 * 1024) return;
  console.log(`Downloading ECDICT from ${sourceUrl}`);
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Failed to download ECDICT: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(csvPath, buffer);
};

function* parseCsv(text) {
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      yield row;
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    yield row;
  }
}

const normalizeWord = (word) => word.trim().toLowerCase();
const isLearningWord = (word) => /^[a-z][a-z -]*[a-z]$/.test(word) && word.length <= 36;
const splitLines = (value) => String(value || "").replaceAll("\\n", "\n").split(/\n+/).map((item) => item.trim()).filter(Boolean);

const cleanTranslation = (value) => {
  const lines = splitLines(value)
    .map((line) => line.replace(/^[a-z]+\.\s*/i, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const joined = [...new Set(lines)].slice(0, 3).join("；");
  return joined || "释义待补充";
};

const simpleMeaning = (meaning) => meaning.split(/[；;,，]/)[0]?.trim() || meaning;

const stableId = (bookId, word) => `${bookId}-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const exampleFor = (word, meaning) => `The word "${word}" is useful in English reading and exam practice.`;
const exampleCnFor = (word, meaning) => `${word} 是英语阅读和考试练习中的常用词，核心含义是“${simpleMeaning(meaning)}”。`;
const tipFor = (word, meaning) => `把 ${word} 和“${simpleMeaning(meaning)}”的具体画面联系起来，先记住核心含义，再通过例句理解用法。`;
const promptFor = (word, meaning) =>
  `A clear educational visual mnemonic for the English word "${word}", symbolizing "${simpleMeaning(meaning)}", friendly modern illustration, no text.`;

const compareEntry = (left, right) => {
  const leftRank = Number(left.frq || left.bnc || 9999999);
  const rightRank = Number(right.frq || right.bnc || 9999999);
  return leftRank - rightRank;
};

await download();
const csv = fs.readFileSync(csvPath, "utf8");
const rows = parseCsv(csv);
const header = rows.next().value;
const columns = new Map(header.map((name, index) => [name, index]));
const required = ["word", "phonetic", "translation", "definition", "pos", "tag", "bnc", "frq"];
for (const name of required) {
  if (!columns.has(name)) throw new Error(`ECDICT is missing column: ${name}`);
}

const byBook = Object.fromEntries(books.map((book) => [book.id, new Map()]));

for (const row of rows) {
  const word = normalizeWord(row[columns.get("word")] || "");
  if (!isLearningWord(word)) continue;
  const tag = row[columns.get("tag")] || "";
  const tags = new Set(tag.split(/\s+/).filter(Boolean));

  for (const book of books) {
    if (!tags.has(book.tag)) continue;
    const meaning = cleanTranslation(row[columns.get("translation")]);
    const entry = {
      id: stableId(book.id, word),
      category: book.category,
      word,
      phonetic: row[columns.get("phonetic")] || "",
      meaning,
      simpleMeaning: simpleMeaning(meaning),
      definition: splitLines(row[columns.get("definition")]).slice(0, 2).join("; "),
      pos: row[columns.get("pos")] || "",
      bnc: Number(row[columns.get("bnc")]) || null,
      frq: Number(row[columns.get("frq")]) || null,
      sourceTags: tag,
      example: exampleFor(word, meaning),
      exampleCn: exampleCnFor(word, meaning),
      memoryTip: tipFor(word, meaning),
      imagePrompt: promptFor(word, meaning),
      imageUrl: "",
      imageStatus: "idle",
      learned: false,
      wrongCount: 0,
      favorite: false,
      lastStudiedAt: null,
      dueAt: null,
      ease: 2.5,
      intervalDays: 0,
      reviewCount: 0,
    };
    const existing = byBook[book.id].get(word);
    if (!existing || compareEntry(entry, existing) < 0) {
      byBook[book.id].set(word, entry);
    }
  }
}

const wordBooks = books.map((book) => ({
  id: book.id,
  name: book.name,
  description: book.description,
  level: book.level,
  source: "ECDICT",
  license: "MIT",
  words: [...byBook[book.id].values()].sort(compareEntry),
}));

ensureDir(path.dirname(outputPath));
const file = `// Generated by scripts/import-ecdict.mjs from ECDICT (${sourceUrl}).\n` +
  `// Do not edit individual entries manually; update the import script instead.\n\n` +
  `export const wordBooks = ${JSON.stringify(wordBooks, null, 2)};\n`;
fs.writeFileSync(outputPath, file, "utf8");

ensureDir(docsDir);
const total = wordBooks.reduce((sum, book) => sum + book.words.length, 0);
const report = `# WordVision 词库来源报告\n\n` +
  `生成时间：${new Date().toISOString()}\n\n` +
  `## 数据来源\n\n` +
  `- 基线词典：ECDICT Free English to Chinese Dictionary Database\n` +
  `- 仓库：https://github.com/skywind3000/ECDICT\n` +
  `- 许可证：MIT License\n\n` +
  `## 导入规则\n\n` +
  `- 使用 ECDICT 的考试标签筛选：高考=gk，四级=cet4，六级=cet6。\n` +
  `- 保留英文单词、音标、中文释义、英文释义、词性、词频、来源标签。\n` +
  `- 例句、中文例句、记忆提示和图片提示词使用模板生成，后续可通过 AI 批量优化。\n` +
  `- 本项目不宣称这些词表是官方考纲原始文件，而是公开词典标签整理基线。\n\n` +
  `## 导入结果\n\n` +
  wordBooks.map((book) => `- ${book.name}（${book.id}）：${book.words.length} 词`).join("\n") +
  `\n- 合计：${total} 词\n`;
fs.writeFileSync(reportPath, report, "utf8");

console.log(wordBooks.map((book) => `${book.id}: ${book.words.length}`).join("\n"));
console.log(`total: ${total}`);
