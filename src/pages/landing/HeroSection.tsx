import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AmbientTexture from '@/components/AmbientTexture';
import HeroScene from '@/components/ui/illustrations/HeroScene';
import { useInView } from 'react-intersection-observer';

const HeroSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <section id="hero-section" ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Ambient texture — desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 opacity-30">
          <AmbientTexture count={24} lineAlpha={0.04} />
        </div>
      )}

      {/* Subtle radial glow */}
      <div className="absolute top-[20%] left-[30%] -translate-x-1/2 w-[min(600px,50vw)] h-[min(600px,50vw)] bg-blue-fill/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[min(400px,35vw)] h-[min(400px,35vw)] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 w-full">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          {/* Left column */}
          <div>
            <motion.p
              className="text-[11px] font-medium tracking-[0.2em] uppercase text-primary mb-8"
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
              <span className="block font-display text-5xl sm:text-6xl lg:text-[72px] font-light leading-[0.95] text-ink">
                Build chatbots
              </span>
              <span className="block font-display text-5xl sm:text-6xl lg:text-[72px] font-light leading-[0.95] text-ink">
                that actually
              </span>
              <span className="block font-display italic text-5xl sm:text-6xl lg:text-[72px] font-light leading-[0.95] text-primary">
                think.
              </span>
            </motion.h1>

            <motion.p
              className="text-[15px] text-ink-muted max-w-md mb-10 leading-relaxed"
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
                className="h-11 px-7 inline-flex items-center rounded-pill bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/90 active:scale-[0.97] transition-all"
              >
                Start Building Free
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-11 px-7 rounded-pill border border-border/15 text-ink-muted text-[15px] font-medium hover:text-ink hover:border-border/30 active:scale-[0.97] transition-all"
              >
                See it in action
              </button>
            </motion.div>

            <motion.p
              className="text-[13px] text-label-muted"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              No credit card required · Live in 5 minutes
            </motion.p>
          </div>

          {/* Right column — Live demo */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <HeroScene />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
