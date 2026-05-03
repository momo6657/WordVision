import assert from "node:assert/strict";
import test from "node:test";
import sentenceHandler from "../api/ai/sentence.js";
import { getTextConfig, parseJSON } from "../api/_lib/ai/text.js";

const callHandler = (handler, { method = "POST", body = {} } = {}) =>
  new Promise((resolve) => {
    const headers = {};
    const req = { method, body };
    const res = {
      statusCode: 200,
      setHeader: (key, value) => {
        headers[key] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, headers, payload });
      },
      end() {
        resolve({ status: this.statusCode, headers, payload: null });
      },
    };
    handler(req, res);
  });

test("local sentence analysis identifies linking verb structure and second clause", async () => {
  const result = await callHandler(sentenceHandler, {
    body: {
      sentence: "The task seemed difficult at first, the students gradually understood the structure after the teacher broke it down.",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.status, "ready");
  assert.equal(result.payload.analysis.mainStructure.subject, "The task");
  assert.equal(result.payload.analysis.mainStructure.predicate, "seemed");
  assert.equal(result.payload.analysis.mainStructure.object, "difficult");
  assert.ok(result.payload.analysis.clauses.some((clause) => clause.includes("students") && clause.includes("understood")));
  assert.ok(result.payload.analysis.clauses.some((clause) => clause.includes("after the teacher broke it down")));
});

test("local sentence analysis keeps opening subordinators out of the subject", async () => {
  const result = await callHandler(sentenceHandler, {
    body: {
      sentence: "Although the task seemed difficult at first, the students gradually understood the structure after the teacher broke it down.",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.analysis.mainStructure.subject, "the students");
  assert.equal(result.payload.analysis.mainStructure.predicate, "understood");
  assert.ok(result.payload.analysis.clauses.some((clause) => clause.includes("Although") && clause.includes("主语=the task")));
});

test("local sentence analysis handles infinitive complements", async () => {
  const result = await callHandler(sentenceHandler, {
    body: {
      sentence: "I want to love your mother",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.analysis.mainStructure.subject, "I");
  assert.equal(result.payload.analysis.mainStructure.predicate, "want to love");
  assert.equal(result.payload.analysis.mainStructure.object, "your mother");
  assert.equal(result.payload.analysis.translation, "我想爱你的母亲。");
  assert.ok(!result.payload.analysis.exercises.some((item) => item.question.includes("after")));
});

test("text AI config can reuse the configured image API channel", () => {
  const oldValues = {
    AI_TEXT_PROVIDER: process.env.AI_TEXT_PROVIDER,
    AI_TEXT_MODEL: process.env.AI_TEXT_MODEL,
    AI_TEXT_BASE_URL: process.env.AI_TEXT_BASE_URL,
    AI_TEXT_API_KEY: process.env.AI_TEXT_API_KEY,
    AI_IMAGE_PROVIDER: process.env.AI_IMAGE_PROVIDER,
    AI_IMAGE_MODEL: process.env.AI_IMAGE_MODEL,
    AI_IMAGE_BASE_URL: process.env.AI_IMAGE_BASE_URL,
    AI_IMAGE_API_KEY: process.env.AI_IMAGE_API_KEY,
  };
  delete process.env.AI_TEXT_PROVIDER;
  delete process.env.AI_TEXT_MODEL;
  delete process.env.AI_TEXT_BASE_URL;
  delete process.env.AI_TEXT_API_KEY;
  process.env.AI_IMAGE_PROVIDER = "custom";
  process.env.AI_IMAGE_MODEL = "codex-gpt-image-2";
  process.env.AI_IMAGE_BASE_URL = "https://www.uocode.com/v1";
  process.env.AI_IMAGE_API_KEY = "test-key";

  try {
    const config = getTextConfig();
    assert.equal(config.provider, "custom");
    assert.equal(config.model, "codex-gpt-image-2");
    assert.equal(config.baseUrl, "https://www.uocode.com/v1");
    assert.equal(config.apiKey, "test-key");
  } finally {
    for (const [key, value] of Object.entries(oldValues)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("parseJSON extracts fenced provider responses", () => {
  const parsed = parseJSON('Here is the result:\\n```json\\n{"translation":"我昨天买的那本书很有趣。","mainStructure":{"subject":"The book","predicate":"is","object":"interesting"}}\\n```\\nExtra text');
  assert.equal(parsed.translation, "我昨天买的那本书很有趣。");
  assert.equal(parsed.mainStructure.predicate, "is");
});
