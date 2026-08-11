import assert from "node:assert/strict";
import test from "node:test";
import { findAtomicPropertyLocation, tokenizeHighlights } from "../src/highlight.mjs";

test("tokenizes multiple highlight segments", () => {
  assert.deepEqual(tokenizeHighlights("==Z语言== 属于 ==形式化方法==。"), [
    { text: "Z语言", highlighted: true },
    { text: " 属于 ", highlighted: false },
    { text: "形式化方法", highlighted: true },
    { text: "。", highlighted: false }
  ]);
});

test("leaves unmatched markers unchanged", () => {
  assert.deepEqual(tokenizeHighlights("前文 ==未闭合"), [
    { text: "前文 ==未闭合", highlighted: false }
  ]);
});

test("supports Chinese, spaces, and an empty value", () => {
  assert.deepEqual(tokenizeHighlights("==重点 内容=="), [
    { text: "重点 内容", highlighted: true }
  ]);
  assert.deepEqual(tokenizeHighlights(""), []);
});

test("finds the atomic frontmatter value location", () => {
  assert.deepEqual(
    findAtomicPropertyLocation('---\ntype: 错题卡\natomic: "==重点=="\n---\n'),
    { line: 2, ch: 8 }
  );
});

test("does not mistake body text for a frontmatter property", () => {
  assert.equal(findAtomicPropertyLocation("# Note\natomic: text\n"), null);
});
