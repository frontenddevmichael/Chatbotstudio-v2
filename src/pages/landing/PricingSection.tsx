import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@/components/ui/icons';
import WaitlistModal from './WaitlistModal';

const FREE_FEATURES = ['1 chatbot', '500 messages/month', 'Supercharge FAQ', 'Website embed', 'Basic analytics'];
const PREMIUM_FEATURES = ['Up to 10 chatbots', '10,000 messages/month', 'Custom branding', 'Advanced analytics', 'Ad-free dashboard', 'Priority support'];

const PricingSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section ref={ref} id="pricing" className="py-24 md:py-32 bg-background px-6">
      <div className="max-w-4xl mx-auto">
        <motion.p
          className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary text-center mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Pricing
        </motion.p>
        <motion.h2
          className="font-display text-[36px] sm:text-[44px] font-normal text-ink text-center mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Simple, honest pricing
        </motion.h2>
        <motion.p
          className="text-[15px] text-muted-foreground text-center mb-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          Start free. Upgrade when you're ready.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <motion.div
            className="rounded-[14px] border border-border bg-card p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="text-[11px] font-display text-muted-foreground/50 mb-4">Free Forever</div>
            <div className="mb-6">
              <span className="font-display text-[48px] text-ink">$0</span>
              <span className="text-[15px] text-muted-foreground/60">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="text-[13px] text-muted-foreground flex items-center gap-2">
                  <CheckIcon className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="block w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium flex items-center justify-center hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              Start Building Free
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div
            className="rounded-[14px] border-2 border-primary/30 bg-card p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            {/* Left accent bar */}
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-primary" />

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-display text-muted-foreground/50">Premium</span>
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <div className="mb-6">
              <span className="font-display text-[48px] text-ink">$19.99</span>
              <span className="text-[15px] text-muted-foreground/60">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="text-[13px] text-muted-foreground flex items-center gap-2">
                  <CheckIcon className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setModalOpen(true)}
              className="block w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium flex items-center justify-center hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              Join the Waitlist
            </button>
          </motion.div>
        </div>

        {/* Cost comparison */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary text-center mb-3">
            Cost Comparison
          </p>
          <h3 className="font-display text-[24px] sm:text-[28px] font-normal text-ink text-center mb-2">
            Predictable pricing vs. the alternatives
          </h3>
          <p className="text-[13px] text-muted-foreground text-center mb-8">
            See how much you save with a flat monthly rate.
          </p>

          <ComparisonCalculator />
        </motion.div>
      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};

const ComparisonCalculator = () => {
  const [volume, setVolume] = useState(5000);
  const studioCost = 19.99;

  // Intercom Essential: ~$74/mo base + ~$0.99/resolution (estimated at ~10% of conversations)
  const intercomBase = 74;
  const intercomPerResolution = 0.99;
  const estimatedResolutions = Math.round(volume * 0.1);
  const intercomCost = intercomBase + estimatedResolutions * intercomPerResolution;

  // Fini: $499/mo minimum (entry-level)
  const finiCost = 499;

  const savingsVsIntercom = intercomCost - studioCost;
  const savingsVsFini = finiCost - studioCost;

  return (
    <div className="max-w-3xl mx-auto bg-card border border-border rounded-[14px] p-6 sm:p-8">
      {/* Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground">Monthly conversations</span>
          <span className="text-[17px] font-semibold tabular-nums text-foreground">
            {volume.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={1000}
          max={100000}
          step={1000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground/50 mt-1">
          <span>1K</span>
          <span>100K</span>
        </div>
      </div>

      {/* Columns */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* ChatBot Studio */}
        <div className="rounded-[12px] border-2 border-primary/30 bg-primary/[0.02] p-5 text-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">ChatBot Studio</p>
          <p className="text-[28px] font-semibold text-foreground">
            ${studioCost.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">/month flat</p>
        </div>

        {/* Intercom */}
        <div className="rounded-[12px] border border-border bg-surface-2/30 p-5 text-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Intercom</p>
          <p className="text-[28px] font-semibold text-foreground">
            ${Math.round(intercomCost).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">/month estimated</p>
          <p className="mt-2 text-[10px] text-muted-foreground/60">
            {intercomBase} base + {estimatedResolutions.toLocaleString()} resolutions × ${intercomPerResolution.toFixed(2)}
          </p>
        </div>

        {/* Fini */}
        <div className="rounded-[12px] border border-border bg-surface-2/30 p-5 text-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Fini</p>
          <p className="text-[28px] font-semibold text-foreground">
            ${finiCost.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">/month minimum</p>
        </div>
      </div>

      {/* Savings callout */}
      {savingsVsIntercom > 0 && (
        <div className="mt-6 rounded-[10px] bg-success/5 border border-success/20 p-4 text-center">
          <p className="text-[13px] text-foreground">
            You save{' '}
            <span className="font-semibold text-success">
              ${savingsVsIntercom.toLocaleString()}
            </span>{' '}
            per month vs. Intercom{volume >= 50000 ? `, and` : ','}{' '}
            <span className="font-semibold text-success">
              ${savingsVsFini.toLocaleString()}
            </span>{' '}
            vs. Fini
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Flat rate. No surprise bills. No per-resolution pricing.
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingSection;
