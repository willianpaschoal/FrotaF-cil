import React, { useEffect, useRef } from 'react';

export interface ParticleBackgroundProps {
  particleCount?: number;
  preset?: 'links' | 'default' | 'dots' | string;
  color?: string;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
}

function hexToRgba(hexOrColor: string, alpha: number): string {
  if (hexOrColor.startsWith('rgba') || hexOrColor.startsWith('rgb')) {
    return hexOrColor;
  }

  let cleanHex = hexOrColor.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return hexOrColor;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 100,
  preset = 'links',
  color = '#00FFE1',
  speed = 2,
  className = '',
  children,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const mouse = {
      x: -9999,
      y: -9999,
      radius: 120,
    };

    const initDimensions = () => {
      const parent = canvas.parentElement || document.body;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    const createParticles = () => {
      particles = [];
      const count = Math.max(10, particleCount);
      const spdFactor = (speed || 1) * 0.4;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * (width || 800),
          y: Math.random() * (height || 600),
          vx: (Math.random() - 0.5) * spdFactor,
          vy: (Math.random() - 0.5) * spdFactor,
          radius: Math.random() * 1.5 + 1.2,
          baseAlpha: Math.random() * 0.4 + 0.4,
        });
      }
    };

    initDimensions();
    createParticles();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isLinks = preset === 'links';
      const linkDistance = 110;

      // Draw lines between close particles if preset is 'links'
      if (isLinks && particles.length > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < linkDistance) {
              const alpha = (1 - dist / linkDistance) * 0.35;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = hexToRgba(color, alpha);
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }

          // Link to mouse if interactive and near
          if (interactive && mouse.x > 0 && mouse.y > 0) {
            const mdx = p1.x - mouse.x;
            const mdy = p1.y - mouse.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (mDist < mouse.radius) {
              const alpha = (1 - mDist / mouse.radius) * 0.5;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = hexToRgba(color, alpha);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce / wrap around edges
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, p.baseAlpha);
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const handleResize = () => {
      initDimensions();
      // keep particles in bounds
      particles.forEach(p => {
        if (p.x > width) p.x = Math.random() * width;
        if (p.y > height) p.y = Math.random() * height;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleCount, preset, color, speed, interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      {children}
    </div>
  );
};

export default ParticleBackground;
