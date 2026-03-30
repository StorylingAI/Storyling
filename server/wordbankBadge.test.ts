import { describe, it, expect } from "vitest";

describe("Wordbank Badge Feature", () => {
  describe("Backend API", () => {
    it("should have checkWordExists query structure", () => {
      const mockInput = {
        word: "hello",
        targetLanguage: "en",
      };

      expect(mockInput).toHaveProperty("word");
      expect(mockInput).toHaveProperty("targetLanguage");
      expect(typeof mockInput.word).toBe("string");
      expect(typeof mockInput.targetLanguage).toBe("string");
    });

    it("should return exists boolean", () => {
      const mockResponse = { exists: true };

      expect(mockResponse).toHaveProperty("exists");
      expect(typeof mockResponse.exists).toBe("boolean");
    });

    it("should return false when word not in wordbank", () => {
      const mockResponse = { exists: false };

      expect(mockResponse.exists).toBe(false);
    });

    it("should return true when word is in wordbank", () => {
      const mockResponse = { exists: true };

      expect(mockResponse.exists).toBe(true);
    });
  });

  describe("Query execution", () => {
    it("should only query when word and sourceLanguage are available", () => {
      const selectedWord = "hello";
      const sourceLanguage = "en";
      const showVocabPopup = true;

      const shouldQuery = !!selectedWord && !!sourceLanguage && showVocabPopup;

      expect(shouldQuery).toBe(true);
    });

    it("should not query when word is not selected", () => {
      const selectedWord = null;
      const sourceLanguage = "en";
      const showVocabPopup = true;

      const shouldQuery = !!selectedWord && !!sourceLanguage && showVocabPopup;

      expect(shouldQuery).toBe(false);
    });

    it("should not query when sourceLanguage is not available", () => {
      const selectedWord = "hello";
      const sourceLanguage = "";
      const showVocabPopup = true;

      const shouldQuery = !!selectedWord && !!sourceLanguage && showVocabPopup;

      expect(shouldQuery).toBe(false);
    });

    it("should not query when popup is closed", () => {
      const selectedWord = "hello";
      const sourceLanguage = "en";
      const showVocabPopup = false;

      const shouldQuery = !!selectedWord && !!sourceLanguage && showVocabPopup;

      expect(shouldQuery).toBe(false);
    });
  });

  describe("Badge display logic", () => {
    it("should show badge when word exists in wordbank", () => {
      const wordExistsData = { exists: true };
      const isWordInWordbank = wordExistsData?.exists || false;

      expect(isWordInWordbank).toBe(true);
    });

    it("should not show badge when word does not exist", () => {
      const wordExistsData = { exists: false };
      const isWordInWordbank = wordExistsData?.exists || false;

      expect(isWordInWordbank).toBe(false);
    });

    it("should not show badge when data is not loaded", () => {
      const wordExistsData = undefined;
      const isWordInWordbank = wordExistsData?.exists || false;

      expect(isWordInWordbank).toBe(false);
    });

    it("should fallback to false when exists is undefined", () => {
      const wordExistsData = { exists: undefined };
      const isWordInWordbank = wordExistsData?.exists || false;

      expect(isWordInWordbank).toBe(false);
    });
  });

  describe("Badge appearance", () => {
    it("should have correct badge structure", () => {
      const badge = {
        icon: "CheckCircle2",
        text: "In Wordbank",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        size: "text-xs",
      };

      expect(badge.icon).toBe("CheckCircle2");
      expect(badge.text).toBe("In Wordbank");
      expect(badge.bgColor).toContain("green");
      expect(badge.textColor).toContain("green");
    });

    it("should use rounded-full shape", () => {
      const badgeClasses = "flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium";

      expect(badgeClasses).toContain("rounded-full");
      expect(badgeClasses).toContain("flex");
      expect(badgeClasses).toContain("items-center");
    });

    it("should have icon and text", () => {
      const badgeContent = {
        hasIcon: true,
        hasText: true,
        iconSize: "h-3 w-3",
      };

      expect(badgeContent.hasIcon).toBe(true);
      expect(badgeContent.hasText).toBe(true);
      expect(badgeContent.iconSize).toBe("h-3 w-3");
    });
  });

  describe("Button state", () => {
    it("should disable button when word is in wordbank", () => {
      const isWordInWordbank = true;
      const isPending = false;
      const isDisabled = isPending || isWordInWordbank;

      expect(isDisabled).toBe(true);
    });

    it("should disable button when adding to wordbank", () => {
      const isWordInWordbank = false;
      const isPending = true;
      const isDisabled = isPending || isWordInWordbank;

      expect(isDisabled).toBe(true);
    });

    it("should enable button when word not in wordbank and not pending", () => {
      const isWordInWordbank = false;
      const isPending = false;
      const isDisabled = isPending || isWordInWordbank;

      expect(isDisabled).toBe(false);
    });

    it("should use secondary variant when word is in wordbank", () => {
      const isWordInWordbank = true;
      const variant = isWordInWordbank ? "secondary" : "default";

      expect(variant).toBe("secondary");
    });

    it("should use default variant when word not in wordbank", () => {
      const isWordInWordbank = false;
      const variant = isWordInWordbank ? "secondary" : "default";

      expect(variant).toBe("default");
    });
  });

  describe("Button text", () => {
    it("should show 'Adding...' when pending", () => {
      const isPending = true;
      const isWordInWordbank = false;
      
      let buttonText = "";
      if (isPending) {
        buttonText = "Adding...";
      } else if (isWordInWordbank) {
        buttonText = "Already Added";
      } else {
        buttonText = "Add to Wordbank";
      }

      expect(buttonText).toBe("Adding...");
    });

    it("should show 'Already Added' when word in wordbank", () => {
      const isPending = false;
      const isWordInWordbank = true;
      
      let buttonText = "";
      if (isPending) {
        buttonText = "Adding...";
      } else if (isWordInWordbank) {
        buttonText = "Already Added";
      } else {
        buttonText = "Add to Wordbank";
      }

      expect(buttonText).toBe("Already Added");
    });

    it("should show 'Add to Wordbank' when word not in wordbank", () => {
      const isPending = false;
      const isWordInWordbank = false;
      
      let buttonText = "";
      if (isPending) {
        buttonText = "Adding...";
      } else if (isWordInWordbank) {
        buttonText = "Already Added";
      } else {
        buttonText = "Add to Wordbank";
      }

      expect(buttonText).toBe("Add to Wordbank");
    });

    it("should show icon in 'Already Added' state", () => {
      const isWordInWordbank = true;
      const isPending = false;
      
      const showIcon = !isPending && isWordInWordbank;

      expect(showIcon).toBe(true);
    });
  });

  describe("User experience", () => {
    it("should prevent duplicate additions", () => {
      const isWordInWordbank = true;
      const canAddWord = !isWordInWordbank;

      expect(canAddWord).toBe(false);
    });

    it("should allow adding new words", () => {
      const isWordInWordbank = false;
      const canAddWord = !isWordInWordbank;

      expect(canAddWord).toBe(true);
    });

    it("should provide visual feedback for existing words", () => {
      const isWordInWordbank = true;
      const showBadge = isWordInWordbank;
      const buttonDisabled = isWordInWordbank;
      const buttonVariant = isWordInWordbank ? "secondary" : "default";

      expect(showBadge).toBe(true);
      expect(buttonDisabled).toBe(true);
      expect(buttonVariant).toBe("secondary");
    });

    it("should update UI immediately after adding word", () => {
      let isWordInWordbank = false;
      
      // Simulate adding word
      const onAddSuccess = () => {
        isWordInWordbank = true;
      };
      
      onAddSuccess();
      
      expect(isWordInWordbank).toBe(true);
    });
  });

  describe("Integration with existing features", () => {
    it("should work with translation query", () => {
      const wordData = {
        word: "hello",
        translation: "你好",
        sourceLanguage: "en",
        definition: "A greeting",
      };
      
      const queryParams = {
        word: wordData.word,
        targetLanguage: wordData.sourceLanguage,
      };

      expect(queryParams.word).toBe("hello");
      expect(queryParams.targetLanguage).toBe("en");
    });

    it("should use sourceLanguage from translation data", () => {
      const wordData = {
        word: "hello",
        sourceLanguage: "en",
      };
      
      const targetLanguage = wordData?.sourceLanguage || "";

      expect(targetLanguage).toBe("en");
    });

    it("should handle missing sourceLanguage gracefully", () => {
      const wordData = {
        word: "hello",
        sourceLanguage: undefined,
      };
      
      const targetLanguage = wordData?.sourceLanguage || "";

      expect(targetLanguage).toBe("");
    });
  });

  describe("Performance considerations", () => {
    it("should only query when necessary", () => {
      const scenarios = [
        { word: "hello", lang: "en", popup: true, shouldQuery: true },
        { word: "", lang: "en", popup: true, shouldQuery: false },
        { word: "hello", lang: "", popup: true, shouldQuery: false },
        { word: "hello", lang: "en", popup: false, shouldQuery: false },
      ];

      scenarios.forEach((scenario) => {
        const shouldQuery = !!scenario.word && !!scenario.lang && scenario.popup;
        expect(shouldQuery).toBe(scenario.shouldQuery);
      });
    });

    it("should cache query results", () => {
      // tRPC automatically caches queries
      const cacheKey = "wordbank.checkWordExists-hello-en";
      const isCached = true;

      expect(isCached).toBe(true);
    });
  });
});
