import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Bot, FileText, Zap, Rocket } from 'lucide-react';

const STEPS = [
  { icon: Bot, title: 'Name & configure your bot', time: '30 sec', color: '#00d4ff' },
  { icon: FileText, title: 'Upload your FAQs or knowledge', time: '2 min', color: '#00d4ff' },
  { icon: Zap, title: 'Supercharge with AI variations', time: '10 sec', color: '#ffb547' },
  { icon: Rocket, title: 'Copy embed code & go live', time: '30 sec', color: '#00d4ff' },
];

const HowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#080810] px-6">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          From idea to deployed in <span className="text-[#00d4ff]">5 minutes</span>
        </motion.h2>
        <motion.p
          className="text-gray-500 text-center mb-16 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          No code. No complexity. Just results.
        </motion.p>

        <div className="relative">
          {/* Connecting line */}
          <motion.div
            className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#1e1e2e] via-[#00d4ff]/30 to-[#1e1e2e]"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3 }}
            style={{ transformOrigin: 'left' }}
          />

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  className="text-center relative"
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                >
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center border"
                    style={{ borderColor: step.color + '40', background: step.color + '10' }}
                  >
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <h4 className="font-display text-white font-semibold text-sm mb-2">{step.title}</h4>
                  <span className="font-mono text-xs text-gray-500 bg-[#111118] px-2 py-0.5 rounded">{step.time}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
