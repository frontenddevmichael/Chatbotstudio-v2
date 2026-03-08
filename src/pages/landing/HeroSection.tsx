import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ParticleField from './ParticleField';
import LiveChatDemo from './LiveChatDemo';
import { useInView } from 'react-intersection-observer';

const HeroSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-[#080810]">
      {/* Particle background */}
      <div className="absolute inset-0">
        <ParticleField count={isMobile ? 40 : 80} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
        <div className="grid md:grid-cols-[55fr_45fr] gap-12 md:gap-16 items-center">
          {/* Left column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="font-display text-xs tracking-[0.3em] uppercase text-[#00d4ff]">
                ✦ No-code AI chatbots
              </span>
            </motion.div>

            <h1 className="font-display font-bold leading-[0.95] mb-6">
              {['Build chatbots', 'that actually'].map((line, i) => (
                <motion.span
                  key={i}
                  className="block text-4xl sm:text-5xl lg:text-7xl text-white"
                  initial={{ opacity: 0, y: 40 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                >
                  {line}
                </motion.span>
              ))}
              <motion.span
                className="block text-4xl sm:text-5xl lg:text-7xl text-[#00d4ff]"
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                think.
              </motion.span>
            </h1>

            <motion.p
              className="font-body text-gray-400 text-base sm:text-lg max-w-lg mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Give your business a voice. ChatBot Studio lets you create intelligent AI chatbots
              trained on your knowledge — deployed anywhere in minutes.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.85 }}
            >
              <Link to="/signup">
                <Button className="bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 font-semibold h-12 px-8 text-base">
                  Start Building Free
                </Button>
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-8 rounded-md border border-[#1e1e2e] text-gray-300 hover:text-white hover:border-[#00d4ff]/40 transition-all text-base font-medium"
              >
                See it in action ↓
              </button>
            </motion.div>

            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <div className="flex -space-x-2">
                {['#00d4ff', '#ffb547', '#ff6b8a', '#a78bfa', '#34d399'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-[#080810]" style={{ background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span className="text-sm text-gray-500">Join 2,000+ businesses already building</span>
            </motion.div>
          </div>

          {/* Right column — Live demo */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Floating badge */}
            <div className="absolute -top-4 left-4 z-20 bg-[#111118] border border-[#1e1e2e] rounded-full px-3 py-1 text-xs font-mono text-[#ffb547]">
              ⚡ AI-powered
            </div>
            {/* Glow */}
            <div className="absolute inset-0 bg-[#00d4ff]/5 blur-3xl rounded-full scale-110" />
            <LiveChatDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
