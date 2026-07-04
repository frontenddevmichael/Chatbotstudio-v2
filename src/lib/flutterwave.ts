const FLW_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

interface FlutterwaveConfig {
  tx_ref: string;
  amount: number;
  currency?: string;
  customer: { email: string; name: string };
  callback: (response: { transaction_id: string; tx_ref: string; status: string }) => void;
  onclose?: () => void;
}

function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave SDK'));
    document.body.appendChild(script);
  });
}

export async function openFlutterwaveCheckout(config: FlutterwaveConfig) {
  if (!FLW_PUBLIC_KEY) {
    console.warn('Flutterwave public key not configured');
    return;
  }
  await loadFlutterwaveScript();
  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: config.tx_ref,
    amount: config.amount,
    currency: config.currency || 'USD',
    payment_options: 'card, mobilemoney, ussd, banktransfer, account, barter',
    customer: config.customer,
    callback: config.callback,
    onclose: config.onclose || (() => {}),
    customizations: {
      title: 'ChatBot Studio',
      description: 'Premium Plan - Unlimited chatbots & more',
      logo: 'https://rtnhlmmgvvfupbibyrhu.supabase.co/storage/v1/object/public/assets/logo.png',
    },
  });
}
