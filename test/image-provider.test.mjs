import assert from "node:assert/strict";
import test from "node:test";
import { getImageConfig } from "../api/_lib/images/config.js";
import { getProvider } from "../api/_lib/images/providers/index.js";

test("image config defaults to mock when no key is present", () => {
  const oldProvider = process.env.AI_IMAGE_PROVIDER;
  const oldKey = process.env.AI_IMAGE_API_KEY;
  const oldOpenAIKey = process.env.OPENAI_API_KEY;
  delete process.env.AI_IMAGE_PROVIDER;
  delete process.env.AI_IMAGE_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const config = getImageConfig();
  assert.equal(config.provider, "mock");

  if (oldProvider) process.env.AI_IMAGE_PROVIDER = oldProvider;
  if (oldKey) process.env.AI_IMAGE_API_KEY = oldKey;
  if (oldOpenAIKey) process.env.OPENAI_API_KEY = oldOpenAIKey;
});

test("image provider adapter can fall back to mock", async () => {
  const provider = getProvider("not-real");
  const result = await provider.generateImage({
    word: { word: "abandon" },
    meaning: "放弃",
    prompt: "A student walking away from an old backpack.",
    config: { model: "mock-svg" },
  });

  assert.equal(result.provider, "mock");
  assert.equal(result.mimeType, "image/png");
  assert.ok(result.imageBytes.length > 100);
  assert.equal(result.imageBytes[0], 0x89);
  assert.equal(result.imageBytes.toString("utf8").includes("<svg"), false);
});
