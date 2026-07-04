import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Spinner from '@/components/ui/Spinner';
import { Plus, Trash2, Globe } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  chatbot_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_sent_at: string | null;
  last_error: string | null;
}

const EVENT_OPTIONS = [
  { value: 'message.created', label: 'Message Sent' },
  { value: 'conversation.created', label: 'New Conversation' },
];

export default function WebhookSettings({ chatbotId }: { chatbotId: string }) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['message.created']);
  const [saving, setSaving] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEndpoints((data || []) as WebhookEndpoint[]);
    } catch {
      // Table may not exist yet
    } finally {
      setLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  const handleAdd = async () => {
    if (!newUrl.startsWith('http')) { toast.error('URL must start with http:// or https://'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('webhook_endpoints').insert({
        chatbot_id: chatbotId,
        url: newUrl,
        events: newEvents,
      });
      if (error) throw error;
      toast.success('Webhook added');
      setNewUrl('');
      await fetchEndpoints();
    } catch { toast.error('Failed to add webhook'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
      if (error) throw error;
      await fetchEndpoints();
    } catch { toast.error('Failed to delete webhook'); }
  };

  const toggleEvent = (event: string) => {
    setNewEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event],
    );
  };

  if (loading) return <div className="flex justify-center py-4"><Spinner className="h-4 w-4" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Outbound Webhooks</h3>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Send real-time events to your own endpoint when conversations happen.
      </p>

      {/* Add new */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://your-app.com/webhook"
            className="w-full rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="mt-1 flex gap-2">
            {EVENT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEvents.includes(opt.value)}
                  onChange={() => toggleEvent(opt.value)}
                  className="rounded"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !newUrl}
          className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Spinner className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </div>

      {/* List */}
      {endpoints.map(ep => (
        <div key={ep.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground">{ep.url}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{ep.events.join(', ')}</span>
              {ep.last_error && (
                <span className="text-[10px] text-destructive">Error: {ep.last_error}</span>
              )}
              {ep.last_sent_at && !ep.last_error && (
                <span className="text-[10px] text-success">Delivered</span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleDelete(ep.id)}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {endpoints.length === 0 && (
        <p className="text-center text-[11px] text-muted-foreground py-2">No webhooks configured yet.</p>
      )}
    </div>
  );
}
