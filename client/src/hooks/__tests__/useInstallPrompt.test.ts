// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt } from '../useInstallPrompt';

const STORAGE_KEY = 'pwa-install-dismissed';

describe('useInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock non-standalone display mode
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList);
  });

  it('starts with canInstall false (no browser event yet)', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('sets canInstall true when beforeinstallprompt fires', () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = vi.fn().mockResolvedValue(undefined);
      (event as any).userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('dismissInstall increments count in localStorage', () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      result.current.dismissInstall();
    });

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(state.count).toBe(1);
    expect(result.current.canInstall).toBe(false);
  });

  it('does not show after dismissed twice', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ count: 2, timestamp: Date.now() })
    );

    const { result } = renderHook(() => useInstallPrompt());

    // Even if event fires, shouldShowPrompt() returns false
    act(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(false);
  });

  it('does not show when already in standalone mode', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true, // standalone
    } as MediaQueryList);

    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(false);
  });

  it('shows again after 7 days if dismissed once', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ count: 1, timestamp: eightDaysAgo })
    );

    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = vi.fn();
      (event as any).userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });
});
