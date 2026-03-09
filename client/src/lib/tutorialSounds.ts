/**
 * Tutorial Sound Effects Utility
 * Provides subtle audio feedback for tutorial interactions
 */

class TutorialSoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('tutorialSoundsEnabled') !== 'false';
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a subtle "pop" sound when cursor appears
   */
  playPopSound() {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Create a pleasant "pop" sound
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

      // Envelope for quick pop
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.warn('Failed to play pop sound:', error);
    }
  }

  /**
   * Play a subtle "click" sound for interactions
   */
  playClickSound() {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Create a subtle click sound
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

      // Very short envelope for click
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (error) {
      console.warn('Failed to play click sound:', error);
    }
  }

  /**
   * Play a celebration sound for tutorial completion
   */
  playCelebrationSound() {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      
      // Play a series of ascending notes for celebration
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const duration = 0.15;

      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * duration);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + index * duration);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * duration + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * duration + duration);

        oscillator.start(ctx.currentTime + index * duration);
        oscillator.stop(ctx.currentTime + index * duration + duration);
      });
    } catch (error) {
      console.warn('Failed to play celebration sound:', error);
    }
  }

  /**
   * Enable or disable tutorial sounds
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutorialSoundsEnabled', enabled.toString());
    }
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const tutorialSounds = new TutorialSoundManager();
