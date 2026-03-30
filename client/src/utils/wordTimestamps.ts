/**
 * Generate estimated word-level timestamps for audio synchronization
 * Uses smart estimation based on word length, punctuation, and total duration
 */

export interface WordTimestamp {
  word: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

/**
 * Calculate relative weight of a word based on its characteristics
 */
function getWordWeight(word: string, nextWord?: string): number {
  // Base weight is word length
  let weight = word.length;
  
  // Add extra weight for punctuation (causes pauses)
  if (word.match(/[.!?]$/)) {
    weight += 3; // Longer pause for sentence endings
  } else if (word.match(/[,;:]$/)) {
    weight += 1.5; // Shorter pause for commas
  }
  
  // Add weight for multi-syllable words (rough estimate)
  const syllables = Math.max(1, Math.floor(word.length / 3));
  weight += syllables * 0.5;
  
  return weight;
}

/**
 * Generate word timestamps from text and total audio duration
 */
export function generateWordTimestamps(
  text: string,
  totalDuration: number
): WordTimestamp[] {
  // Split text into words (preserve punctuation)
  const words = text.match(/\S+/g) || [];
  
  if (words.length === 0) {
    return [];
  }
  
  // Calculate weights for each word
  const weights = words.map((word, idx) => 
    getWordWeight(word, words[idx + 1])
  );
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  // Generate timestamps
  const timestamps: WordTimestamp[] = [];
  let currentTime = 0;
  
  words.forEach((word, idx) => {
    const wordDuration = (weights[idx] / totalWeight) * totalDuration;
    const startTime = currentTime;
    const endTime = currentTime + wordDuration;
    
    timestamps.push({
      word,
      startTime,
      endTime,
    });
    
    currentTime = endTime;
  });
  
  return timestamps;
}

/**
 * Find the currently playing word based on current time
 */
export function getCurrentWordIndex(
  timestamps: WordTimestamp[],
  currentTime: number
): number {
  for (let i = 0; i < timestamps.length; i++) {
    if (currentTime >= timestamps[i].startTime && currentTime < timestamps[i].endTime) {
      return i;
    }
  }
  
  // If past the end, return last word
  if (currentTime >= timestamps[timestamps.length - 1].endTime) {
    return timestamps.length - 1;
  }
  
  return -1;
}

/**
 * Extract word timestamps for a specific line from the full story timestamps
 */
export function getLineWordTimestamps(
  allTimestamps: WordTimestamp[],
  lineText: string
): WordTimestamp[] {
  const lineWords = lineText.match(/\S+/g) || [];
  if (lineWords.length === 0) return [];
  
  // Find matching sequence in all timestamps
  let startIdx = -1;
  
  for (let i = 0; i <= allTimestamps.length - lineWords.length; i++) {
    let match = true;
    for (let j = 0; j < lineWords.length; j++) {
      // Remove markdown bold markers for comparison
      const cleanWord = lineWords[j].replace(/\*\*/g, '');
      const timestampWord = allTimestamps[i + j].word.replace(/\*\*/g, '');
      
      if (cleanWord !== timestampWord) {
        match = false;
        break;
      }
    }
    
    if (match) {
      startIdx = i;
      break;
    }
  }
  
  if (startIdx === -1) return [];
  
  return allTimestamps.slice(startIdx, startIdx + lineWords.length);
}
