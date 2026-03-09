/**
 * Utility functions for pairing pinyin with Chinese text
 */

export interface PinyinPair {
  chinese: string;
  pinyin: string;
}

/**
 * Check if a character is a Chinese character
 */
function isChinese(char: string): boolean {
  const code = char.charCodeAt(0);
  // CJK Unified Ideographs range
  return code >= 0x4E00 && code <= 0x9FFF;
}

/**
 * Check if a character is punctuation
 */
function isPunctuation(char: string): boolean {
  return /[，。！？；：""''（）、《》【】,.!?;:'"()\[\]{}]/.test(char);
}

/**
 * Parse pinyin and Chinese text to create character-by-character pairs
 * Each Chinese character gets its corresponding pinyin syllable directly above it
 */
export function pairPinyinWithChinese(chinese: string, pinyin: string): PinyinPair[] {
  if (!pinyin || !chinese) {
    return [{ chinese, pinyin: '' }];
  }

  const pairs: PinyinPair[] = [];
  
  // Split pinyin by spaces and commas, keeping track of punctuation
  const pinyinParts = pinyin.trim().split(/[\s,]+/).filter(p => p.length > 0);
  
  let pinyinIndex = 0;
  let i = 0;
  
  while (i < chinese.length) {
    const char = chinese[i];
    
    // Handle punctuation - add as separate pair without pinyin
    if (isPunctuation(char)) {
      pairs.push({ chinese: char, pinyin: '' });
      i++;
      continue;
    }
    
    // Handle spaces
    if (char === ' ' || char === '\n' || char === '\t') {
      pairs.push({ chinese: ' ', pinyin: '' });
      i++;
      continue;
    }
    
    // Handle Chinese characters
    if (isChinese(char)) {
      const pinyinSyllable = pinyinParts[pinyinIndex] || '';
      pairs.push({ chinese: char, pinyin: pinyinSyllable });
      pinyinIndex++;
      i++;
      continue;
    }
    
    // Handle non-Chinese text (English, numbers, etc.)
    // Group consecutive non-Chinese characters together
    let nonChineseGroup = '';
    let nonChinesePinyin = '';
    while (i < chinese.length && !isChinese(chinese[i]) && !isPunctuation(chinese[i]) && chinese[i] !== ' ') {
      nonChineseGroup += chinese[i];
      i++;
    }
    
    if (nonChineseGroup) {
      // For non-Chinese text, check if there's a matching pinyin
      // (sometimes English words appear in pinyin as-is)
      if (pinyinParts[pinyinIndex]?.toLowerCase() === nonChineseGroup.toLowerCase()) {
        nonChinesePinyin = pinyinParts[pinyinIndex];
        pinyinIndex++;
      }
      pairs.push({ chinese: nonChineseGroup, pinyin: nonChinesePinyin });
    }
  }
  
  return pairs.length > 0 ? pairs : [{ chinese, pinyin }];
}
