import { useEffect } from 'react';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
}

export function Confetti({ trigger, duration = 3000, particleCount = 50 }: ConfettiProps) {
  useEffect(() => {
    if (!trigger) return;

    const colors = [
      'var(--color-coral)',
      'var(--color-peach)',
      'var(--color-lavender)',
      'var(--color-sunshine)',
      'var(--color-pink)',
      'var(--color-teal)',
    ];

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${2 + Math.random() * 2}s`;
      
      document.body.appendChild(particle);
      particles.push(particle);
    }

    const cleanup = setTimeout(() => {
      particles.forEach(particle => particle.remove());
    }, duration);

    return () => {
      clearTimeout(cleanup);
      particles.forEach(particle => particle.remove());
    };
  }, [trigger, duration, particleCount]);

  return null;
}

// Hook for easy confetti triggering
export function useConfetti() {
  const celebrate = (particleCount = 50) => {
    const colors = [
      'var(--color-coral)',
      'var(--color-peach)',
      'var(--color-lavender)',
      'var(--color-sunshine)',
      'var(--color-pink)',
      'var(--color-teal)',
    ];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${2 + Math.random() * 2}s`;
      
      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 3000);
    }
  };

  return { celebrate };
}
