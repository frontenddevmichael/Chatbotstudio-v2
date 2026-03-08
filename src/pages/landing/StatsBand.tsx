import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

const STATS = [
  { value: 5, suffix: ' min', label: 'Average setup time' },
  { value: 0, suffix: '', label: 'Lines of code required' },
  { value: 24, suffix: '/7', label: 'Your bot never sleeps' },
  { value: '∞', suffix: '', label: 'Conversations handled' },
];

const Counter = ({ value, suffix, inView }: { value: number | string; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);
  const isNumber = typeof value === 'number';

  useEffect(() => {
    if (!inView || !isNumber) return;
    const target = value as number;
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const duration = 1500;
    const step = duration / target;
    const interval = setInterval(() => {
      start++;
      setCount(start);
      if (start >= target) clearInterval(interval);
    }, step);
    return () => clearInterval(interval);
  }, [inView, value, isNumber]);

  return (
    <span className="font-serif italic text-[48px] sm:text-[56px] text-foreground/90">
      {isNumber ? count : value}{suffix}
    </span>
  );
};

const StatsBand = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-background border-y border-border/60">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={i < STATS.length - 1 ? 'md:border-r md:border-border' : ''}
          >
            <Counter value={stat.value} suffix={stat.suffix} inView={inView} />
            <p className="text-[11px] tracking-[0.08em] uppercase text-muted-foreground/50 mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsBand;
