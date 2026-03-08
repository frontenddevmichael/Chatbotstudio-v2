import { PLANS, isPremium } from '@/lib/plans';
import { useAuth } from '@/context/AuthContext';
import { X, Check, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import Spinner from '@/components/ui/Spinner';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const premium = isPremium(profile);

  if (!open) return null;

  const handleJoinWaitlist = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist').insert({ email });
      if (error) {
        if (error.code === '23505') toast.info("You're already on the waitlist!");
        else throw error;
      } else {
        toast.success("You're on the waitlist! We'll notify you when Premium launches.");
        setEmail('');
      }
    } catch {
      toast.error('Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-lg rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-6 text-center">
          <Zap className="mx-auto mb-2 h-10 w-10 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">Upgrade to Premium</h2>
          <p className="mt-1 text-sm text-muted-foreground">Unlock the full power of ChatBot Studio</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          {(['free', 'premium'] as const).map((plan) => (
            <div
              key={plan}
              className={`rounded-lg border p-4 ${
                plan === 'premium' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <h3 className="font-display text-lg font-bold text-foreground">{PLANS[plan].name}</h3>
              {plan === 'premium' && <p className="text-2xl font-bold text-primary">${PLANS[plan].price}<span className="text-sm text-muted-foreground">/mo</span></p>}
              {plan === 'free' && <p className="text-2xl font-bold text-foreground">$0</p>}
              <ul className="mt-3 space-y-2">
                {PLANS[plan].features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {!premium && (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for early access"
              className="w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleJoinWaitlist}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? <Spinner /> : 'Join Premium Waitlist'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;
