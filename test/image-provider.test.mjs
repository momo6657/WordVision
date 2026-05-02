import assert from "node:assert/strict";
import test from "node:test";
import { getImageConfig } from "../api/_lib/images/config.js";
import { generateImage as generateCustomImage } from "../api/_lib/images/providers/custom.js";
import { getProvider } from "../api/_lib/images/providers/index.js";

test("image config defaults to real OpenAI image generation", () => {
  const oldProvider = process.env.AI_IMAGE_PROVIDER;
  const oldModel = process.env.AI_IMAGE_MODEL;
  const oldStyle = process.env.AI_IMAGE_STYLE;
  const oldResponseFormat = process.env.AI_IMAGE_RESPONSE_FORMAT;
  const oldFormat = process.env.AI_IMAGE_OUTPUT_FORMAT;
  const oldCacheStrategy = process.env.AI_IMAGE_CACHE_STRATEGY;
  delete process.env.AI_IMAGE_PROVIDER;
  delete process.env.AI_IMAGE_MODEL;
  delete process.env.AI_IMAGE_STYLE;
  delete process.env.AI_IMAGE_RESPONSE_FORMAT;
  delete process.env.AI_IMAGE_OUTPUT_FORMAT;
  delete process.env.AI_IMAGE_CACHE_STRATEGY;

  const config = getImageConfig();
  assert.equal(config.provider, "openai");
  assert.equal(config.model, "gpt-image-1");
  assert.equal(config.style, "realistic");
  assert.equal(config.responseFormat, "url");
  assert.equal(config.outputFormat, "png");
  assert.equal(config.cacheStrategy, "fast-url");

  if (oldProvider) process.env.AI_IMAGE_PROVIDER = oldProvider;
  if (oldModel) process.env.AI_IMAGE_MODEL = oldModel;
  if (oldStyle) process.env.AI_IMAGE_STYLE = oldStyle;
  if (oldResponseFormat) process.env.AI_IMAGE_RESPONSE_FORMAT = oldResponseFormat;
  if (oldFormat) process.env.AI_IMAGE_OUTPUT_FORMAT = oldFormat;
  if (oldCacheStrategy) process.env.AI_IMAGE_CACHE_STRATEGY = oldCacheStrategy;
});

test("mock image provider is disabled", () => {
  assert.equal(getProvider("mock"), null);
  assert.equal(getProvider("not-real"), null);
  assert.equal(typeof getProvider("openai").generateImage, "function");
});

test("custom provider appends image generation endpoint for v1 base urls", async () => {
  const oldFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestBody = {};
  globalThis.fetch = async (url, init) => {
    requestedUrl = url;
    requestBody = JSON.parse(init.body);
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
        responseFormat: "url",
        outputFormat: "png",
      },
    });

    assert.equal(requestedUrl, "https://api.vip.crond.dev/v1/images/generations");
    assert.equal(requestBody.response_format, "url");
    assert.equal(requestBody.output_format, "png");
    assert.equal(result.provider, "custom");
    assert.equal(result.model, "GPT-image 2");
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("custom provider resolves uocode root to the v1 image generation endpoint", async () => {
  const oldFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return new Response(JSON.stringify({ data: [{ url: "https://cdn.example.com/image.png" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await generateCustomImage({
      prompt: "A realistic photo of a medal on a podium.",
      word: { word: "medal" },
      meaning: "奖牌",
      config: {
        baseUrl: "https://www.uocode.com",
        apiKey: "test-key",
        model: "codex-gpt-image-2",
        size: "1024x1024",
        quality: "low",
        responseFormat: "url",
        outputFormat: "png",
      },
    });

    assert.equal(requestedUrl, "https://www.uocode.com/v1/images/generations");
  } finally {
    globalThis.fetch = oldFetch;
  }
});
