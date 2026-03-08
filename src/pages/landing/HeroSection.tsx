import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParticleField from './ParticleField';
import LiveChatDemo from './LiveChatDemo';
import { useInView } from 'react-intersection-observer';

const HeroSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Particle background — desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 opacity-40">
          <ParticleField count={60} />
        </div>
      )}

      {/* Subtle radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#0a84ff]/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 w-full">
        <div className="grid lg:grid-cols-[55fr_45fr] gap-16 items-center">
          {/* Left column */}
          <div>
            <motion.p
              className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0a84ff] mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              No-code AI chatbots
            </motion.p>

            <motion.h1
              className="mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="block font-serif text-5xl sm:text-6xl lg:text-[72px] font-normal leading-[0.95] text-white/90">
                Build chatbots
              </span>
              <span className="block font-serif text-5xl sm:text-6xl lg:text-[72px] font-normal leading-[0.95] text-white/90">
                that actually
              </span>
              <span className="block font-serif italic text-5xl sm:text-6xl lg:text-[72px] font-normal leading-[0.95] text-[#0a84ff]">
                think.
              </span>
            </motion.h1>

            <motion.p
              className="text-[15px] text-white/50 max-w-md mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Create intelligent AI chatbots trained on your knowledge.
              Deploy anywhere. Let them handle customer questions 24/7.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3 mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to="/signup"
                className="h-11 px-7 inline-flex items-center rounded-[10px] bg-[#0a84ff] text-white text-[15px] font-medium hover:bg-[#409cff] active:scale-[0.97] transition-all"
              >
                Start Building Free
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-11 px-7 rounded-[10px] border border-white/10 text-white/60 text-[15px] font-medium hover:text-white/90 hover:border-white/20 active:scale-[0.97] transition-all"
              >
                See it in action
              </button>
            </motion.div>

            <motion.p
              className="text-[13px] text-white/30"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              No credit card required · Live in 5 minutes
            </motion.p>
          </div>

          {/* Right column — Live demo */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <LiveChatDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
