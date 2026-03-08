import { isPremium } from '@/lib/plans';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

const AdBanner = () => {
  const { profile } = useAuth();
  const { data: ad } = useQuery({
    queryKey: ['ads', 'banner'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .eq('placement', 'banner')
        .limit(1)
        .single();
      return data;
    },
  });

  if (isPremium(profile) || !ad) return null;

  return (
    <a
      href={ad.cta_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{ad.title}</p>
        <p className="text-xs text-muted-foreground">{ad.description}</p>
      </div>
      {ad.cta_text && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary">
          {ad.cta_text} <ExternalLink className="h-3 w-3" />
        </span>
      )}
    </a>
  );
};

export default AdBanner;
