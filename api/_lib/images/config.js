export const getImageConfig = () => {
  const provider = process.env.AI_IMAGE_PROVIDER || "custom";
  return {
    provider,
    model: process.env.AI_IMAGE_MODEL || "grok-4.2-image",
    baseUrl: process.env.AI_IMAGE_BASE_URL || "https://api.vip.crond.dev",
    apiKey: process.env.AI_IMAGE_API_KEY || process.env.OPENAI_API_KEY || "",
    quality: process.env.AI_IMAGE_QUALITY || "low",
    size: process.env.AI_IMAGE_SIZE || "1024x1024",
    responseFormat: process.env.AI_IMAGE_RESPONSE_FORMAT || "url",
    outputFormat: process.env.AI_IMAGE_OUTPUT_FORMAT || "png",
    style: process.env.AI_IMAGE_STYLE || "realistic",
    cacheStrategy: process.env.AI_IMAGE_CACHE_STRATEGY || "fast-url",
    fallbackModels: process.env.AI_IMAGE_FALLBACK_MODELS || "",
    dailyLimit: Number(process.env.AI_IMAGE_DAILY_LIMIT || 120),
  };
};

export const jsonError = (res, statusCode, message, extra = {}) => {
  res.status(statusCode).json({ status: "error", imageUrl: "", cached: false, message, ...extra });
};
