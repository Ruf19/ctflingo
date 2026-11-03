import { useEffect, useRef } from 'react';

export function HackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Hacker characters: Katakana + Latin + Numbers + CTF symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`nmapgobustersqlmapflag{CTF}rootadminsudo'.split('');
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    
    // Array to track the Y coordinate of each column's drop
    let drops: number[] = Array(columns).fill(1);
    // Randomize initial starting points so they don't all fall at once
    drops = drops.map(() => Math.random() * -100);

    const draw = () => {
      // Translucent black background to create the fade/trail effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Pick a random character
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Randomly make some characters brighter green or white for depth
        if (Math.random() > 0.95) {
          ctx.fillStyle = '#f4f4f5'; // White flash
        } else if (Math.random() > 0.8) {
          ctx.fillStyle = '#a3e635'; // Bright lime
        } else {
          ctx.fillStyle = '#4d7c0f'; // Darker green for background depth
        }

        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly after it passes the screen
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move drop down
        drops[i]++;
      }
      
      // Control speed (approx 30fps for that retro terminal feel)
      setTimeout(() => {
        animationFrameId = requestAnimationFrame(draw);
      }, 33);
    };

    draw();

    // Handle window resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      columns = Math.floor(width / fontSize);
      
      // Preserve existing drops, add new ones if screen got wider
      const newDrops = Array(columns).fill(1).map((_, i) => drops[i] || Math.random() * -50);
      drops = newDrops;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40"
      style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
    />
  );
}