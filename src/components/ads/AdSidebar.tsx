import { isPremium } from '@/lib/plans';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

const AdSidebar = () => {
  const { profile } = useAuth();
  const { data: ads } = useQuery({
    queryKey: ['ads', 'sidebar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .eq('placement', 'sidebar')
        .limit(3);
      return data ?? [];
    },
  });

  if (isPremium(profile) || !ads?.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sponsored</p>
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={ad.cta_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
        >
          <p className="text-sm font-semibold text-foreground">{ad.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ad.description}</p>
          {ad.cta_text && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
              {ad.cta_text} <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default AdSidebar;
