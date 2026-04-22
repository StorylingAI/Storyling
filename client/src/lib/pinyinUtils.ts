/**
 * Utility functions for pairing pinyin with Chinese text.
 */

export interface PinyinPair {
  chinese: string;
  pinyin: string;
}

function isChinese(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x4e00 && code <= 0x9fff;
}

function isPunctuation(char: string): boolean {
  return /[\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u201C\u201D\u2018\u2019\uFF08\uFF09\u3001\u300A\u300B\u3010\u3011,.!?;:'"()[\]{}]/.test(char);
}

const PINYIN_VOWELS = "a\u0101\u00E1\u01CE\u00E0e\u0113\u00E9\u011B\u00E8i\u012B\u00ED\u01D0\u00ECo\u014D\u00F3\u01D2\u00F2u\u016B\u00FA\u01D4\u00F9\u00FC\u01D6\u01D8\u01DA\u01DCv";
const PINYIN_INITIAL = "(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcswy])";
const PINYIN_SYLLABLE_PATTERN = new RegExp(
  `^${PINYIN_INITIAL}?(?:[${PINYIN_VOWELS}]+(?:ng|n|r)?|er)(?=${PINYIN_INITIAL}|$)`,
  "i",
);

function splitPinyinToken(token: string): string[] {
  let remaining = token;
  const syllables: string[] = [];

  while (remaining.length > 0) {
    const match = remaining.match(PINYIN_SYLLABLE_PATTERN);
    if (!match) {
      return [token];
    }

    syllables.push(match[0]);
    remaining = remaining.slice(match[0].length);
  }

  return syllables;
}

/**
 * Parse pinyin and Chinese text to create character-by-character pairs.
 * Chinese characters get one pinyin syllable directly above each character.
 */
export function pairPinyinWithChinese(chinese: string, pinyin: string): PinyinPair[] {
  if (!pinyin || !chinese) {
    return [{ chinese, pinyin: "" }];
  }

  const pairs: PinyinPair[] = [];
  const pinyinParts = pinyin
    .replace(/[\s,\uFF0C\u3001.!?;:\u3002\uFF01\uFF1F\uFF1B\uFF1A\u201C\u201D\u2018\u2019'"()[\]{}]+/g, " ")
    .trim()
    .split(/\s+/)
    .flatMap(splitPinyinToken)
    .filter(Boolean);

  let pinyinIndex = 0;
  let i = 0;

  while (i < chinese.length) {
    const char = chinese[i];

    if (isPunctuation(char)) {
      pairs.push({ chinese: char, pinyin: "" });
      i += 1;
      continue;
    }

    if (/\s/.test(char)) {
      pairs.push({ chinese: " ", pinyin: "" });
      i += 1;
      continue;
    }

    if (isChinese(char)) {
      pairs.push({ chinese: char, pinyin: pinyinParts[pinyinIndex] || "" });
      pinyinIndex += 1;
      i += 1;
      continue;
    }

    let nonChineseGroup = "";
    let nonChinesePinyin = "";
    while (
      i < chinese.length &&
      !isChinese(chinese[i]) &&
      !isPunctuation(chinese[i]) &&
      !/\s/.test(chinese[i])
    ) {
      nonChineseGroup += chinese[i];
      i += 1;
    }

    if (nonChineseGroup) {
      if (pinyinParts[pinyinIndex]?.toLowerCase() === nonChineseGroup.toLowerCase()) {
        nonChinesePinyin = pinyinParts[pinyinIndex];
        pinyinIndex += 1;
      }
      pairs.push({ chinese: nonChineseGroup, pinyin: nonChinesePinyin });
    }
  }

  return pairs.length > 0 ? pairs : [{ chinese, pinyin }];
}
