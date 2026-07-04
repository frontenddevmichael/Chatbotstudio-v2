import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChangelogEntry {
  id: string;
  chatbot_id: string;
  faq_id: string | null;
  action: 'create' | 'update' | 'delete' | 'rollback';
  field: string;
  old_value: string | null;
  new_value: string | null;
  source: 'manual' | 'autopilot';
  applied_at: string;
  rolled_back_at: string | null;
}

export function useChangelog(chatbotId: string | undefined | null) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChangelog = useCallback(async () => {
    if (!chatbotId) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('faq_changelog')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('applied_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries((data || []) as ChangelogEntry[]);
    } catch {
      toast.error('Failed to load changelog');
    } finally {
      setLoading(false);
    }
  }, [chatbotId]);

  const rollback = useCallback(async (entryId: string) => {
    try {
      const { error } = await supabase.functions.invoke('rollback-faq', {
        body: { changelog_id: entryId },
      });
      if (error) throw error;
      toast.success('Rollback successful');
      await fetchChangelog();
    } catch {
      toast.error('Rollback failed');
    }
  }, [fetchChangelog]);

  return { entries, loading, fetchChangelog, rollback };
}
