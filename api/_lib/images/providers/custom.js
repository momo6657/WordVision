const resolveGenerationUrl = (baseUrl) => {
  const cleanUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!cleanUrl) return "";
  if (/\/images\/generations$/i.test(cleanUrl)) return cleanUrl;
  if (!/\/v\d+$/i.test(cleanUrl) && /^https?:\/\/(www\.)?uocode\.com$/i.test(cleanUrl)) {
    return `${cleanUrl}/v1/images/generations`;
  }
  return `${cleanUrl}/images/generations`;
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const getFallbackModels = (config) => {
  const configured = String(config.fallbackModels || process.env.AI_IMAGE_FALLBACK_MODELS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const crondFallbacks = /api\.vip\.crond\.dev/i.test(config.baseUrl || "")
    ? ["gpt-image-2-codex", "gpt-image-2-chat"]
    : [];
  return unique([config.model, ...configured, ...crondFallbacks]);
};

const providerMessage = (payload, status, model) => {
  const message = payload?.error?.message || payload?.message || `Custom image provider failed with ${status}`;
  if (/no available upstream|all cooled/i.test(message)) {
    return `图片供应商当前没有可用上游通道，模型 ${model} 暂时不可用。`;
  }
  return String(message || "").replace(/\s+/g, " ").slice(0, 240);
};

const requestImage = async ({ prompt, config, model }) => {
  const response = await fetch(resolveGenerationUrl(config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "WordVision/1.0 (+https://wordvision.vercel.app)",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: config.size,
      quality: config.quality,
      response_format: config.responseFormat,
      output_format: config.outputFormat,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(providerMessage(payload, response.status, model));
    error.statusCode = response.status;
    error.model = model;
    throw error;
  }
  return payload;
};

export const generateImage = async ({ prompt, config }) => {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error("AI_IMAGE_BASE_URL and AI_IMAGE_API_KEY are required for the custom provider.");
  }

  const models = getFallbackModels(config);
  const errors = [];
  let payload = null;
  let usedModel = config.model;
  for (const model of models) {
    try {
      payload = await requestImage({ prompt, config, model });
      usedModel = model;
      break;
    } catch (error) {
      errors.push({ model, message: error.message, statusCode: error.statusCode });
    }
  }

  if (!payload) {
    const error = new Error(
      `情景图片生成失败：图片供应商当前没有可用上游通道。已尝试 ${models.join("、")}，请稍后重试或更换可用生图渠道。`,
    );
    error.statusCode = errors.find((item) => item.statusCode)?.statusCode || 503;
    error.triedModels = models;
    error.providerErrors = errors;
    throw error;
  }

  const imageUrl = payload.imageUrl || payload.url || payload.data?.[0]?.imageUrl || payload.data?.[0]?.url;
  const b64 = payload.b64_json || payload.image_base64 || payload.data?.[0]?.b64_json || payload.data?.[0]?.image_base64;
  if (b64) {
    return {
      imageBytes: Buffer.from(b64, "base64"),
      mimeType: payload.mimeType || "image/png",
      provider: "custom",
      model: usedModel,
      costTier: config.quality,
    };
  }
  if (imageUrl) {
    return {
      imageUrl,
      mimeType: payload.mimeType || "image/png",
      provider: "custom",
      model: usedModel,
      costTier: config.quality,
    };
  }

  throw new Error("Custom image provider response did not include imageUrl or b64_json.");
};
