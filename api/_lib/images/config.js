export const getImageConfig = () => {
  const provider = process.env.AI_IMAGE_PROVIDER || (process.env.AI_IMAGE_API_KEY ? "openai" : "mock");
  return {
    provider,
    model: process.env.AI_IMAGE_MODEL || "gpt-image-1.5",
    baseUrl: process.env.AI_IMAGE_BASE_URL || "https://api.openai.com/v1/images/generations",
    apiKey: process.env.AI_IMAGE_API_KEY || process.env.OPENAI_API_KEY || "",
    quality: process.env.AI_IMAGE_QUALITY || "low",
    size: process.env.AI_IMAGE_SIZE || "1024x1024",
    style: process.env.AI_IMAGE_STYLE || "anime",
    dailyLimit: Number(process.env.AI_IMAGE_DAILY_LIMIT || 120),
  };
};

export const jsonError = (res, statusCode, message, extra = {}) => {
  res.status(statusCode).json({ status: "error", imageUrl: "", cached: false, message, ...extra });
};
