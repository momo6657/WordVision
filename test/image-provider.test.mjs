import assert from "node:assert/strict";
import test from "node:test";
import { getImageConfig } from "../api/_lib/images/config.js";
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
