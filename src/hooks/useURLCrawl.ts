import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useURLCrawl() {
  const [crawling, setCrawling] = useState(false);

  const crawl = async (url: string): Promise<{ text: string; title: string } | null> => {
    setCrawling(true);
    try {
      const { data, error } = await supabase.functions.invoke('crawl-url', {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return null; }
      if (!data?.text || data.text.length < 50) {
        toast.error('Could not extract enough content from this page');
        return null;
      }
      return { text: data.text, title: data.title || '' };
    } catch (err) {
      console.error('URL crawl failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to crawl URL');
      return null;
    } finally {
      setCrawling(false);
    }
  };

  return { crawling, crawl };
}
