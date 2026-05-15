const memoryInflight = new Map();
const CACHE_PREFIX = "wordvision-ai-cache:v3:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const cacheKeyFor = (url, body) => {
  const raw = `${url}:${stableStringify(body || {})}`;
  return `${CACHE_PREFIX}${btoa(unescape(encodeURIComponent(raw))).slice(0, 180)}`;
};

const readCached = (key) => {
  if (typeof localStorage === "undefined") return null;
  try {
    const cached = JSON.parse(localStorage.getItem(key) || "null");
    if (!cached || Date.now() - cached.createdAt > CACHE_TTL_MS) return null;
    return cached.payload;
  } catch {
    return null;
  }
};

const writeCached = (key, payload) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ createdAt: Date.now(), payload }));
  } catch {
    // Ignore quota errors; server-side cache still prevents duplicate model calls.
  }
};

const cleanErrorMessage = (value, status) => {
  const raw = String(value || "").trim();
  if (/<html[\s>]|<!doctype html|<script[\s>]|<body[\s>]/i.test(raw)) {
    return `AI 服务接口返回 ${status || "错误"}，请检查服务端 API 配置。`;
  }
  return raw.replace(/\s+/g, " ").slice(0, 180) || `AI 请求失败：${status}`;
};

const postJSON = async (url, body, { cache = true } = {}) => {
  const cacheKey = cache ? cacheKeyFor(url, body) : "";
  const cached = cacheKey ? readCached(cacheKey) : null;
  if (cached) return cached;
  const inflightKey = cacheKey || `${url}:${stableStringify(body || {})}`;
  if (memoryInflight.has(inflightKey)) return memoryInflight.get(inflightKey);

  const request = (async () => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let payload = {};
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    payload = {};
  }
  if (!response.ok || payload.status === "error") throw new Error(cleanErrorMessage(payload.message || responseText, response.status));
    if (cacheKey && !payload.warning) writeCached(cacheKey, payload);
  return payload;
  })();

  memoryInflight.set(inflightKey, request);
  try {
    return await request;
  } finally {
    memoryInflight.delete(inflightKey);
  }
};

export const generateScene = (body) => postJSON("/api/ai/scene", body);
export const generateDialogue = (body) => postJSON("/api/ai/dialogue", body);
export const analyzeSentence = (body) => postJSON("/api/ai/sentence", body);
