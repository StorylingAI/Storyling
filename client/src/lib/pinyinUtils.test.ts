import { describe, expect, it } from "vitest";
import { pairPinyinWithChinese } from "./pinyinUtils";

describe("pairPinyinWithChinese", () => {
  it("splits attached pinyin syllables for Chinese character alignment", () => {
    expect(pairPinyinWithChinese("\u6280\u672F", "j\u00ECsh\u00F9")).toEqual([
      { chinese: "\u6280", pinyin: "j\u00EC" },
      { chinese: "\u672F", pinyin: "sh\u00F9" },
    ]);
  });

  it("keeps punctuation without consuming pinyin syllables", () => {
    expect(pairPinyinWithChinese("\u5C55\u4F1A\uFF0C\u6280\u672F", "zh\u01CEn hu\u00EC j\u00ECsh\u00F9")).toEqual([
      { chinese: "\u5C55", pinyin: "zh\u01CEn" },
      { chinese: "\u4F1A", pinyin: "hu\u00EC" },
      { chinese: "\uFF0C", pinyin: "" },
      { chinese: "\u6280", pinyin: "j\u00EC" },
      { chinese: "\u672F", pinyin: "sh\u00F9" },
    ]);
  });

  it("strips sentence punctuation from pinyin syllables", () => {
    expect(pairPinyinWithChinese("\u5B66\u751F\u3002", "xu\u00E9 sh\u0113ng.")).toEqual([
      { chinese: "\u5B66", pinyin: "xu\u00E9" },
      { chinese: "\u751F", pinyin: "sh\u0113ng" },
      { chinese: "\u3002", pinyin: "" },
    ]);
  });
});
