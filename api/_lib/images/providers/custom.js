const resolveGenerationUrl = (baseUrl) => {
  const cleanUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!cleanUrl) return "";
  if (/\/images\/generations$/i.test(cleanUrl)) return cleanUrl;
  return `${cleanUrl}/images/generations`;
};

export const generateImage = async ({ prompt, config }) => {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error("AI_IMAGE_BASE_URL and AI_IMAGE_API_KEY are required for the custom provider.");
  }

  const response = await fetch(resolveGenerationUrl(config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
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
    throw new Error(payload?.error?.message || payload?.message || `Custom image provider failed with ${response.status}`);
  }

  const imageUrl = payload.imageUrl || payload.url || payload.data?.[0]?.imageUrl || payload.data?.[0]?.url;
  const b64 = payload.b64_json || payload.image_base64 || payload.data?.[0]?.b64_json || payload.data?.[0]?.image_base64;
  if (b64) {
    return {
      imageBytes: Buffer.from(b64, "base64"),
      mimeType: payload.mimeType || "image/png",
      provider: "custom",
      model: config.model,
      costTier: config.quality,
    };
  }
  if (imageUrl) {
    return {
      imageUrl,
      mimeType: payload.mimeType || "image/png",
      provider: "custom",
      model: config.model,
      costTier: config.quality,
    };
  }

  throw new Error("Custom image provider response did not include imageUrl or b64_json.");
};
