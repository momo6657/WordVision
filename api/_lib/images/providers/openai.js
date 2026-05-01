const parseOpenAIImage = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI image request failed with ${response.status}`;
    throw new Error(message);
  }

  const image = payload?.data?.[0];
  if (image?.b64_json) {
    return {
      imageBytes: Buffer.from(image.b64_json, "base64"),
      mimeType: image.output_format ? `image/${image.output_format}` : "image/png",
    };
  }
  if (image?.url) {
    return { imageUrl: image.url, mimeType: "image/png" };
  }
  throw new Error("OpenAI image response did not include an image.");
};

export const generateImage = async ({ prompt, config }) => {
  if (!config.apiKey) {
    throw new Error("AI_IMAGE_API_KEY or OPENAI_API_KEY is required for the OpenAI provider.");
  }

  const response = await fetch(config.baseUrl, {
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
      style: config.style,
    }),
  });

  const parsed = await parseOpenAIImage(response);
  return {
    ...parsed,
    provider: "openai",
    model: config.model,
    costTier: config.quality,
  };
};
