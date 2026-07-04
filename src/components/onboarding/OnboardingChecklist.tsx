import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { CheckIcon, BotIcon, FAQIcon, LaunchIcon, SettingsIcon, SparkleIcon } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import type { Chatbot } from '@/hooks/useChatbot';

const STORAGE_KEY = 'onboarding_dismissed';

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
  link: string;
  check: (ctx: OnboardingCtx) => boolean;
}

interface OnboardingCtx {
  chatbots: Chatbot[];
  faqCount: number;
  hasDeployed: boolean;
  profileComplete: boolean;
}

const steps: Step[] = [
  { id: 'create', label: 'Create your first chatbot', icon: BotIcon, link: '/builder/new', check: (c) => c.chatbots.length > 0 },
  { id: 'faq', label: 'Add at least 3 FAQs', icon: FAQIcon, link: '/dashboard', check: (c) => c.faqCount >= 3 },
  { id: 'deploy', label: 'Deploy your chatbot', icon: LaunchIcon, link: '/dashboard', check: (c) => c.hasDeployed },
  { id: 'profile', label: 'Complete your profile', icon: SettingsIcon, link: '/settings', check: (c) => c.profileComplete },
  { id: 'customize', label: 'Customize bot appearance', icon: SparkleIcon, link: '/dashboard', check: (c) => c.chatbots.some(b => b.avatar_emoji && b.avatar_emoji !== 'bot') },
];

interface Props {
  ctx: OnboardingCtx;
}

const OnboardingChecklist = ({ ctx }: Props) => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [showConfetti, setShowConfetti] = useState(false);

  const completed = steps.filter(s => s.check(ctx)).length;
  const allDone = completed === steps.length;

  useEffect(() => {
    if (allDone && !dismissed) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, dismissed]);

  const dismiss = () => { setDismissed(true); localStorage.setItem(STORAGE_KEY, 'true'); };

  if (dismissed) return null;

  return (
    <>
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={200} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-[14px] border border-border bg-card p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Getting Started</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{completed}/{steps.length} completed</p>
          </div>
          <button onClick={dismiss} className="rounded-[6px] p-1.5 text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--color-surface-3))] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1.5">
          {steps.map((step) => {
            const done = step.check(ctx);
            return (
              <Link
                key={step.id}
                to={step.link}
                className={`flex items-center gap-3 rounded-[8px] px-3 py-2 text-[13px] transition-colors ${
                  done ? 'text-muted-foreground' : 'text-foreground hover:bg-[hsl(var(--color-surface-2))]'
                }`}
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  done ? 'border-success bg-success/10' : 'border-border'
                }`}>
                  {done && <CheckIcon className="h-3 w-3 text-success" />}
                </div>
                <step.icon className="h-3.5 w-3.5 shrink-0" />
                <span className={done ? 'line-through' : ''}>{step.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default OnboardingChecklist;
