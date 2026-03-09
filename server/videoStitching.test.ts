/**
 * Tests for video stitching functionality
 */

import { describe, it, expect } from 'vitest';
import { splitStoryIntoScenes, generateScenePrompt } from './videoStitching';

describe('Video Stitching Module', () => {
  describe('splitStoryIntoScenes', () => {
    it('should split a story into correct number of scenes for 30s video', () => {
      const storyText = `Once upon a time, there was a young girl named Maria. She loved to explore the forest near her home. One day, she discovered a hidden path. The path led to a beautiful waterfall. Maria was amazed by its beauty. She decided to visit it every day. The waterfall became her special place.`;
      
      const scenes = splitStoryIntoScenes(storyText, 30, 5);
      
      // 30 seconds / 5 seconds per clip = 6 clips
      expect(scenes.length).toBe(6);
      
      // Each scene should have content
      scenes.forEach(scene => {
        expect(scene.length).toBeGreaterThan(0);
        expect(scene.trim()).not.toBe('');
      });
    });

    it('should split a story into correct number of scenes for 60s video', () => {
      const storyText = `The sun rose over the mountains. Birds began to sing their morning songs. A young boy woke up early. He had an important mission today. His grandmother needed medicine from the village. The journey would take several hours. He packed his bag carefully. Water, food, and a map were essential. The path through the forest was dangerous. But he was brave and determined. He set off with confidence. The adventure had begun.`;
      
      const scenes = splitStoryIntoScenes(storyText, 60, 5);
      
      // 60 seconds / 5 seconds per clip = 12 clips
      expect(scenes.length).toBe(12);
    });

    it('should split a story into correct number of scenes for 90s video', () => {
      const storyText = `In a small village by the sea, there lived a fisherman. Every morning, he would go out to catch fish. One day, he caught something unusual. It was a golden fish that could speak. The fish begged for its freedom. The fisherman was kind and let it go. The fish promised to grant him three wishes. The fisherman thought carefully. He wished for health, happiness, and wisdom. The fish granted all three wishes. The fisherman lived a long and fulfilling life. He never forgot the magical encounter. His story was passed down through generations. People still tell it today.`;
      
      const scenes = splitStoryIntoScenes(storyText, 90, 5);
      
      // 90 seconds / 5 seconds per clip = 18 clips
      expect(scenes.length).toBe(18);
    });

    it('should handle short stories gracefully', () => {
      const storyText = `A short story. Just two sentences.`;
      
      const scenes = splitStoryIntoScenes(storyText, 30, 5);
      
      // Should still create scenes even with limited content
      expect(scenes.length).toBeGreaterThan(0);
      expect(scenes.length).toBeLessThanOrEqual(6);
    });

    it('should throw error for empty story text', () => {
      expect(() => {
        splitStoryIntoScenes('', 30, 5);
      }).toThrow('Story text is empty or invalid');
    });

    it('should distribute sentences evenly across scenes', () => {
      const storyText = `Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.`;
      
      const scenes = splitStoryIntoScenes(storyText, 30, 5); // 6 clips
      
      // With 6 sentences and 6 clips, each scene should have approximately 1 sentence
      scenes.forEach(scene => {
        const sentenceCount = scene.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        expect(sentenceCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('generateScenePrompt', () => {
    it('should generate a prompt with cinematic style', () => {
      const sceneText = 'A young girl walks through a magical forest.';
      const cinematicStyle = 'Dreamy Fantasy';
      const sceneIndex = 0;
      
      const prompt = generateScenePrompt(sceneText, cinematicStyle, sceneIndex);
      
      expect(prompt).toContain('Dreamy Fantasy');
      expect(prompt).toContain('scene');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include scene text in prompt', () => {
      const sceneText = 'The hero discovers a hidden treasure in an ancient temple.';
      const cinematicStyle = 'Epic Adventure';
      const sceneIndex = 2;
      
      const prompt = generateScenePrompt(sceneText, cinematicStyle, sceneIndex);
      
      expect(prompt).toContain(sceneText.substring(0, 50));
    });

    it('should truncate long scene text to 200 characters', () => {
      const longSceneText = 'A'.repeat(300);
      const cinematicStyle = 'Modern Drama';
      const sceneIndex = 1;
      
      const prompt = generateScenePrompt(longSceneText, cinematicStyle, sceneIndex);
      
      // Prompt should not contain the full 300 characters
      expect(prompt.length).toBeLessThan(300);
    });

    it('should work with different cinematic styles', () => {
      const sceneText = 'Two friends have a conversation in a cafe.';
      const styles = ['Noir Detective', 'Romantic Comedy', 'Sci-Fi Thriller', 'Documentary'];
      
      styles.forEach(style => {
        const prompt = generateScenePrompt(sceneText, style, 0);
        expect(prompt).toContain(style);
      });
    });
  });

  describe('Scene distribution logic', () => {
    it('should create more scenes for longer target durations', () => {
      const storyText = 'A story. With multiple sentences. Each one is short. But together they form a narrative.';
      
      const scenes30s = splitStoryIntoScenes(storyText, 30, 5);
      const scenes60s = splitStoryIntoScenes(storyText, 60, 5);
      const scenes90s = splitStoryIntoScenes(storyText, 90, 5);
      
      expect(scenes60s.length).toBeGreaterThan(scenes30s.length);
      expect(scenes90s.length).toBeGreaterThan(scenes60s.length);
    });

    it('should handle stories with varying sentence lengths', () => {
      const storyText = `Short. A bit longer sentence here. This one is even longer with more words and details. Back to short. Medium length sentence. Another short one.`;
      
      const scenes = splitStoryIntoScenes(storyText, 30, 5);
      
      // Should successfully split without errors
      expect(scenes.length).toBeGreaterThan(0);
      
      // All scenes should have content
      scenes.forEach(scene => {
        expect(scene.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
