// STRIPE FUTURE-READINESS: To integrate Stripe payments, replace the waitlist
// section with a Stripe Checkout button. Use supabase.functions.invoke('create-checkout-session')
// passing the premium price ID. Listen for webhook events to update the user's plan.

import { useAuth } from '@/context/AuthContext';
import { PLANS, isPremium } from '@/lib/plans';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Zap } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

const BillingPage = () => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const premium = isPremium(profile);

  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;
  const usageColor = usagePercent > 90 ? 'text-destructive' : usagePercent > 60 ? 'text-warning' : 'text-success';

  const handleJoinWaitlist = async () => {
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist').insert({ email });
      if (error) {
        if (error.code === '23505') toast.info("You're already on the waitlist!");
        else throw error;
      } else {
        toast.success("You're on the waitlist!");
        setEmail('');
      }
    } catch {
      toast.error('Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SEO title="Upgrade to Premium" description="Unlock unlimited chatbots, advanced analytics, and more with ChatBot Studio Premium." />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Billing</h1>

      {/* Current plan hero */}
      <div className="glass-card mb-6 rounded-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
        <p className="mt-1 font-display text-3xl font-bold text-foreground">{premium ? 'Premium' : 'Free'}</p>
        <div className="mt-4 max-w-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Messages Used</span>
            <span className={`font-mono font-medium ${usageColor}`}>
              {profile?.monthly_message_count ?? 0} / {profile?.message_limit ?? 500}
            </span>
          </div>
          <Progress value={usagePercent} className="mt-2 h-2 bg-muted" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(['free', 'premium'] as const).map((plan) => (
          <div
            key={plan}
            className={`relative overflow-hidden rounded-lg ${
              plan === 'premium' ? 'p-[1px]' : ''
            } ${profile?.plan === plan ? 'ring-2 ring-primary' : ''}`}
          >
            {plan === 'premium' && (
              <div className="animate-gradient-border absolute inset-0" />
            )}
            <div className={`relative glass-card rounded-lg p-6 ${
              plan === 'premium' ? 'border-0' : ''
            }`}>
              <h3 className="font-display text-xl font-bold text-foreground">{PLANS[plan].name}</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {plan === 'premium' ? `$${PLANS[plan].price}` : '$0'}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {PLANS[plan].features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/10">
                      <Check className="h-2.5 w-2.5 text-success" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              {plan === 'premium' && profile?.plan !== 'premium' && (
                <div className="mt-4 space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email for early access"
                    className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleJoinWaitlist}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? <Spinner /> : <><Zap className="h-4 w-4" /> Join Premium Waitlist</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

export default BillingPage;
