export const getTextConfig = () => ({
  provider: process.env.AI_TEXT_PROVIDER || process.env.AI_IMAGE_PROVIDER || "local",
  model: process.env.AI_TEXT_MODEL || process.env.AI_IMAGE_MODEL || "gpt-4o-mini",
  baseUrl: process.env.AI_TEXT_BASE_URL || process.env.AI_IMAGE_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.AI_TEXT_API_KEY || process.env.AI_IMAGE_API_KEY || process.env.OPENAI_API_KEY || "",
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
  const shouldRequestJson =
    process.env.AI_TEXT_RESPONSE_FORMAT !== "none" &&
    !String(config.model || "")
      .toLowerCase()
      .includes("image");

  const response = await fetch(resolveChatUrl(config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
