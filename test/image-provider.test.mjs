import assert from "node:assert/strict";
import test from "node:test";
import { getImageConfig } from "../api/_lib/images/config.js";
import { generateImage as generateCustomImage } from "../api/_lib/images/providers/custom.js";
import { getProvider } from "../api/_lib/images/providers/index.js";

test("image config defaults to real OpenAI image generation", () => {
  const oldProvider = process.env.AI_IMAGE_PROVIDER;
  const oldModel = process.env.AI_IMAGE_MODEL;
  const oldStyle = process.env.AI_IMAGE_STYLE;
  const oldFormat = process.env.AI_IMAGE_OUTPUT_FORMAT;
  delete process.env.AI_IMAGE_PROVIDER;
  delete process.env.AI_IMAGE_MODEL;
  delete process.env.AI_IMAGE_STYLE;
  delete process.env.AI_IMAGE_OUTPUT_FORMAT;

  const config = getImageConfig();
  assert.equal(config.provider, "openai");
  assert.equal(config.model, "gpt-image-1");
  assert.equal(config.style, "realistic");
  assert.equal(config.outputFormat, "png");

  if (oldProvider) process.env.AI_IMAGE_PROVIDER = oldProvider;
  if (oldModel) process.env.AI_IMAGE_MODEL = oldModel;
  if (oldStyle) process.env.AI_IMAGE_STYLE = oldStyle;
  if (oldFormat) process.env.AI_IMAGE_OUTPUT_FORMAT = oldFormat;
});

test("mock image provider is disabled", () => {
  assert.equal(getProvider("mock"), null);
  assert.equal(getProvider("not-real"), null);
  assert.equal(typeof getProvider("openai").generateImage, "function");
});

test("custom provider appends image generation endpoint for v1 base urls", async () => {
  const oldFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from("png").toString("base64") }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await generateCustomImage({
      prompt: "A realistic photo of a classroom.",
      word: { word: "classroom" },
      meaning: "教室",
      config: {
        baseUrl: "https://api.vip.crond.dev/v1",
        apiKey: "test-key",
        model: "GPT-image 2",
        size: "1024x1024",
        quality: "low",
        style: "realistic",
        outputFormat: "png",
      },
    });

    assert.equal(requestedUrl, "https://api.vip.crond.dev/v1/images/generations");
    assert.equal(result.provider, "custom");
    assert.equal(result.model, "GPT-image 2");
  } finally {
    globalThis.fetch = oldFetch;
  }
});
