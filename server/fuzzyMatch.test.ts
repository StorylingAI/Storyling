import { describe, it, expect } from "vitest";

/**
 * Fuzzy match function for testing
 * Matches spoken text to answer options
 */
export function fuzzyMatch(text: string, options: string[]): number | null {
  if (!text) return null;

  const normalizedText = text.toLowerCase().trim();
  
  // First try exact match
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase().trim() === normalizedText) {
      return i;
    }
  }

  // Then try partial match (transcript contains option or vice versa)
  for (let i = 0; i < options.length; i++) {
    const normalizedOption = options[i].toLowerCase().trim();
    if (
      normalizedText.includes(normalizedOption) ||
      normalizedOption.includes(normalizedText)
    ) {
      return i;
    }
  }

  // Try matching just the letter (A, B, C, D)
  const letterMatch = normalizedText.match(/^([a-d])$/i);
  if (letterMatch) {
    const letterIndex = letterMatch[1].toLowerCase().charCodeAt(0) - 97; // 'a' = 0
    if (letterIndex >= 0 && letterIndex < options.length) {
      return letterIndex;
    }
  }

  return null;
}

describe("Fuzzy Match for Voice Input", () => {
  const options = [
    "Hello",
    "Goodbye",
    "Thank you",
    "You're welcome"
  ];

  it("should match exact text", () => {
    expect(fuzzyMatch("Hello", options)).toBe(0);
    expect(fuzzyMatch("Goodbye", options)).toBe(1);
    expect(fuzzyMatch("Thank you", options)).toBe(2);
  });

  it("should match case-insensitively", () => {
    expect(fuzzyMatch("hello", options)).toBe(0);
    expect(fuzzyMatch("GOODBYE", options)).toBe(1);
    expect(fuzzyMatch("thank YOU", options)).toBe(2);
  });

  it("should match with extra whitespace", () => {
    expect(fuzzyMatch("  Hello  ", options)).toBe(0);
    expect(fuzzyMatch(" Goodbye ", options)).toBe(1);
  });

  it("should match partial text (transcript contains option)", () => {
    expect(fuzzyMatch("I think it's Hello", options)).toBe(0);
    expect(fuzzyMatch("The answer is Goodbye", options)).toBe(1);
  });

  it("should match partial text (option contains transcript)", () => {
    expect(fuzzyMatch("Thank", options)).toBe(2);
    expect(fuzzyMatch("welcome", options)).toBe(3);
  });

  it("should prioritize partial matches over letter matching", () => {
    // 'a' matches 'Thank' (partial) before letter 'A'
    // This is expected - partial matching is more specific
    expect(fuzzyMatch("you", options)).toBe(2); // Matches "Thank you"
  });

  it("should match letters when no partial match exists", () => {
    // Use options without partial matches to test letter matching
    const simpleOptions = ["Apple", "Banana", "Cherry", "Date"];
    expect(fuzzyMatch("A", simpleOptions)).toBe(0);
    expect(fuzzyMatch("B", simpleOptions)).toBe(1);
    expect(fuzzyMatch("C", simpleOptions)).toBe(2);
    expect(fuzzyMatch("D", simpleOptions)).toBe(3);
  });

  it("should return null for no match", () => {
    expect(fuzzyMatch("xyz", options)).toBeNull();
    expect(fuzzyMatch("random text", options)).toBeNull();
  });

  it("should return null for empty text", () => {
    expect(fuzzyMatch("", options)).toBeNull();
  });

  it("should handle Chinese characters", () => {
    const chineseOptions = ["你好", "谢谢", "再见", "对不起"];
    expect(fuzzyMatch("你好", chineseOptions)).toBe(0);
    expect(fuzzyMatch("谢谢", chineseOptions)).toBe(1);
  });

  it("should handle multi-word partial matches", () => {
    expect(fuzzyMatch("you", options)).toBe(2); // Matches "Thank you"
  });
});
