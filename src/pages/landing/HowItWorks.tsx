import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import HowItWorksScene from '@/components/ui/illustrations/HowItWorksScene';

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
          className="font-display text-[36px] sm:text-[44px] font-normal text-ink text-center mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Idea to deployed in <span className="italic text-primary">5 minutes</span>
        </motion.h2>
        <motion.p
          className="text-[15px] text-muted-foreground text-center mb-10 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          No code. No complexity. Just results.
        </motion.p>

        {/* Animated timeline */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <HowItWorksScene />
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
