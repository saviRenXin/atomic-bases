import assert from "node:assert/strict";
import test from "node:test";
import { findAtomicPropertyLocation, tokenizeHighlights } from "../src/highlight.mjs";

test("tokenizes multiple highlight segments", () => {
  assert.deepEqual(tokenizeHighlights("==Z语言== 属于 ==形式化方法==。"), [
    { text: "Z语言", highlighted: true, covered: false },
    { text: " 属于 ", highlighted: false, covered: false },
    { text: "形式化方法", highlighted: true, covered: false },
    { text: "。", highlighted: false, covered: false }
  ]);
});

test("leaves unmatched markers unchanged", () => {
  assert.deepEqual(tokenizeHighlights("前文 ==未闭合"), [
    { text: "前文 ==未闭合", highlighted: false, covered: false }
  ]);
});

test("supports Chinese, spaces, and an empty value", () => {
  assert.deepEqual(tokenizeHighlights("==重点 内容=="), [
    { text: "重点 内容", highlighted: true, covered: false }
  ]);
  assert.deepEqual(tokenizeHighlights(""), []);
});

test("tokenizes independent recall covers before highlights", () => {
  assert.deepEqual(tokenizeHighlights("==重点==，@@答案@@，@@第二个答案@@。"), [
    { text: "重点", highlighted: true, covered: false },
    { text: "，", highlighted: false, covered: false },
    { text: "答案", highlighted: false, covered: true },
    { text: "，", highlighted: false, covered: false },
    { text: "第二个答案", highlighted: false, covered: true },
    { text: "。", highlighted: false, covered: false }
  ]);
});

test("leaves recall covers with at-signs or newlines unchanged", () => {
  assert.deepEqual(tokenizeHighlights("前文 @@未@闭合"), [
    { text: "前文 @@未@闭合", highlighted: false, covered: false }
  ]);
  assert.deepEqual(tokenizeHighlights("前文 @@跨\n行@@"), [
    { text: "前文 @@跨\n行@@", highlighted: false, covered: false }
  ]);
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
