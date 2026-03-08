import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import WaitlistModal from './WaitlistModal';

const FREE_FEATURES = ['1 chatbot', '500 messages/month', 'Supercharge FAQ', 'Website embed', 'Basic analytics'];
const PREMIUM_FEATURES = ['Up to 10 chatbots', '10,000 messages/month', 'Custom branding', 'Advanced analytics', 'Ad-free dashboard', 'Priority support'];

const PricingSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section ref={ref} id="pricing" className="py-24 md:py-32 bg-black px-6">
      <div className="max-w-4xl mx-auto">
        <motion.p
          className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0a84ff] text-center mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Pricing
        </motion.p>
        <motion.h2
          className="font-serif text-[36px] sm:text-[44px] font-normal text-white/90 text-center mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Simple, honest pricing
        </motion.h2>
        <motion.p
          className="text-[15px] text-white/40 text-center mb-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          Start free. Upgrade when you're ready.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <motion.div
            className="rounded-[14px] border border-white/[0.06] bg-[#0a0a0a] p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="text-[11px] font-mono text-white/25 mb-4">Free Forever</div>
            <div className="mb-6">
              <span className="font-serif text-[48px] text-white/90">$0</span>
              <span className="text-[15px] text-white/30">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="text-[13px] text-white/55 flex items-center gap-2">
                  <Check size={14} className="text-[#0a84ff] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full h-10 rounded-[10px] bg-[#0a84ff] text-white text-[14px] font-medium flex items-center justify-center hover:bg-[#409cff] active:scale-[0.97] transition-all"
            >
              Start Building Free
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div
            className="rounded-[14px] border border-[#0a84ff]/20 bg-[#0a0a0a] p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#0a84ff]/40 to-transparent" />

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-mono text-white/25">Premium</span>
              <span className="text-[10px] font-medium bg-[#ff9f0a]/10 text-[#ff9f0a] px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <div className="mb-6">
              <span className="font-serif text-[48px] text-white/90">$19.99</span>
              <span className="text-[15px] text-white/30">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="text-[13px] text-white/55 flex items-center gap-2">
                  <Check size={14} className="text-[#ff9f0a] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setModalOpen(true)}
              className="block w-full h-10 rounded-[10px] border border-white/10 text-white/80 text-[14px] font-medium flex items-center justify-center hover:border-white/20 hover:text-white active:scale-[0.97] transition-all"
            >
              Join the Waitlist
            </button>
          </motion.div>
        </div>
      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};

export default PricingSection;
