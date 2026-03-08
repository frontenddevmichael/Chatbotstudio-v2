import { useAuth } from '@/context/AuthContext';
import { PLANS, isPremium } from '@/lib/plans';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
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

  const handleJoinWaitlist = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
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
      <SEO title="Upgrade to Premium" description="Unlock unlimited chatbots, advanced analytics, and more." />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Billing</h1>

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Current Plan</p>
        <p className="font-display text-lg font-bold text-foreground">{premium ? 'Premium' : 'Free'}</p>
        <p className="text-xs text-muted-foreground">
          {profile?.monthly_message_count ?? 0} / {profile?.message_limit ?? 500} messages used this month
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(['free', 'premium'] as const).map((plan) => (
          <div
            key={plan}
            className={`rounded-lg border p-6 ${
              plan === 'premium' ? 'border-primary bg-primary/5' : 'border-border bg-card'
            } ${profile?.plan === plan ? 'ring-2 ring-primary' : ''}`}
          >
            <h3 className="font-display text-xl font-bold text-foreground">{PLANS[plan].name}</h3>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {plan === 'premium' ? `$${PLANS[plan].price}` : '$0'}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-4 space-y-2">
              {PLANS[plan].features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
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
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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
        ))}
      </div>
    </PageWrapper>
  );
};

export default BillingPage;
