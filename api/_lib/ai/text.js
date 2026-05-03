export const getTextConfig = () => ({
  provider: process.env.AI_TEXT_PROVIDER || "custom",
  model: process.env.AI_TEXT_MODEL || "claude-opus-4-7-standard",
  baseUrl: process.env.AI_TEXT_BASE_URL || "https://api.vip.crond.dev/v1",
  apiKey: process.env.AI_TEXT_API_KEY || process.env.OPENAI_API_KEY || "",
});

const resolveChatUrl = (baseUrl) => {
  const cleanUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!cleanUrl) return "";
  if (/\/chat\/completions$/i.test(cleanUrl)) return cleanUrl;
  if (/\/v\d+$/i.test(cleanUrl)) return `${cleanUrl}/chat/completions`;
  if (/^https?:\/\/api\.vip\.crond\.dev$/i.test(cleanUrl)) return `${cleanUrl}/v1/chat/completions`;
  return `${cleanUrl}/chat/completions`;
};

const getTextCache = () => {
  globalThis.__wordVisionTextCache ||= new Map();
  globalThis.__wordVisionTextInflight ||= new Map();
  return {
    cache: globalThis.__wordVisionTextCache,
    inflight: globalThis.__wordVisionTextInflight,
  };
};

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

const cloneJSON = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

const putCachedText = (key, value) => {
  const { cache } = getTextCache();
  cache.set(key, { value: cloneJSON(value), createdAt: Date.now() });
  if (cache.size > 120) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
};

export const parseJSON = (text) => {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        // Continue to balanced-object extraction below.
      }
    }

    const starts = [...trimmed.matchAll(/\{/g)].map((match) => match.index);
    for (const start of starts) {
      let depth = 0;
      for (let index = start; index < trimmed.length; index += 1) {
        const char = trimmed[index];
        if (char === "{") depth += 1;
        if (char === "}") depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
    return null;
  }
};

export const callTextModel = async ({ system, user, schemaHint }) => {
  const config = getTextConfig();
  if (!config.apiKey || config.provider === "local") return null;
  const shouldRequestJson = process.env.AI_TEXT_RESPONSE_FORMAT !== "none";
  const requestBody = {
    model: config.model,
    temperature: 0.2,
    ...(shouldRequestJson ? { response_format: { type: "json_object" } } : {}),
    messages: [
      {
        role: "system",
        content: `You are a JSON API. Output exactly one valid JSON object that matches the requested schema. Do not output markdown, explanations, apologies, or follow-up questions outside JSON.\n${system}\n${schemaHint || ""}`,
      },
      { role: "user", content: user },
    ],
  };
  const cacheKey = stableStringify({
    provider: config.provider,
    model: config.model,
    baseUrl: resolveChatUrl(config.baseUrl),
    body: requestBody,
  });
  const { cache, inflight } = getTextCache();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 1000 * 60 * 60 * 24) return cloneJSON(cached.value);
  if (inflight.has(cacheKey)) return cloneJSON(await inflight.get(cacheKey));

  const requestPromise = (async () => {
    const response = await fetch(resolveChatUrl(config.baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `AI text provider failed with ${response.status}`);
    const parsed = parseJSON(payload.choices?.[0]?.message?.content);
    putCachedText(cacheKey, parsed);
    return parsed;
  })();

  inflight.set(cacheKey, requestPromise);
  try {
    return cloneJSON(await requestPromise);
  } finally {
    inflight.delete(cacheKey);
  }
};

export const jsonResponse = (res, payload) => {
  res.status(200).json({ status: "ready", provider: getTextConfig().provider, model: getTextConfig().model, ...payload });
};

export const jsonError = (res, statusCode, message, extra = {}) => {
  res.status(statusCode).json({ status: "error", message, ...extra });
};

export const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
};
