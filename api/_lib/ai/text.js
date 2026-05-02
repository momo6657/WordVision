export const getTextConfig = () => ({
  provider: process.env.AI_TEXT_PROVIDER || "local",
  model: process.env.AI_TEXT_MODEL || "gpt-4o-mini",
  baseUrl: process.env.AI_TEXT_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.AI_TEXT_API_KEY || process.env.OPENAI_API_KEY || "",
});

const resolveChatUrl = (baseUrl) => {
  const cleanUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!cleanUrl) return "";
  if (/\/chat\/completions$/i.test(cleanUrl)) return cleanUrl;
  return `${cleanUrl}/chat/completions`;
};

export const parseJSON = (text) => {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

export const callTextModel = async ({ system, user, schemaHint }) => {
  const config = getTextConfig();
  if (!config.apiKey || config.provider === "local") return null;

  const response = await fetch(resolveChatUrl(config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${system}\nReturn strict JSON only. ${schemaHint || ""}` },
        { role: "user", content: user },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `AI text provider failed with ${response.status}`);
  return parseJSON(payload.choices?.[0]?.message?.content);
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
