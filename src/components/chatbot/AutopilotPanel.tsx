import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChangelog } from '@/hooks/useChangelog';
import { toast } from 'sonner';
import Spinner from '@/components/ui/Spinner';
import { Clock, RotateCcw, Sparkles, Trash2 } from 'lucide-react';

interface AutopilotPanelProps {
  chatbotId: string;
  onFaqsChanged?: () => void;
}

export default function AutopilotPanel({ chatbotId, onFaqsChanged }: AutopilotPanelProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ faqs_created: number; analyzed_conversations: number } | null>(null);
  const { entries, loading: changelogLoading, fetchChangelog, rollback } = useChangelog(chatbotId);

  useEffect(() => { fetchChangelog(); }, [fetchChangelog]);

  const handleRunAutopilot = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('autopilot', {
        body: { chatbot_id: chatbotId },
      });
      if (error) throw error;
      if (data.info === 'no_recent_conversations') {
        toast.info('No recent conversations to analyze');
      } else if (data.info === 'no_new_faqs_needed') {
        toast.success('All common questions are already covered!');
      } else {
        toast.success(`Autopilot created ${data.faqs_created} new FAQ(s)`);
        onFaqsChanged?.();
      }
      setResult(data);
      await fetchChangelog();
    } catch {
      toast.error('Autopilot analysis failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRollback = async (entryId: string) => {
    await rollback(entryId);
    onFaqsChanged?.();
  };

  const autopilotEntries = entries.filter(e => e.source === 'autopilot' && !e.rolled_back_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Health Autopilot
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Analyzes conversations and auto-adds missing FAQs
          </p>
        </div>
        <button
          onClick={handleRunAutopilot}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? <Spinner /> : <Sparkles className="h-3.5 w-3.5" />}
          {running ? 'Analyzing...' : 'Run Autopilot'}
        </button>
      </div>

      {result && result.faqs_created > 0 && (
        <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs text-success">
          Created {result.faqs_created} FAQ(s) from {result.analyzed_conversations} conversations
        </div>
      )}

      {autopilotEntries.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Recent Autopilot Changes
          </p>
          {autopilotEntries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {entry.new_value?.split('\n')[0]?.replace(/^Q:\s*/i, '') || 'FAQ entry'}
                </p>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.applied_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRollback(entry.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Rollback this change"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            All Changes
          </p>
          {entries.map((entry) => (
            <div key={entry.id} className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 ${
              entry.rolled_back_at ? 'border-border/50 opacity-50' : 'border-border'
            }`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium uppercase ${
                    entry.action === 'create' ? 'text-success' :
                    entry.action === 'delete' ? 'text-destructive' :
                    entry.action === 'rollback' ? 'text-warning' : 'text-primary'
                  }`}>{entry.action}</span>
                  <span className="text-[10px] text-muted-foreground">{entry.source}</span>
                  {entry.rolled_back_at && (
                    <span className="text-[10px] text-warning">(rolled back)</span>
                  )}
                </div>
                <p className="truncate text-[12px] text-foreground mt-0.5">
                  {entry.new_value?.split('\n')[0]?.replace(/^Q:\s*/i, '') || entry.old_value?.split('\n')[0]?.replace(/^Q:\s*/i, '') || 'FAQ'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(entry.applied_at).toLocaleString()}
                </p>
              </div>
              {!entry.rolled_back_at && entry.source !== 'autopilot' && (
                <button
                  onClick={() => handleRollback(entry.id)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Rollback"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !changelogLoading && (
        <p className="text-center text-xs text-muted-foreground py-4">
          No changes yet. Run Autopilot to analyze conversations and generate FAQs.
        </p>
      )}
    </div>
  );
}
