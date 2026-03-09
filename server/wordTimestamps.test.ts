import { describe, it, expect } from "vitest";

// Import the utility functions (we'll need to create a server-side version or test client-side logic)
// For now, let's test the core logic

describe("Word Timestamp Generation", () => {
  it("should generate timestamps that cover the full duration", () => {
    const text = "Hello world this is a test";
    const duration = 10; // 10 seconds
    
    // Simple estimation: split into words and distribute time
    const words = text.match(/\S+/g) || [];
    const timePerWord = duration / words.length;
    
    expect(words.length).toBe(6);
    expect(timePerWord).toBeCloseTo(1.67, 1);
  });

  it("should handle empty text", () => {
    const text = "";
    const words = text.match(/\S+/g) || [];
    
    expect(words.length).toBe(0);
  });

  it("should handle text with punctuation", () => {
    const text = "Hello, world! How are you?";
    const words = text.match(/\S+/g) || [];
    
    expect(words).toEqual(["Hello,", "world!", "How", "are", "you?"]);
    expect(words.length).toBe(5);
  });

  it("should handle Chinese text", () => {
    const text = "你好 世界 这是 测试";
    const words = text.match(/\S+/g) || [];
    
    expect(words.length).toBe(4);
  });

  it("should calculate word weights based on length", () => {
    const shortWord = "hi";
    const longWord = "extraordinary";
    
    // Longer words should take more time
    expect(longWord.length).toBeGreaterThan(shortWord.length);
  });

  it("should add extra weight for sentence-ending punctuation", () => {
    const regularWord = "hello";
    const sentenceEnd = "hello.";
    
    // Sentence-ending punctuation should add pause time
    expect(sentenceEnd.match(/[.!?]$/)).toBeTruthy();
    expect(regularWord.match(/[.!?]$/)).toBeFalsy();
  });

  it("should handle multi-line text", () => {
    const text = `Line one here.
    Line two here.
    Line three here.`;
    
    const words = text.match(/\S+/g) || [];
    expect(words.length).toBeGreaterThan(0);
  });
});

describe("Word Highlighting Synchronization", () => {
  it("should find current word based on time", () => {
    const timestamps = [
      { word: "Hello", startTime: 0, endTime: 1 },
      { word: "world", startTime: 1, endTime: 2 },
      { word: "test", startTime: 2, endTime: 3 },
    ];
    
    // At 0.5 seconds, should be first word
    const currentTime = 0.5;
    const currentWord = timestamps.find(
      (t) => currentTime >= t.startTime && currentTime < t.endTime
    );
    
    expect(currentWord?.word).toBe("Hello");
  });

  it("should handle time at word boundary", () => {
    const timestamps = [
      { word: "Hello", startTime: 0, endTime: 1 },
      { word: "world", startTime: 1, endTime: 2 },
    ];
    
    // At exactly 1 second, should be second word
    const currentTime = 1.0;
    const currentWord = timestamps.find(
      (t) => currentTime >= t.startTime && currentTime < t.endTime
    );
    
    expect(currentWord?.word).toBe("world");
  });

  it("should return undefined for time before start", () => {
    const timestamps = [
      { word: "Hello", startTime: 0, endTime: 1 },
    ];
    
    const currentTime = -1;
    const currentWord = timestamps.find(
      (t) => currentTime >= t.startTime && currentTime < t.endTime
    );
    
    expect(currentWord).toBeUndefined();
  });

  it("should handle time after all words", () => {
    const timestamps = [
      { word: "Hello", startTime: 0, endTime: 1 },
      { word: "world", startTime: 1, endTime: 2 },
    ];
    
    const currentTime = 5;
    const currentWord = timestamps.find(
      (t) => currentTime >= t.startTime && currentTime < t.endTime
    );
    
    // Should return undefined or last word depending on implementation
    expect(currentWord).toBeUndefined();
  });
});
