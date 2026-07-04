import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const STEPS = [
  { label: 'Configure', time: '30 sec', color: 'hsl(var(--primary) / 0.6)' },
  { label: 'Upload FAQs', time: '2 min', color: 'hsl(var(--primary) / 0.7)' },
  { label: 'Supercharge', time: '10 sec', color: 'hsl(var(--primary) / 0.8)' },
  { label: 'Go Live', time: '30 sec', color: 'hsl(var(--primary))' },
];

const HowItWorksScene = ({ className = '' }: { className?: string }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <div ref={ref} className={`relative h-[340px] w-full max-w-[960px] ${className}`} aria-hidden="true">
      <svg viewBox="0 0 960 340" fill="none" className="absolute inset-0 h-full w-full">
        {/* Horizontal track line */}
        <motion.line
          x1="60"
          y1="170"
          x2="900"
          y2="170"
          className="stroke-border/40"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Glow along the track */}
        <motion.line
          x1="60"
          y1="170"
          x2="900"
          y2="170"
          className="stroke-primary/10"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        />

        {/* Traveling dot */}
        <motion.circle
          r="5"
          className="fill-primary"
          initial={{ offsetDistance: '0%' }}
          animate={inView ? { offsetDistance: '100%' } : {}}
          transition={{ duration: 2.5, delay: 0.5, ease: 'easeInOut' }}
          style={{ offsetPath: "path('M60 170 L900 170')" }}
        />

        {STEPS.map((step, i) => {
          const cx = 120 + i * 210;
          const isLast = i === STEPS.length - 1;
          const nodeR = isLast ? 32 : 26;

          return (
            <motion.g
              key={step.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
            >
              {/* Vertical connector */}
              <motion.line
                x1={cx}
                y1="170"
                x2={cx}
                y2="118"
                className="stroke-border/30"
                strokeWidth="1"
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.15 }}
                style={{ transformOrigin: `${cx}px 170px` }}
              />

              {/* Node circle */}
              <motion.circle
                cx={cx}
                cy="118"
                r={nodeR}
                className={isLast ? 'fill-primary stroke-primary/30' : 'fill-primary/10 stroke-primary/20'}
                strokeWidth="1.5"
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.25 + i * 0.15 }}
              />

              {/* Checkmark or number */}
              {isLast ? (
                <motion.path
                  d={`M${cx - 11} 118 L${cx - 3} 127 L${cx + 11} 108`}
                  className="stroke-primary-foreground"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.55 + i * 0.15 }}
                />
              ) : (
                <text
                  x={cx}
                  y="124"
                  textAnchor="middle"
                  className="fill-primary text-[15px] font-semibold"
                >
                  {i + 1}
                </text>
              )}

              {/* Label */}
              <text
                x={cx}
                y="200"
                textAnchor="middle"
                className="fill-foreground/80 text-[15px] font-medium"
              >
                {step.label}
              </text>

              {/* Time badge */}
              <motion.rect
                x={cx - 36}
                y="218"
                width="72"
                height="24"
                rx="6"
                className="fill-muted/50 stroke-border/20"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.15 }}
              />
              <text
                x={cx}
                y="234"
                textAnchor="middle"
                className="fill-muted-foreground/60 text-[11px] font-mono"
                dominantBaseline="middle"
              >
                {step.time}
              </text>
            </motion.g>
          );
        })}

        {/* Progress fill on track */}
        <motion.rect
          x="60"
          y="166"
          height="8"
          rx="4"
          className="fill-primary/20"
          initial={{ width: 0 }}
          animate={inView ? { width: 840 } : {}}
          transition={{ duration: 2.5, delay: 0.5, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
};

export default HowItWorksScene;
