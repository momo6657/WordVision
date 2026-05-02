import assert from "node:assert/strict";
import test from "node:test";
import { createOptions, getBookStats, selectWordsForSession, updateReviewSchedule } from "../src/utils/quiz.js";

const book = {
  id: "demo",
  words: [
    { id: "w1", word: "alpha", meaning: "第一", learned: false, wrongCount: 0, favorite: false },
    { id: "w2", word: "bravo", meaning: "第二", learned: true, wrongCount: 1, favorite: true, dueAt: "2020-01-01T00:00:00.000Z" },
    { id: "w3", word: "charlie", meaning: "第三", learned: true, wrongCount: 0, favorite: false, dueAt: "2999-01-01T00:00:00.000Z" },
    { id: "w4", word: "delta", meaning: "第四", learned: false, wrongCount: 2, favorite: false },
  ],
};

test("createOptions returns one correct answer and unique labels", () => {
  const options = createOptions(book, book.words[0]);
  assert.equal(options.length, 4);
  assert.equal(options.filter((option) => option.isCorrect).length, 1);
  assert.equal(new Set(options.map((option) => option.label)).size, 4);
});

test("createOptions pads tiny custom books to four choices", () => {
  const tinyBook = { id: "custom", words: [{ id: "custom-alpha", word: "alpha", meaning: "第一" }] };
  const options = createOptions(tinyBook, tinyBook.words[0]);
  assert.equal(options.length, 4);
  assert.equal(options.filter((option) => option.isCorrect).length, 1);
  assert.equal(new Set(options.map((option) => option.label)).size, 4);
});

test("selectWordsForSession supports due and favorite modes", () => {
  assert.deepEqual(selectWordsForSession(book, { mode: "due", count: "all", order: "ordered" }).map((word) => word.id), ["w2"]);
  assert.deepEqual(selectWordsForSession(book, { mode: "favorite", count: "all", order: "ordered" }).map((word) => word.id), ["w2"]);
});

test("getBookStats includes due and favorite counts", () => {
  const stats = getBookStats(book);
  assert.equal(stats.total, 4);
  assert.equal(stats.learned, 2);
  assert.equal(stats.due, 1);
  assert.equal(stats.favorite, 1);
});

test("updateReviewSchedule promotes correct answers and demotes wrong answers", () => {
  const now = new Date("2026-04-29T00:00:00.000Z");
  const correct = updateReviewSchedule({ ease: 2.5, intervalDays: 0, reviewCount: 0 }, true, now);
  assert.equal(correct.intervalDays, 1);
  assert.equal(correct.reviewCount, 1);
  assert.ok(new Date(correct.dueAt).getTime() > now.getTime());

  const wrong = updateReviewSchedule({ ease: 2.5, intervalDays: 8, reviewCount: 2 }, false, now);
  assert.equal(wrong.intervalDays, 1);
  assert.equal(wrong.reviewCount, 3);
  assert.ok(wrong.ease < 2.5);
});
