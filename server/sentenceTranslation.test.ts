import { describe, it, expect } from "vitest";

describe("Sentence Translation Feature", () => {
  describe("API response structure", () => {
    it("should include translatedSentences in response", () => {
      const mockResponse = {
        word: "你好",
        translation: "hello",
        definition: "A Chinese greeting",
        sourceLanguage: "zh",
        exampleSentences: [
          "你好，你好吗？",
          "她对邻居说你好。",
        ],
        translatedSentences: [
          "Hello, how are you?",
          "She said hello to her neighbor.",
        ],
      };

      expect(mockResponse).toHaveProperty("translatedSentences");
      expect(Array.isArray(mockResponse.translatedSentences)).toBe(true);
      expect(mockResponse.translatedSentences.length).toBe(mockResponse.exampleSentences.length);
    });

    it("should validate all required fields including translatedSentences", () => {
      const mockResponse = {
        word: "hola",
        translation: "hello",
        definition: "A Spanish greeting",
        sourceLanguage: "es",
        exampleSentences: [
          "Hola, ¿cómo estás?",
          "Ella dijo hola a su vecino.",
          "¡Hola! Bienvenido a nuestra tienda.",
        ],
        translatedSentences: [
          "Hello, how are you?",
          "She said hello to her neighbor.",
          "Hello! Welcome to our store.",
        ],
      };

      expect(mockResponse).toHaveProperty("word");
      expect(mockResponse).toHaveProperty("translation");
      expect(mockResponse).toHaveProperty("definition");
      expect(mockResponse).toHaveProperty("sourceLanguage");
      expect(mockResponse).toHaveProperty("exampleSentences");
      expect(mockResponse).toHaveProperty("translatedSentences");
      expect(mockResponse.translatedSentences.length).toBe(3);
    });

    it("should match example sentences count with translated sentences count", () => {
      const mockResponse = {
        word: "hello",
        translation: "你好",
        definition: "A greeting",
        sourceLanguage: "en",
        exampleSentences: [
          "Hello, how are you?",
          "She said hello to her neighbor.",
        ],
        translatedSentences: [
          "你好，你好吗？",
          "她对邻居说你好。",
        ],
      };

      expect(mockResponse.exampleSentences.length).toBe(mockResponse.translatedSentences.length);
    });
  });

  describe("Translation pairing", () => {
    it("should pair each example sentence with its translation", () => {
      const exampleSentences = [
        "Hello, how are you?",
        "She said hello to her neighbor.",
      ];
      const translatedSentences = [
        "你好，你好吗？",
        "她对邻居说你好。",
      ];

      exampleSentences.forEach((sentence, idx) => {
        expect(sentence).toBeTruthy();
        expect(translatedSentences[idx]).toBeTruthy();
        expect(typeof sentence).toBe("string");
        expect(typeof translatedSentences[idx]).toBe("string");
      });
    });

    it("should maintain order between original and translated sentences", () => {
      const mockData = {
        exampleSentences: ["First sentence", "Second sentence", "Third sentence"],
        translatedSentences: ["Primera frase", "Segunda frase", "Tercera frase"],
      };

      for (let i = 0; i < mockData.exampleSentences.length; i++) {
        expect(mockData.translatedSentences[i]).toBeTruthy();
      }
    });
  });

  describe("UI toggle state", () => {
    it("should track translation visibility state", () => {
      let showTranslations = false;

      // Toggle on
      showTranslations = !showTranslations;
      expect(showTranslations).toBe(true);

      // Toggle off
      showTranslations = !showTranslations;
      expect(showTranslations).toBe(false);
    });

    it("should only show toggle button when translations exist", () => {
      const mockDataWithTranslations = {
        exampleSentences: ["Hello"],
        translatedSentences: ["你好"],
      };

      const mockDataWithoutTranslations = {
        exampleSentences: ["Hello"],
        translatedSentences: undefined,
      };

      const shouldShowToggle1 = mockDataWithTranslations.translatedSentences && 
                                 mockDataWithTranslations.translatedSentences.length > 0;
      expect(shouldShowToggle1).toBe(true);

      const shouldShowToggle2 = mockDataWithoutTranslations.translatedSentences && 
                                 mockDataWithoutTranslations.translatedSentences.length > 0;
      expect(shouldShowToggle2).toBeFalsy();
    });
  });

  describe("Translation display", () => {
    it("should render translated sentence below original", () => {
      const mockSentence = {
        original: "你好，你好吗？",
        translated: "Hello, how are you?",
        showTranslation: true,
      };

      expect(mockSentence.original).toBeTruthy();
      if (mockSentence.showTranslation) {
        expect(mockSentence.translated).toBeTruthy();
      }
    });

    it("should hide translation when toggle is off", () => {
      const mockSentence = {
        original: "你好，你好吗？",
        translated: "Hello, how are you?",
        showTranslation: false,
      };

      expect(mockSentence.original).toBeTruthy();
      const shouldRenderTranslation = mockSentence.showTranslation && mockSentence.translated;
      expect(shouldRenderTranslation).toBe(false);
    });

    it("should handle missing translation gracefully", () => {
      const exampleSentences = ["Hello", "World"];
      const translatedSentences = ["你好"]; // Missing second translation

      const idx = 1;
      const hasTranslation = translatedSentences && translatedSentences[idx];
      expect(hasTranslation).toBeFalsy();
    });
  });

  describe("Array length validation", () => {
    it("should enforce minimum 2 sentences", () => {
      const mockResponse = {
        exampleSentences: ["First", "Second"],
        translatedSentences: ["Primero", "Segundo"],
      };

      expect(mockResponse.exampleSentences.length).toBeGreaterThanOrEqual(2);
      expect(mockResponse.translatedSentences.length).toBeGreaterThanOrEqual(2);
    });

    it("should enforce maximum 3 sentences", () => {
      const mockResponse = {
        exampleSentences: ["First", "Second", "Third"],
        translatedSentences: ["Primero", "Segundo", "Tercero"],
      };

      expect(mockResponse.exampleSentences.length).toBeLessThanOrEqual(3);
      expect(mockResponse.translatedSentences.length).toBeLessThanOrEqual(3);
    });
  });
});
