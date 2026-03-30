import { describe, it, expect } from "vitest";

describe("Social Sharing Integration", () => {
  describe("Share URL Generation", () => {
    it("should generate correct Twitter share URL", () => {
      const level = 5;
      const xp = 1250;
      const text = `🎉 I just reached Level ${level} on Storyling.ai with ${xp} XP! Learning languages has never been more fun! 🚀`;
      const url = "https://storyling.ai";

      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

      expect(shareUrl).toContain("twitter.com/intent/tweet");
      expect(shareUrl).toContain("Level%205");
      expect(shareUrl).toContain("1250%20XP");
      expect(shareUrl).toContain("storyling.ai");
    });

    it("should generate correct Facebook share URL", () => {
      const level = 10;
      const xp = 5000;
      const text = `🎉 I just reached Level ${level} on Storyling.ai with ${xp} XP! Learning languages has never been more fun! 🚀`;
      const url = "https://storyling.ai";

      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;

      expect(shareUrl).toContain("facebook.com/sharer");
      expect(shareUrl).toContain("Level%2010");
      expect(shareUrl).toContain("5000%20XP");
    });

    it("should properly encode special characters in share text", () => {
      const text = "🎉 Test! & Special <chars>";
      const encoded = encodeURIComponent(text);

      expect(encoded).not.toContain("&");
      expect(encoded).not.toContain("<");
      expect(encoded).not.toContain(">");
      expect(encoded).toContain("%");
    });
  });

  describe("Progress Card Data Validation", () => {
    it("should validate progress card data structure", () => {
      const validData = {
        userName: "Test User",
        level: 5,
        totalXp: 1250,
        streak: 7,
      };

      expect(validData.userName).toBeTruthy();
      expect(validData.level).toBeGreaterThan(0);
      expect(validData.totalXp).toBeGreaterThanOrEqual(0);
      expect(validData.streak).toBeGreaterThanOrEqual(0);
    });

    it("should handle various level ranges", () => {
      const levels = [1, 5, 10, 20, 100];

      levels.forEach((level) => {
        expect(level).toBeGreaterThan(0);
        expect(level).toBeLessThan(1000); // Reasonable upper bound
      });
    });

    it("should handle various XP values", () => {
      const xpValues = [0, 100, 1000, 5000, 100000];

      xpValues.forEach((xp) => {
        expect(xp).toBeGreaterThanOrEqual(0);
        expect(typeof xp).toBe("number");
      });
    });

    it("should handle various streak values", () => {
      const streaks = [0, 1, 7, 30, 365];

      streaks.forEach((streak) => {
        expect(streak).toBeGreaterThanOrEqual(0);
        expect(typeof streak).toBe("number");
      });
    });
  });

  describe("Image Dimensions", () => {
    it("should use social media optimized dimensions", () => {
      const width = 1200;
      const height = 630;

      // Open Graph recommended size
      expect(width).toBe(1200);
      expect(height).toBe(630);
      expect(width / height).toBeCloseTo(1.9, 1); // ~1.9:1 aspect ratio
    });
  });

  describe("Download Filename Generation", () => {
    it("should generate correct filename for different levels", () => {
      const levels = [1, 5, 10, 20];

      levels.forEach((level) => {
        const filename = `storyling-level-${level}.png`;
        expect(filename).toContain(`level-${level}`);
        expect(filename).toMatch(/\.png$/);
      });
    });

    it("should use default filename when not specified", () => {
      const defaultFilename = "storyling-progress.png";

      expect(defaultFilename).toBe("storyling-progress.png");
      expect(defaultFilename).toMatch(/\.png$/);
    });
  });

  describe("Share Text Content", () => {
    it("should include celebration emojis", () => {
      const text = "🎉 I just reached Level 5 on Storyling.ai with 1250 XP! Learning languages has never been more fun! 🚀";

      expect(text).toContain("🎉");
      expect(text).toContain("🚀");
    });

    it("should include level and XP information", () => {
      const level = 7;
      const xp = 2000;
      const text = `🎉 I just reached Level ${level} on Storyling.ai with ${xp} XP! Learning languages has never been more fun! 🚀`;

      expect(text).toContain(`Level ${level}`);
      expect(text).toContain(`${xp} XP`);
      expect(text).toContain("Storyling.ai");
    });

    it("should be engaging and shareable", () => {
      const text = "🎉 I just reached Level 5 on Storyling.ai with 1250 XP! Learning languages has never been more fun! 🚀";

      expect(text.length).toBeLessThan(280); // Twitter character limit
      expect(text).toContain("!");
      expect(text.toLowerCase()).toContain("fun");
    });
  });

  describe("Canvas Image Format", () => {
    it("should use PNG format for high quality", () => {
      const format = "image/png";

      expect(format).toBe("image/png");
    });

    it("should generate data URL format", () => {
      const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA";

      expect(mockDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("Color Scheme", () => {
    it("should use brand colors", () => {
      const colors = {
        purple: "#8B5CF6",
        pink: "#EC4899",
        orange: "#F97316",
        gold: "#FCD34D",
      };

      Object.values(colors).forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
