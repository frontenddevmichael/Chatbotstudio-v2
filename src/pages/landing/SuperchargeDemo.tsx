import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Zap, RotateCcw } from 'lucide-react';

const VARIATIONS = [
  'When do you open?',
  'What time do you close?',
  'Are you open on Sundays?',
  'What are your business hours?',
  'Do you have weekend hours?',
  'What time can I visit?',
  'Are you open right now?',
  'When is the best time to come in?',
];

const SuperchargeDemo = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [fired, setFired] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [count, setCount] = useState(0);

  const fire = useCallback(() => {
    setFired(true);
    setShowCards(false);
    setCount(0);
    setTimeout(() => {
      setShowCards(true);
      let c = 0;
      const interval = setInterval(() => {
        c++;
        setCount(c);
        if (c >= 8) clearInterval(interval);
      }, 120);
    }, 600);
  }, []);

  // Auto-fire on scroll into view
  const handleView = useCallback(() => {
    if (!fired) fire();
  }, [fired, fire]);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#080810] px-6">
      {inView && !fired && <AutoFire onFire={handleView} />}
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          One question. <span className="text-[#ffb547]">Eight ways to ask it.</span>
        </motion.h2>
        <motion.p
          className="text-gray-500 mb-12 max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          ⚡ Supercharge turns one FAQ into a bot that understands every way your customer might ask it.
        </motion.p>

        {/* Original FAQ */}
        <motion.div
          className="inline-block rounded-xl border border-[#1e1e2e] bg-[#111118] px-6 py-4 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3 }}
        >
          <div className="text-xs font-mono text-gray-500 mb-1">Original FAQ</div>
          <div className="text-white font-medium">"What are your opening hours?"</div>
        </motion.div>

        {/* Fire button */}
        <div className="mb-8">
          <motion.button
            onClick={fire}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ffb547] text-[#080810] font-semibold hover:bg-[#ffb547]/90 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {fired ? <RotateCcw size={18} /> : <Zap size={18} />}
            {fired ? 'Replay' : '⚡ Supercharge'}
          </motion.button>
        </div>

        {/* Variation cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <AnimatePresence>
            {showCards && VARIATIONS.map((v, i) => (
              <motion.div
                key={v}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.08 }}
                className="rounded-lg border border-[#ffb547]/20 bg-[#ffb547]/5 px-3 py-2 text-sm text-[#ffb547]"
              >
                {v}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {showCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-sm text-gray-500"
          >
            <span className="text-[#ffb547] font-bold">{count}</span> variations generated
          </motion.div>
        )}
      </div>
    </section>
  );
};

// Tiny helper to fire on mount
const AutoFire = ({ onFire }: { onFire: () => void }) => {
  useState(() => { setTimeout(onFire, 800); });
  return null;
};

export default SuperchargeDemo;
