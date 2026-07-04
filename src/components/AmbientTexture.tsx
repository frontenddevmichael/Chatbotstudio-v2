import { useEffect, useRef } from 'react';

interface Props {
  count?: number;
  lineAlpha?: number;
}

const AmbientTexture = ({ count = 24, lineAlpha = 0.06 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let particles: { x: number; y: number; vx: number; vy: number }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    };

    const init = () => {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };

    const draw = () => {
      if (!running) return;
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains('dark');
      const hue = 210;
      const sat = isDark ? 30 : 53;
      const lit = isDark ? 20 : 84;
      const color = `${hue} ${sat}% ${lit}%`;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      ctx!.fillStyle = `hsla(${color}, 0.15)`;
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.strokeStyle = `hsla(${color}, ${lineAlpha})`;
      ctx!.lineWidth = 0.5;
      const maxDist = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx!.globalAlpha = 1 - dist / maxDist;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    const visibilityHandler = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafRef.current);
      } else {
        running = true;
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    const resizeHandler = () => { resize(); };
    window.addEventListener('resize', resizeHandler);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('resize', resizeHandler);
    };
  }, [count, lineAlpha]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
};

export default AmbientTexture;
