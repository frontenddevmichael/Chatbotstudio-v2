export const PLANS = {
  free: {
    name: 'Free',
    chatbotLimit: 1,
    messageLimit: 500,
    features: [
      '1 chatbot',
      '500 messages/month',
      'Basic analytics',
      'ChatBot Studio branding',
      'Ads in dashboard',
    ],
  },
  premium: {
    name: 'Premium',
    chatbotLimit: 10,
    messageLimit: 10000,
    price: 19.99,
    features: [
      'Up to 10 chatbots',
      '10,000 messages/month',
      'Custom branding',
      'Advanced analytics',
      'Ad-free dashboard',
      'Priority support',
    ],
  },
} as const;

export type Plan = 'free' | 'premium';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  stripe_customer_id: string | null;
  monthly_message_count: number | null;
  message_limit: number | null;
  created_at: string | null;
}

export const isPremium = (profile: Profile | null): boolean =>
  profile?.plan === 'premium';

export const canCreateChatbot = (profile: Profile | null, currentCount: number): boolean => {
  const limit = isPremium(profile) ? PLANS.premium.chatbotLimit : PLANS.free.chatbotLimit;
  return currentCount < limit;
};

export const hasReachedMessageLimit = (profile: Profile | null): boolean => {
  if (!profile) return false;
  return (profile.monthly_message_count ?? 0) >= (profile.message_limit ?? 500);
};

export const isNearMessageLimit = (profile: Profile | null): boolean => {
  if (!profile) return false;
  const pct = (profile.monthly_message_count ?? 0) / (profile.message_limit ?? 500);
  return pct >= 0.8 && pct < 1;
};
