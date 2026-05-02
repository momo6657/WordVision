import crypto from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { del, list, put } from "@vercel/blob";
import { getImageConfig, jsonError } from "../_lib/images/config.js";
import { getProvider } from "../_lib/images/providers/index.js";

const bookLoaders = {
  gaokao: () => import("../../src/data/books/gaokao.js").then((module) => module.book),
  cet4: () => import("../../src/data/books/cet4.js").then((module) => module.book),
  cet6: () => import("../../src/data/books/cet6.js").then((module) => module.book),
};

const counters = new Map();
const inFlightGenerations = globalThis.__wordvisionImageGenerations || new Map();
globalThis.__wordvisionImageGenerations = inFlightGenerations;
const recentGeneratedImages = globalThis.__wordvisionRecentGeneratedImages || new Map();
globalThis.__wordvisionRecentGeneratedImages = recentGeneratedImages;
const RECENT_IMAGE_TTL_MS = 10 * 60 * 1000;

const hashText = (value) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);

const findWord = async (bookId, wordId) => {
  const loader = bookLoaders[bookId];
  const book = loader ? await loader() : null;
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

const deleteCachedBlobs = async (prefix) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const result = await list({ prefix, limit: 100 });
  const urls = result.blobs?.map((blob) => blob.url).filter(Boolean) || [];
  if (urls.length) await del(urls);
};

const storeBlob = async (path, bytes, mimeType) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  return put(path, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: mimeType,
  });
};

const getRecentImage = (prefix) => {
  const cached = recentGeneratedImages.get(prefix);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    recentGeneratedImages.delete(prefix);
    return null;
  }
  return cached.payload;
};

const rememberRecentImage = (prefix, payload) => {
  recentGeneratedImages.set(prefix, {
    payload,
    expiresAt: Date.now() + RECENT_IMAGE_TTL_MS,
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

  const { book, word } = await findWord(bookId, wordId);
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

      const recent = getRecentImage(prefix);
      if (recent?.imageUrl) {
        return res.status(200).json({
          ...recent,
          cached: true,
          transientCached: true,
          message: "Image loaded from recent in-memory cache while Blob cache is warming.",
        });
      }
    }

    if (!config.apiKey && ["openai", "custom"].includes(config.provider)) {
      return jsonError(res, 501, "需要配置真实图片生成 API：请在 Vercel 环境变量中设置 AI_IMAGE_API_KEY 或 OPENAI_API_KEY。", {
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

    const generateAndCache = async () => {
      if (!consumeDailyQuota(config.dailyLimit)) {
        const error = new Error("Daily image generation limit reached.");
        error.statusCode = 429;
        throw error;
      }

      const generated = await provider.generateImage({ prompt, word, meaning, config });
      const mimeType = generated.mimeType || "image/png";

      if (generated.imageUrl && !process.env.BLOB_READ_WRITE_TOKEN) {
        const payload = {
          status: "ready",
          imageUrl: generated.imageUrl,
          cached: false,
          provider: generated.provider,
          model: generated.model,
          message: generated.message || "Image generated by provider URL.",
        };
        rememberRecentImage(prefix, payload);
        return payload;
      }

      if (generated.imageUrl && config.cacheStrategy === "fast-url") {
        const payload = {
          status: "ready",
          imageUrl: generated.imageUrl,
          cached: false,
          cachePending: true,
          provider: generated.provider,
          model: generated.model,
          message: generated.message || "Image generated by provider URL. Blob cache is warming in background.",
        };
        rememberRecentImage(prefix, payload);
        waitUntil(
          (async () => {
            try {
              const bytes = await readRemoteBytes(generated.imageUrl);
              const extension = mimeType.includes("jpeg") ? "jpg" : "png";
              if (force) await deleteCachedBlobs(prefix);
              const blob = await storeBlob(`${prefix}.${extension}`, bytes, mimeType);
              if (blob?.url) {
                rememberRecentImage(prefix, {
                  ...payload,
                  imageUrl: blob.url,
                  cached: true,
                  cachePending: false,
                  message: "Image generated and cached.",
                });
              }
            } catch (error) {
              console.warn("Failed to warm Blob image cache:", error);
            }
          })(),
        );
        return payload;
      }

      const bytes = generated.imageBytes || (generated.imageUrl ? await readRemoteBytes(generated.imageUrl) : null);
      if (!bytes) throw new Error("Provider returned no image bytes or URL.");

      const extension = mimeType.includes("jpeg") ? "jpg" : "png";
      if (force) await deleteCachedBlobs(prefix);
      const blob = await storeBlob(`${prefix}.${extension}`, bytes, mimeType);
      const imageUrl = blob?.url || toDataUrl(bytes, mimeType);

      return {
        status: "ready",
        imageUrl,
        cached: Boolean(blob),
        provider: generated.provider,
        model: generated.model,
        message: generated.message || (blob ? "Image generated and cached." : "Image generated without Blob cache."),
      };
    };

    if (!force && inFlightGenerations.has(prefix)) {
      const payload = await inFlightGenerations.get(prefix);
      return res.status(200).json({
        ...payload,
        deduped: true,
        message: payload.cached ? "Image loaded from in-flight generation and cache." : "Image loaded from in-flight generation.",
      });
    }

    const generation = generateAndCache();
    if (!force) inFlightGenerations.set(prefix, generation);

    try {
      const payload = await generation;
      return res.status(200).json(payload);
    } finally {
      if (!force) inFlightGenerations.delete(prefix);
    }
  } catch (error) {
    return jsonError(res, error.statusCode || 500, error.message || "Image generation failed.", {
      provider: config.provider,
      model: config.model,
    });
  }
}
