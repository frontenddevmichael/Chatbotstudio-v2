import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const HeroScene = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      className={`w-full h-auto max-w-[560px] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--color-surface-2))" />
          <stop offset="100%" stopColor="hsl(var(--color-surface-3))" />
        </linearGradient>
        <linearGradient id="bubbleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.1)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.05)" />
        </linearGradient>
        <clipPath id="logoClip">
          <circle cx="240" cy="170" r="24" />
        </clipPath>
      </defs>

      {/* Connecting paths */}
      <g>
        <path d="M130 130 Q200 110 240 150" className="stroke-border/30" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M130 180 Q200 190 240 170" className="stroke-border/30" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M240 150 Q300 120 360 130" className="stroke-border/30" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M240 170 Q300 190 360 180" className="stroke-border/30" strokeWidth="1.5" strokeDasharray="4 4" />
      </g>

      {/* Traveling dots */}
      <motion.circle
        r="3"
        className="fill-primary"
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ offsetPath: "path('M130 130 Q200 110 240 150')" }}
      />
      <motion.circle
        r="3"
        className="fill-primary"
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 0.5 }}
        style={{ offsetPath: "path('M130 180 Q200 190 240 170')" }}
      />
      <motion.circle
        r="3"
        className="fill-primary/70"
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
        style={{ offsetPath: "path('M240 150 Q300 120 360 130')" }}
      />
      <motion.circle
        r="3"
        className="fill-primary/70"
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1.5 }}
        style={{ offsetPath: "path('M240 170 Q300 190 360 180')" }}
      />

      {/* Hub glow */}
      <circle cx="240" cy="170" r="70" fill="url(#hubGlow)" />

      {/* Concentric rings */}
      <motion.circle
        cx="240" cy="170" r="50"
        className="stroke-primary/20"
        strokeWidth="1"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '240px', originY: '170px' }}
      />
      <motion.circle
        cx="240" cy="170" r="38"
        className="stroke-primary/15"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        animate={{ scale: [1, 0.92, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '240px', originY: '170px' }}
      />

      {/* Brand mark — ChatBot Studio logo */}
      <g>
        <circle cx="240" cy="170" r="28" className="fill-primary/5 stroke-primary/30" strokeWidth="1.5" />
        <image href={logo} x="216" y="146" width="48" height="48" clipPath="url(#logoClip)" />
      </g>

      {/* FAQ documents */}
      <g>
        <rect x="60" y="102" width="66" height="46" rx="5" fill="url(#docGrad)" className="stroke-border/40" strokeWidth="1" />
        <rect x="68" y="114" width="50" height="2.5" rx="1" className="fill-muted-foreground/30" />
        <rect x="68" y="121" width="42" height="2.5" rx="1" className="fill-muted-foreground/20" />
        <rect x="68" y="128" width="46" height="2.5" rx="1" className="fill-muted-foreground/15" />
        <rect x="68" y="136" width="22" height="2.5" rx="1" className="fill-primary/30" />
      </g>
      <g>
        <rect x="60" y="158" width="66" height="46" rx="5" fill="url(#docGrad)" className="stroke-border/40" strokeWidth="1" />
        <rect x="68" y="170" width="50" height="2.5" rx="1" className="fill-muted-foreground/30" />
        <rect x="68" y="177" width="42" height="2.5" rx="1" className="fill-muted-foreground/20" />
        <rect x="68" y="184" width="46" height="2.5" rx="1" className="fill-muted-foreground/15" />
        <rect x="68" y="192" width="22" height="2.5" rx="1" className="fill-primary/30" />
      </g>

      {/* Chat widget */}
      <g>
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="348" y="100" width="88" height="44" rx="10" fill="url(#bubbleGrad)" className="stroke-primary/20" strokeWidth="1" />
          <text x="362" y="119" className="fill-primary/70 text-[10px] font-medium" dominantBaseline="middle">Hello!</text>
          <text x="362" y="133" className="fill-muted-foreground/40 text-[9px]" dominantBaseline="middle">How can I help?</text>
          <path d="M348 128 L338 136 L348 136" className="fill-primary/5" />
        </motion.g>
        <motion.g
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <rect x="348" y="162" width="88" height="44" rx="10" fill="url(#bubbleGrad)" className="stroke-primary/20" strokeWidth="1" />
          <text x="362" y="181" className="fill-primary/70 text-[10px] font-medium" dominantBaseline="middle">Sure!</text>
          <text x="362" y="195" className="fill-muted-foreground/40 text-[9px]" dominantBaseline="middle">We're open 9–6.</text>
          <path d="M348 190 L338 198 L348 198" className="fill-primary/5" />
        </motion.g>
      </g>

      {/* Orbiting particles — large radius so they don't obstruct the center */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '240px', originY: '170px' }}
      >
        <circle cx="315" cy="170" r="2" className="fill-primary/40" />
      </motion.g>
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '240px', originY: '170px' }}
      >
        <circle cx="165" cy="170" r="1.5" className="fill-primary/30" />
      </motion.g>
    </svg>
  );
};

export default HeroScene;
