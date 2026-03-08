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

  const handleView = useCallback(() => {
    if (!fired) fire();
  }, [fired, fire]);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-black px-6">
      {inView && !fired && <AutoFire onFire={handleView} />}
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          className="font-serif text-[36px] sm:text-[44px] font-normal text-white/90 mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          One question. <span className="italic text-[#ff9f0a]">Eight ways to ask it.</span>
        </motion.h2>
        <motion.p
          className="text-[15px] text-white/40 mb-12 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          Supercharge turns one FAQ into a bot that understands every way your customer might phrase it.
        </motion.p>

        {/* Original FAQ */}
        <motion.div
          className="inline-block rounded-[10px] border border-white/[0.08] bg-[#0a0a0a] px-6 py-4 mb-8"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          <div className="text-[11px] font-mono text-white/25 mb-1">Original FAQ</div>
          <div className="text-[15px] text-white/80 font-medium">"What are your opening hours?"</div>
        </motion.div>

        {/* Fire button */}
        <div className="mb-8">
          <motion.button
            onClick={fire}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-[10px] bg-[#ff9f0a] text-black text-[14px] font-semibold hover:bg-[#ff9f0a]/90 active:scale-[0.97] transition-all"
            whileTap={{ scale: 0.95 }}
          >
            {fired ? <RotateCcw size={16} /> : <Zap size={16} />}
            {fired ? 'Replay' : 'Supercharge'}
          </motion.button>
        </div>

        {/* Variation cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <AnimatePresence>
            {showCards && VARIATIONS.map((v, i) => (
              <motion.div
                key={v}
                initial={{ opacity: 0, scale: 0.8, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.06 }}
                className="rounded-[8px] border border-[#ff9f0a]/15 bg-[#ff9f0a]/[0.05] px-3 py-2 text-[12px] text-[#ff9f0a]/70"
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
            className="font-mono text-[13px] text-white/30"
          >
            <span className="text-[#ff9f0a] font-semibold">{count}</span> variations generated
          </motion.div>
        )}
      </div>
    </section>
  );
};

const AutoFire = ({ onFire }: { onFire: () => void }) => {
  useState(() => { setTimeout(onFire, 800); });
  return null;
};

export default SuperchargeDemo;
