import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ToolGuide from '@/components/ui/ToolGuide';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import EmptyState from '@/components/ui/illustrations/EmptyState';
import { ArrowLeft, Plus, ToggleLeft, ToggleRight, Trash2, Mail } from 'lucide-react';

interface FollowUpRule {
  id: string;
  chatbot_id: string;
  name: string;
  trigger_type: string;
  trigger_delay_hours: number;
  email_subject: string;
  email_body: string;
  is_active: boolean;
  created_at: string;
}

interface FollowUpLog {
  id: string;
  rule_id: string;
  conversation_id: string;
  visitor_email: string;
  sent_at: string;
  opened_at: string;
  clicked_at: string;
  status: string;
}

const TRIGGER_TYPES = [
  { value: 'no_response', label: 'No Response' },
  { value: 'after_conversation', label: 'After Conversation' },
  { value: 'keyword_detected', label: 'Keyword Detected' },
  { value: 'abandoned_cart', label: 'Abandoned Cart' },
];

const FollowUpEmailsPage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [logs, setLogs] = useState<FollowUpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTriggerType, setFormTriggerType] = useState('no_response');
  const [formDelay, setFormDelay] = useState(24);
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');

  useEffect(() => {
    if (!chatbotId) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);

      try {
        const { data: rulesData, error: rulesErr } = await supabase
          .from('follow_up_rules')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .order('created_at', { ascending: false });
        if (rulesErr) throw rulesErr;

        const ruleIds = (rulesData || []).map(r => r.id);
        let logsData: FollowUpLog[] | null = [];
        if (ruleIds.length > 0) {
          const { data, error: logsErr } = await supabase
            .from('follow_up_log')
            .select('*')
            .in('rule_id', ruleIds)
            .order('sent_at', { ascending: false })
            .limit(50);
          if (logsErr) throw logsErr;
          logsData = data;
        }

        if (!cancelled) {
          setRules(rulesData as FollowUpRule[] || []);
          setLogs(logsData as FollowUpLog[] || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load follow-up rules:', err);
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [chatbotId]);

  const handleCreate = async () => {
    if (!chatbotId || !formName.trim() || !formSubject.trim() || !formBody.trim()) {
      toast.error('Name, subject, and body are required');
      return;
    }
    const { error } = await supabase.from('follow_up_rules').insert({
      chatbot_id: chatbotId,
      name: formName.trim(),
      trigger_type: formTriggerType,
      trigger_delay_hours: formDelay,
      email_subject: formSubject.trim(),
      email_body: formBody.trim(),
    });
    if (error) {
      toast.error(error.message || 'Failed to create follow-up rule');
    } else {
      toast.success('Follow-up rule created');
      setShowForm(false);
      setFormName('');
      setFormSubject('');
      setFormBody('');
      const { data } = await supabase
        .from('follow_up_rules')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });
      setRules(data as FollowUpRule[] || []);
    }
  };

  const handleToggle = async (rule: FollowUpRule) => {
    const { error } = await supabase
      .from('follow_up_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);
    if (error) {
      toast.error(error.message || 'Failed to toggle rule');
    } else {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('follow_up_rules').delete().eq('id', id);
    if (error) {
      toast.error(error.message || 'Failed to delete rule');
    } else {
      setRules(prev => prev.filter(r => r.id !== id));
      setLogs(prev => prev.filter(l => l.rule_id !== id));
      toast.success('Rule deleted');
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <SEO title="Follow-Up Emails" noIndex />
        <div className="flex-1 min-w-0 max-w-3xl">
          <div className="mb-4 h-4 w-12 rounded bg-muted animate-pulse" />
          <div className="mb-4">
            <div className="h-6 w-64 rounded bg-muted animate-pulse" />
            <div className="mt-1 h-4 w-80 rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[10px] border border-border bg-[hsl(var(--color-surface-1))] px-4 py-3 mb-2">
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="flex-1">
                  <div className="h-3.5 w-40 rounded bg-muted" />
                  <div className="mt-1 h-3 w-56 rounded bg-muted" />
                </div>
                <div className="h-5 w-5 rounded bg-muted" />
                <div className="h-4 w-4 rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="h-4 w-28 rounded bg-muted mb-4" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <div className="h-3 w-48 rounded bg-muted" />
                  <div className="mt-1 h-3 w-32 rounded bg-muted" />
                </div>
                <div className="h-5 w-14 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      sent: 'bg-info/10 text-info',
      opened: 'bg-success/10 text-success',
      clicked: 'bg-success/10 text-success',
      failed: 'bg-destructive/10 text-destructive',
    };
    return `px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`;
  };

  return (
    <PageWrapper>
      <SEO title="Follow-Up Emails" noIndex />
      <div className="flex-1 min-w-0 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-[22px] font-semibold text-foreground">Autonomous Follow-Up Emails</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Automatically follow up with visitors based on conversation triggers.
          </p>
        </motion.div>

        <ToolGuide
          storageKey="walkthrough-followup"
          title="How Follow-Up Emails works"
          description="Automatically send follow-up emails to visitors based on conversation triggers. Each rule defines when to send, what to send, and how long to wait before sending."
          steps={[
            'Click "Add Rule" to create a new follow-up sequence. Give it a name like "Abandoned cart follow-up".',
            'Choose a trigger: No Response (visitor stopped replying), After Conversation (conversation ended), Keyword Detected (specific words mentioned), or Abandoned Cart (cart not completed).',
            'Set the delay in hours — how long to wait before sending the email. Then write the subject line and email body.',
            'Created rules appear in the list. Use toggle to enable/disable, delete to remove. Sent emails are logged in the Follow-Up Log panel.',
          ]}
        />
        <div className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-foreground">Follow-Up Rules</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </button>
            </div>

            {showForm && (
              <div className="mb-4 rounded-[12px] border border-border bg-[hsl(var(--color-surface-1))] p-4 space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Rule Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Abandoned cart follow-up"
                    className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Trigger Type</label>
                    <select
                      value={formTriggerType}
                      onChange={(e) => setFormTriggerType(e.target.value)}
                      className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {TRIGGER_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Delay (hours)</label>
                    <input
                      type="number"
                      value={formDelay}
                      onChange={(e) => setFormDelay(Number(e.target.value))}
                      min={1}
                      max={720}
                      className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Email Subject</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Subject line"
                    className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Email Body</label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Write your email body..."
                    rows={4}
                    className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCreate}
                    className="rounded-[8px] bg-primary px-4 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Create Rule
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-[8px] border border-border px-4 py-1.5 text-[12px] font-medium text-foreground hover:bg-[hsl(var(--color-surface-1))] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {rules.length === 0 ? (
              <EmptyState
                icon={<Mail className="h-8 w-8 text-muted-foreground/40" />}
                title="No follow-up emails configured"
                description="Create automated follow-up emails to re-engage your visitors."
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Email
                  </button>
                }
              />
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-3 rounded-[10px] border border-border bg-[hsl(var(--color-surface-1))] px-4 py-3"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{rule.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}
                        {' · '}{rule.trigger_delay_hours}h delay
                        {rule.email_subject ? ` · "${rule.email_subject}"` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(rule)}
                      aria-label="Toggle follow-up email"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={rule.is_active ? 'Disable' : 'Enable'}
                    >
                      {rule.is_active ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      aria-label="Delete follow-up rule"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <h2 className="text-[15px] font-semibold text-foreground mb-4">Follow-Up Log</h2>
            {logs.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No follow-up emails sent yet.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground">
                        To: <span className="font-medium">{log.visitor_email}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'Pending'}
                        {log.opened_at && ` · Opened: ${new Date(log.opened_at).toLocaleString()}`}
                        {log.clicked_at && ` · Clicked: ${new Date(log.clicked_at).toLocaleString()}`}
                      </p>
                    </div>
                    <span className={statusBadge(log.status)}>{log.status}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default FollowUpEmailsPage;
