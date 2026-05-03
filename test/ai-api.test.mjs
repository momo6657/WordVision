import assert from "node:assert/strict";
import test from "node:test";
import sentenceHandler from "../api/ai/sentence.js";

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
