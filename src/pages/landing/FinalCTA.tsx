import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';

const FinalCTA = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden bg-background">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          className="font-serif text-[44px] sm:text-[56px] lg:text-[64px] font-normal text-foreground/90 mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Your customers are waiting.
        </motion.h2>
        <motion.p
          className="text-[17px] text-muted-foreground mb-10 max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          Build your first AI chatbot today. Free. No code. No excuses.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/signup"
            className="inline-flex h-12 px-10 items-center rounded-[10px] bg-primary text-primary-foreground text-[17px] font-medium hover:bg-primary/90 active:scale-[0.97] transition-all"
          >
            Get Started — It's Free
          </Link>
          <p className="text-[13px] text-muted-foreground/40 mt-5">
            No credit card required · Live in 5 minutes · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
