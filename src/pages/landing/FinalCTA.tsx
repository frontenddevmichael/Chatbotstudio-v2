import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const FinalCTA = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden bg-[#080810]">
      {/* Gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00d4ff]/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Your customers are waiting.
        </motion.h2>
        <motion.p
          className="text-gray-400 text-lg mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          Build your first AI chatbot today. Free. No code. No excuses.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <Link to="/signup">
            <Button className="bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 font-semibold h-14 px-12 text-lg">
              Get Started — It's Free
            </Button>
          </Link>
          <p className="text-sm text-gray-600 mt-4">
            No credit card required • Live in 5 minutes • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
