import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const BRANCHES = [
  'When do you open?',
  'What time do you close?',
  'Are you open on Sundays?',
  'What are your business hours?',
  'Do you have weekend hours?',
  'What time can I visit?',
  'Are you open right now?',
  'When is the best time to come in?',
];

const SuperchargeScene = ({ className = '' }: { className?: string }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <div ref={ref} className={`relative h-[480px] w-full max-w-[720px] ${className}`} aria-hidden="true">
      <svg viewBox="0 0 720 480" fill="none" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="superchargeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central glow */}
        <motion.circle
          cx="360"
          cy="240"
          r="100"
          fill="url(#superchargeGlow)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
        />

        {/* Central node — the original FAQ */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
        >
          <rect x="280" y="214" width="160" height="52" rx="14" className="fill-primary/15 stroke-primary/40" strokeWidth="1.5" />
          <text x="360" y="246" textAnchor="middle" className="fill-primary text-[14px] font-medium" dominantBaseline="middle">
            Opening hours?
          </text>
        </motion.g>

        {/* Central pulsing rings */}
        <motion.circle
          cx="360"
          cy="240"
          r="42"
          className="stroke-primary/15"
          strokeWidth="1"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={inView ? { scale: [0.8, 1.3, 0.8], opacity: [0, 0.5, 0] } : {}}
          transition={{ duration: 2.5, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="360"
          cy="240"
          r="62"
          className="stroke-primary/10"
          strokeWidth="0.8"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={inView ? { scale: [0.6, 1.4, 0.6], opacity: [0, 0.35, 0] } : {}}
          transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="360"
          cy="240"
          r="82"
          className="stroke-primary/5"
          strokeWidth="0.6"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={inView ? { scale: [0.4, 1.5, 0.4], opacity: [0, 0.25, 0] } : {}}
          transition={{ duration: 3.5, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Branching paths — two rows */}
        {BRANCHES.map((text, i) => {
          const isTop = i < 4;
          const col = i % 4;
          const x2 = 80 + col * 170;
          const y2 = isTop ? 120 : 380;
          const cx = (360 + x2) / 2;
          const cy = (240 + y2) / 2 + (isTop ? -30 : 30);

          return (
            <motion.g
              key={text}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              {/* Path */}
              <motion.path
                d={`M360 240 Q${cx} ${cy} ${x2} ${y2}`}
                className="stroke-primary/20"
                strokeWidth="1"
                strokeDasharray="3 3"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
              />

              {/* Traveling dot */}
              <motion.circle
                r="3"
                className="fill-primary"
                initial={{ offsetDistance: '0%', opacity: 0 }}
                animate={inView ? { offsetDistance: '100%', opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 1.5, delay: 0.3 + i * 0.07 + 0.15, times: [0, 0.1, 0.7, 1] }}
                style={{ offsetPath: `path("M360 240 Q${cx} ${cy} ${x2} ${y2}")` }}
              />

              {/* Variation card */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.35 + i * 0.07 }}
              >
                <rect
                  x={x2 - 60}
                  y={y2 - 16}
                  width="120"
                  height="32"
                  rx="6"
                  className="fill-card stroke-border/20"
                  strokeWidth="0.5"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))' }}
                />
                <text
                  x={x2}
                  y={y2 + 2}
                  textAnchor="middle"
                  className="fill-muted-foreground/80 text-[11px]"
                  dominantBaseline="middle"
                >
                  {text}
                </text>
              </motion.g>
            </motion.g>
          );
        })}

        {/* Orbiting particles */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const orbitR = 52;
          const angleOffset = (i * Math.PI * 2) / 8;
          return (
            <motion.circle
              key={i}
              r="2"
              className="fill-primary/50"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: [0, 1, 0], scale: [0, 1.5, 0] } : {}}
              transition={{ duration: 1.8, delay: 0.6 + i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                cx: 360 + orbitR * Math.cos(angleOffset),
                cy: 240 + orbitR * Math.sin(angleOffset),
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default SuperchargeScene;
