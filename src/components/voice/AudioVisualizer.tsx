import { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  level: number;
  mode: 'listening' | 'speaking' | 'idle';
  isActive: boolean;
}

const NUM_BARS = 40;
const INNER_RADIUS = 18;
const BAR_WIDTH = 3;
const MAX_BAR_HEIGHT = 40;

export function AudioVisualizer({ level, mode, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(level);
  const animRef = useRef<number>(0);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth * dpr;
    canvas.width = size;
    canvas.height = size;
    ctx.scale(dpr, dpr);
    const center = canvas.clientWidth / 2;

    const color = mode === 'listening' ? '#22C55E' : mode === 'speaking' ? '#3B82F6' : '#6B7280';

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      phase += 0.03;

      const baseLevel = isActive ? levelRef.current : 0.05;

      for (let i = 0; i < NUM_BARS; i++) {
        const angle = (i / NUM_BARS) * Math.PI * 2 - Math.PI / 2;
        const wave = Math.sin(phase + i * 0.5) * 0.3 + 0.7;
        const height = Math.max(2, baseLevel * MAX_BAR_HEIGHT * wave);
        const x = center + Math.cos(angle) * INNER_RADIUS;
        const y = center + Math.sin(angle) * INNER_RADIUS;
        const xEnd = center + Math.cos(angle) * (INNER_RADIUS + height);
        const yEnd = center + Math.sin(angle) * (INNER_RADIUS + height);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.strokeStyle = color;
        ctx.lineWidth = BAR_WIDTH;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.4 + (height / MAX_BAR_HEIGHT) * 0.6;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(center, center, INNER_RADIUS - 2, 0, Math.PI * 2);
      ctx.fillStyle = mode === 'listening' ? '#22C55E20' : mode === 'speaking' ? '#3B82F620' : '#6B728020';
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [mode, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="w-32 h-32"
      style={{ aspectRatio: '1' }}
    />
  );
}
