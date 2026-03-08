import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import WaitlistModal from './WaitlistModal';

const FREE_FEATURES = ['1 chatbot', '500 messages/month', 'Supercharge FAQ', 'Website embed', 'Basic analytics'];
const PREMIUM_FEATURES = ['Up to 10 chatbots', '10,000 messages/month', 'Custom branding', 'Advanced analytics', 'Ad-free dashboard', 'Priority support'];

const TiltCard = ({ children, className, premium = false }: { children: React.ReactNode; className?: string; premium?: boolean }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [8, -8]);
  const rotateY = useTransform(x, [0, 1], [-8, 8]);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };
  const reset = () => { x.set(0.5); y.set(0.5); };

  return (
    <motion.div
      className={`relative rounded-xl p-px ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
    >
      {premium && (
        <div className="absolute inset-0 rounded-xl animate-gradient-border" />
      )}
      <div className={`relative rounded-xl bg-[#111118] p-8 h-full ${premium ? 'z-10' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
};

const PricingSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section ref={ref} id="pricing" className="py-24 md:py-32 bg-[#080810] px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Simple, honest pricing
        </motion.h2>
        <motion.p
          className="text-gray-500 text-center mb-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          Start free. Upgrade when you're ready.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-8">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <TiltCard className="border border-[#1e1e2e]">
              <div className="text-sm text-gray-500 font-mono mb-4">Free Forever</div>
              <div className="font-display text-4xl font-bold text-white mb-6">$0<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                    <Check size={14} className="text-[#00d4ff]" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="w-full bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 font-semibold">Start Building Free</Button>
              </Link>
            </TiltCard>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <TiltCard premium className="overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500 font-mono">Premium</span>
                <span className="text-[10px] font-mono bg-[#ffb547]/10 text-[#ffb547] px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
              <div className="font-display text-4xl font-bold text-white mb-6">$19.99<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {PREMIUM_FEATURES.map(f => (
                  <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                    <Check size={14} className="text-[#ffb547]" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setModalOpen(true)}
                className="w-full bg-[#ffb547] text-[#080810] hover:bg-[#ffb547]/90 font-semibold"
              >
                Join the Waitlist
              </Button>
            </TiltCard>
          </motion.div>
        </div>
      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};

export default PricingSection;
