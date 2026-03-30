/**
 * Generate a shareable progress card image using HTML5 Canvas
 * Returns a data URL that can be downloaded or shared
 */

interface ProgressCardData {
  userName: string;
  level: number;
  totalXp: number;
  streak: number;
}

export async function generateProgressCard(data: ProgressCardData): Promise<string> {
  const { userName, level, totalXp, streak } = data;

  // Create canvas with social media optimized dimensions (1200x630)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = 1200;
  canvas.height = 630;

  // Background gradient (purple → pink → orange)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#8B5CF6'); // Purple
  gradient.addColorStop(0.5, '#EC4899'); // Pink
  gradient.addColorStop(1, '#F97316'); // Orange
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle pattern overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * 60, j * 60, 30, 30);
      }
    }
  }

  // Draw decorative circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(100, 100, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1100, 530, 200, 0, Math.PI * 2);
  ctx.fill();

  // Main content container (centered card)
  const cardX = 100;
  const cardY = 80;
  const cardWidth = 1000;
  const cardHeight = 470;

  // Card background with glass effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Card border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px "Fredoka One", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 Level Up! 🎉', canvas.width / 2, 180);

  // Level badge (large golden circle)
  const badgeX = canvas.width / 2;
  const badgeY = 330;
  const badgeRadius = 100;

  // Badge glow
  const badgeGlow = ctx.createRadialGradient(badgeX, badgeY, 0, badgeX, badgeY, badgeRadius + 30);
  badgeGlow.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
  badgeGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = badgeGlow;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius + 30, 0, Math.PI * 2);
  ctx.fill();

  // Badge gradient
  const badgeGradient = ctx.createLinearGradient(badgeX - badgeRadius, badgeY - badgeRadius, badgeX + badgeRadius, badgeY + badgeRadius);
  badgeGradient.addColorStop(0, '#FCD34D');
  badgeGradient.addColorStop(0.5, '#F59E0B');
  badgeGradient.addColorStop(1, '#DC2626');
  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Badge border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Level number
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80px "Fredoka One", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(`${level}`, badgeX, badgeY);
  ctx.shadowBlur = 0;

  // Stats row
  const statsY = 480;
  ctx.font = 'bold 32px "Nunito", sans-serif';
  ctx.fillStyle = '#FFFFFF';

  // XP stat
  ctx.textAlign = 'center';
  ctx.fillText(`⭐ ${totalXp} XP`, canvas.width / 2 - 200, statsY);

  // Streak stat
  ctx.fillText(`🔥 ${streak} Day Streak`, canvas.width / 2 + 200, statsY);

  // User name
  ctx.font = 'bold 36px "Nunito", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText(userName, canvas.width / 2, 540);

  // Branding footer
  ctx.font = 'bold 28px "Nunito", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';
  ctx.fillText('Storyling.ai - Learn Languages Like You Live Them', canvas.width / 2, 600);

  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Helper function to draw rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Download the generated image
 */
export function downloadProgressCard(dataUrl: string, fileName: string = 'storyling-progress.png') {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

/**
 * Share to social media
 */
export function shareToSocial(platform: 'twitter' | 'facebook', level: number, xp: number) {
  const text = `🎉 I just reached Level ${level} on Storyling.ai with ${xp} XP! Learning languages has never been more fun! 🚀`;
  const url = 'https://storyling.ai';

  let shareUrl = '';
  if (platform === 'twitter') {
    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  } else if (platform === 'facebook') {
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  }

  window.open(shareUrl, '_blank', 'width=600,height=400');
}
