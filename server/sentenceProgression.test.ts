import { describe, it, expect } from "vitest";

describe("Sentence Progression Fix", () => {
  describe("Sentence boundary detection", () => {
    it("should detect sentence within start and end time", () => {
      const currentTime = 5.5;
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
        { sentence: "Third sentence.", startTime: 6, endTime: 9 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(1); // Should be in second sentence
    });

    it("should detect first sentence at time 0", () => {
      const currentTime = 0;
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(0);
    });

    it("should transition to next sentence at exact boundary", () => {
      const currentTime = 3.0;
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(1); // Should advance to second sentence
    });

    it("should handle last sentence correctly", () => {
      const currentTime = 8.5;
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
        { sentence: "Third sentence.", startTime: 6, endTime: 9 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(2); // Should be in last sentence
    });

    it("should stay on last sentence beyond endTime", () => {
      const currentTime = 10.0; // Beyond last sentence endTime
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
        { sentence: "Third sentence.", startTime: 6, endTime: 9 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(2); // Should still be in last sentence
    });
  });

  describe("Edge cases", () => {
    it("should handle single sentence story", () => {
      const currentTime = 5.0;
      const sentenceTimestamps = [
        { sentence: "Only sentence.", startTime: 0, endTime: 10 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(0);
    });

    it("should return -1 when time is before first sentence", () => {
      const currentTime = -1.0;
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
      ];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(-1);
    });

    it("should handle empty sentence array", () => {
      const currentTime = 5.0;
      const sentenceTimestamps: Array<{ sentence: string; startTime: number; endTime: number }> = [];

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(-1);
    });
  });

  describe("Multi-sentence progression", () => {
    it("should progress through all 32 sentences", () => {
      // Simulate 32 sentences with 5-second duration each
      const sentenceTimestamps = Array.from({ length: 32 }, (_, i) => ({
        sentence: `Sentence ${i + 1}.`,
        startTime: i * 5,
        endTime: (i + 1) * 5,
      }));

      // Test progression at various time points
      const testTimes = [0, 7.5, 15, 22.5, 30, 75, 100, 150, 159];
      const expectedIndexes = [0, 1, 3, 4, 6, 15, 20, 30, 31];

      testTimes.forEach((currentTime, idx) => {
        let newIndex = -1;
        for (let i = 0; i < sentenceTimestamps.length; i++) {
          const st = sentenceTimestamps[i];
          const isLastSentence = i === sentenceTimestamps.length - 1;

          if (isLastSentence) {
            if (currentTime >= st.startTime) {
              newIndex = i;
              break;
            }
          } else {
            if (currentTime >= st.startTime && currentTime < st.endTime) {
              newIndex = i;
              break;
            }
          }
        }

        expect(newIndex).toBe(expectedIndexes[idx]);
      });
    });

    it("should handle rapid time updates", () => {
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 3 },
        { sentence: "Second sentence.", startTime: 3, endTime: 6 },
        { sentence: "Third sentence.", startTime: 6, endTime: 9 },
      ];

      // Simulate rapid time updates (100ms intervals)
      const times = [2.9, 3.0, 3.1, 5.9, 6.0, 6.1];
      const expectedIndexes = [0, 1, 1, 1, 2, 2];

      times.forEach((currentTime, idx) => {
        let newIndex = -1;
        for (let i = 0; i < sentenceTimestamps.length; i++) {
          const st = sentenceTimestamps[i];
          const isLastSentence = i === sentenceTimestamps.length - 1;

          if (isLastSentence) {
            if (currentTime >= st.startTime) {
              newIndex = i;
              break;
            }
          } else {
            if (currentTime >= st.startTime && currentTime < st.endTime) {
              newIndex = i;
              break;
            }
          }
        }

        expect(newIndex).toBe(expectedIndexes[idx]);
      });
    });
  });

  describe("Playback speed variations", () => {
    it("should work correctly at 0.75x speed", () => {
      // At 0.75x speed, timestamps are stretched by 1/0.75 = 1.33x
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 4 },
        { sentence: "Second sentence.", startTime: 4, endTime: 8 },
        { sentence: "Third sentence.", startTime: 8, endTime: 12 },
      ];

      const currentTime = 6.0;

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(1); // Should be in second sentence
    });

    it("should work correctly at 1.5x speed", () => {
      // At 1.5x speed, timestamps are compressed by 1/1.5 = 0.67x
      const sentenceTimestamps = [
        { sentence: "First sentence.", startTime: 0, endTime: 2 },
        { sentence: "Second sentence.", startTime: 2, endTime: 4 },
        { sentence: "Third sentence.", startTime: 4, endTime: 6 },
      ];

      const currentTime = 3.0;

      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;

        if (isLastSentence) {
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }

      expect(newIndex).toBe(1); // Should be in second sentence
    });
  });

  describe("State management", () => {
    it("should only update index when it changes", () => {
      const currentSentenceIndex = 1;
      const newIndex = 1;
      const shouldUpdate = newIndex !== -1 && newIndex !== currentSentenceIndex;

      expect(shouldUpdate).toBe(false);
    });

    it("should update index when it changes", () => {
      const currentSentenceIndex = 0;
      const newIndex = 1;
      const shouldUpdate = newIndex !== -1 && newIndex !== currentSentenceIndex;

      expect(shouldUpdate).toBe(true);
    });

    it("should not update when newIndex is -1", () => {
      const currentSentenceIndex = 0;
      const newIndex = -1;
      const shouldUpdate = newIndex !== -1 && newIndex !== currentSentenceIndex;

      expect(shouldUpdate).toBe(false);
    });
  });
});
