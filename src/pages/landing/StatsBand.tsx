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
    <span className="font-display text-4xl sm:text-5xl font-bold text-white">
      {isNumber ? count : value}{suffix}
    </span>
  );
};

const StatsBand = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section
      ref={ref}
      className="py-16 md:py-20 bg-[#0a0a12] border-y border-[#1e1e2e]/50 relative overflow-hidden"
    >
      {/* Scanline texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
          >
            <Counter value={stat.value} suffix={stat.suffix} inView={inView} />
            <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsBand;
