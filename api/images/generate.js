import crypto from "node:crypto";
import { list, put } from "@vercel/blob";
import { wordBooks } from "../../src/data/words.js";
import { getImageConfig, jsonError } from "../_lib/images/config.js";
import { getProvider } from "../_lib/images/providers/index.js";

const counters = new Map();

const hashText = (value) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);

const findWord = (bookId, wordId) => {
  const book = wordBooks.find((item) => item.id === bookId);
  if (!book) return { book: null, word: null };
  return { book, word: book.words.find((item) => item.id === wordId) || null };
};

const toDataUrl = (bytes, mimeType) => `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;

const readRemoteBytes = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download generated image: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const getCachePrefix = (bookId, word, config, prompt) => {
  const safeWord = word.word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `wordvision/${bookId}/${word.id}/${config.provider}/${config.model}/${config.quality}/${config.size}/${safeWord}-${hashText(prompt)}`;
};

const getCachedBlob = async (prefix) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const result = await list({ prefix, limit: 1 });
  return result.blobs?.[0] || null;
};

const storeBlob = async (path, bytes, mimeType) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  return put(path, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: mimeType,
  });
};

const consumeDailyQuota = (limit) => {
  const day = new Date().toISOString().slice(0, 10);
  const current = counters.get(day) || 0;
  if (current >= limit) return false;
  counters.set(day, current + 1);
  return true;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return jsonError(res, 405, "Only POST is supported.");
  }

  const { bookId, wordId, force = false } = req.body || {};
  if (!bookId || !wordId) return jsonError(res, 400, "bookId and wordId are required.");

  const { book, word } = findWord(bookId, wordId);
  if (!book || !word) return jsonError(res, 404, "Word not found.");

  const config = getImageConfig();
  const meaning = word.simpleMeaning || word.meaning;
  const visualStyle =
    config.style === "anime"
      ? "high-quality anime scene"
      : "realistic photographic scene with natural lighting, real objects, and believable real-world composition";
  const prompt = [
    `Create one ${visualStyle} for an English vocabulary learning app.`,
    "Depict the concrete object, action, emotion, or situation of the vocabulary word directly. For abstract words, show a clear real-world situation that represents the meaning.",
    `Target vocabulary word: ${word.word}. Core meaning: ${meaning}.`,
    word.definition ? `Dictionary context: ${word.definition}.` : "",
    word.example ? `Example context: ${word.example}` : "",
    "Do not use a generic fallback subject. Do not show a pig, car, animal, person, or object unless it directly matches the target word meaning.",
    "The image must be a pictorial scene only: no letters, no words, no captions, no labels, no watermark, no UI, no spelling of the target word.",
    "Avoid vector art, flat icons, diagrams, clipart, logos, or code-generated illustration styles. Output should be a normal bitmap image suitable for memory.",
  ]
    .filter(Boolean)
    .join(" ");
  const prefix = getCachePrefix(bookId, word, config, prompt);

  try {
    if (!force) {
      const cached = await getCachedBlob(prefix);
      if (cached?.url) {
        return res.status(200).json({
          status: "ready",
          imageUrl: cached.url,
          cached: true,
          provider: config.provider,
          model: config.model,
          message: "Image loaded from cache.",
        });
      }
    }

    if (!config.apiKey && ["openai", "custom"].includes(config.provider)) {
      return jsonError(res, 501, "需要配置真实图片生成 API：请在 Vercel 环境变量中设置 AI_IMAGE_API_KEY 或 OPENAI_API_KEY。", {
        provider: config.provider,
        model: config.model,
      });
    }

    if (!consumeDailyQuota(config.dailyLimit)) {
      return jsonError(res, 429, "Daily image generation limit reached.", {
        provider: config.provider,
        model: config.model,
      });
    }

    const provider = getProvider(config.provider);
    if (!provider) {
      return jsonError(res, 400, `Unsupported AI_IMAGE_PROVIDER: ${config.provider}`, {
        provider: config.provider,
        model: config.model,
      });
    }
    const generated = await provider.generateImage({ prompt, word, meaning, config });

    const mimeType = generated.mimeType || "image/png";
    if (generated.imageUrl && !process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(200).json({
        status: "ready",
        imageUrl: generated.imageUrl,
        cached: false,
        provider: generated.provider,
        model: generated.model,
        message: generated.message || "Image generated by provider URL.",
      });
    }

    const bytes = generated.imageBytes || (generated.imageUrl ? await readRemoteBytes(generated.imageUrl) : null);
    if (!bytes) throw new Error("Provider returned no image bytes or URL.");

    const extension = mimeType.includes("jpeg") ? "jpg" : "png";
    const blob = await storeBlob(`${prefix}.${extension}`, bytes, mimeType);
    const imageUrl = blob?.url || toDataUrl(bytes, mimeType);

    return res.status(200).json({
      status: "ready",
      imageUrl,
      cached: Boolean(blob),
      provider: generated.provider,
      model: generated.model,
      message: generated.message || (blob ? "Image generated and cached." : "Image generated without Blob cache."),
    });
  } catch (error) {
    return jsonError(res, 500, error.message || "Image generation failed.", {
      provider: config.provider,
      model: config.model,
    });
  }
}
