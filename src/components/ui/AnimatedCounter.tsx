import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  formatter?: (v: number) => string;
}

const AnimatedCounter = ({ value, duration = 400, className = '', suffix = '', formatter }: AnimatedCounterProps) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const from = 0;
    const to = value;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [inView, value, duration]);

  const displayText = formatter ? formatter(display) : display.toLocaleString();

  return (
    <span ref={ref} className={className}>
      {displayText}{suffix}
    </span>
  );
};

export default AnimatedCounter;
