import { useAuth } from '@/context/AuthContext';
import { PLANS, isPremium } from '@/lib/plans';
import { openFlutterwaveCheckout } from '@/lib/flutterwave';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckIcon, SuperchargeIcon } from '@/components/ui/icons';
import Spinner from '@/components/ui/Spinner';

const BillingPage = () => {
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const premium = isPremium(profile);

  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;
  const usageColor = usagePercent > 90 ? 'text-destructive' : usagePercent > 60 ? 'text-warning' : 'text-success';

  const handleUpgrade = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      const tx_ref = `cbs_${Date.now()}_${profile.id.slice(0, 8)}`;
      await openFlutterwaveCheckout({
        tx_ref,
        amount: 19.99,
        currency: 'USD',
        customer: {
          email: (await supabase.auth.getUser()).data.user?.email || '',
          name: profile.full_name || 'Valued Customer',
        },
        callback: async (response) => {
          if (response.status === 'successful') {
            const { error } = await supabase.functions.invoke('flutterwave-webhook', {
              body: {
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
                email: (await supabase.auth.getUser()).data.user?.email,
              },
            });
            if (error) {
              toast.error('Payment verified but activation failed. Contact support.');
            } else {
              toast.success('Welcome to Premium! Your account has been upgraded.');
              setTimeout(() => window.location.reload(), 1500);
            }
          }
        },
        onclose: () => {
          setSubmitting(false);
        },
      });
    } catch {
      toast.error('Payment could not be initiated. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFlwConfigured = !!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

  return (
    <PageWrapper>
      <SEO title="Upgrade to Premium" description="Unlock unlimited chatbots, advanced analytics, and more with ChatBot Studio Premium." />
      <h1 className="mb-6 text-2xl font-bold text-foreground">Billing</h1>

      {/* Current plan hero */}
      <div className="glass-card mb-6 rounded-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{premium ? 'Premium' : 'Free'}</p>
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
            className={`relative overflow-hidden rounded-[14px] ${
              plan === 'premium' ? 'p-[1px]' : ''
            } ${profile?.plan === plan ? 'ring-2 ring-primary' : ''}`}
          >
            {plan === 'premium' && (
              <div className="animate-gradient-border absolute inset-0" />
            )}
            <div className={`relative glass-card rounded-[14px] p-6 ${
              plan === 'premium' ? 'border-0' : ''
            }`}>
              <h3 className="text-xl font-bold text-foreground">{PLANS[plan].name}</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {plan === 'premium' ? `$${PLANS[plan].price}` : '$0'}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {PLANS[plan].features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/10">
                      <CheckIcon className="h-2.5 w-2.5 text-success" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              {plan === 'premium' && profile?.plan !== 'premium' && (
                <div className="mt-4">
                  {isFlwConfigured ? (
                    <button
                      onClick={handleUpgrade}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitting ? <Spinner /> : <><SuperchargeIcon className="h-4 w-4" /> Upgrade to Premium — $19.99</>}
                    </button>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Payments are being configured. Check back soon.
                    </p>
                  )}
                </div>
              )}
              {plan === 'premium' && profile?.plan === 'premium' && (
                <div className="mt-4">
                  <p className="text-center text-xs text-success">✓ Active</p>
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
