import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Bot, FileText, Zap, Rocket } from 'lucide-react';

const STEPS = [
  { icon: Bot, title: 'Name & configure your bot', time: '30 sec' },
  { icon: FileText, title: 'Upload your FAQs', time: '2 min' },
  { icon: Zap, title: 'Supercharge with AI', time: '10 sec' },
  { icon: Rocket, title: 'Copy embed & go live', time: '30 sec' },
];

const HowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary text-center mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          How it works
        </motion.p>
        <motion.h2
          className="font-serif text-[36px] sm:text-[44px] font-normal text-foreground/90 text-center mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Idea to deployed in <span className="italic text-primary">5 minutes</span>
        </motion.h2>
        <motion.p
          className="text-[15px] text-muted-foreground text-center mb-16 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          No code. No complexity. Just results.
        </motion.p>

        <div className="relative">
          {/* Connecting line */}
          <motion.div
            className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-border"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ transformOrigin: 'left' }}
          />

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  className="text-center relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center bg-primary/10 border border-primary/20">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h4 className="text-[14px] font-medium text-foreground/80 mb-2">{step.title}</h4>
                  <span className="font-mono text-[11px] text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded">{step.time}</span>
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
