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
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Trash2, ToggleLeft, ToggleRight, GitBranch } from 'lucide-react';

interface OrchestrationRule {
  id: string;
  chatbot_id: string;
  name: string;
  condition_type: string;
  condition_value: string;
  target_chatbot_id: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface ConversationTransfer {
  id: string;
  conversation_id: string;
  from_chatbot_id: string;
  to_chatbot_id: string;
  reason: string;
  created_at: string;
}

interface Chatbot {
  id: string;
  name: string;
}

const CONDITION_TYPES = [
  { value: 'keyword', label: 'Keyword Match' },
  { value: 'persona', label: 'Persona Match' },
  { value: 'sentiment', label: 'Sentiment' },
  { value: 'always', label: 'Always Transfer' },
];

const OrchestrationPage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState<OrchestrationRule[]>([]);
  const [transfers, setTransfers] = useState<ConversationTransfer[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [currentBot, setCurrentBot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formConditionType, setFormConditionType] = useState('keyword');
  const [formConditionValue, setFormConditionValue] = useState('');
  const [formTargetChatbotId, setFormTargetChatbotId] = useState('');

  useEffect(() => {
    if (!chatbotId || !user) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);

      try {
        const { data: bot, error: botErr } = await supabase
          .from('chatbots')
          .select('id, name')
          .eq('id', chatbotId)
          .single();
        if (botErr) throw botErr;

        const { data: allBots, error: allBotsErr } = await supabase
          .from('chatbots')
          .select('id, name')
          .neq('id', chatbotId)
          .order('name');
        if (allBotsErr) throw allBotsErr;

        const { data: rulesData, error: rulesErr } = await supabase
          .from('orchestration_rules')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .order('priority', { ascending: true });
        if (rulesErr) throw rulesErr;

        const { data: transfersData, error: transfersErr } = await supabase
          .from('conversation_transfers')
          .select('*')
          .or(`from_chatbot_id.eq.${chatbotId},to_chatbot_id.eq.${chatbotId}`)
          .order('created_at', { ascending: false })
          .limit(20);
        if (transfersErr) throw transfersErr;

        if (!cancelled) {
          setCurrentBot(bot as Chatbot | null);
          setChatbots(allBots as Chatbot[] || []);
          setRules(rulesData as OrchestrationRule[] || []);
          setTransfers(transfersData as ConversationTransfer[] || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load orchestration data:', err);
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [chatbotId, user]);

  const handleCreate = async () => {
    if (!chatbotId || !formName.trim() || !formTargetChatbotId) {
      toast.error('Name and target chatbot are required');
      return;
    }
    const maxPriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) : -1;
    const { error } = await supabase.from('orchestration_rules').insert({
      chatbot_id: chatbotId,
      name: formName.trim(),
      condition_type: formConditionType,
      condition_value: formConditionValue.trim() || null,
      target_chatbot_id: formTargetChatbotId,
      priority: maxPriority + 1,
    });
    if (error) {
      toast.error(error.message || 'Failed to create rule');
    } else {
      toast.success('Rule created');
      setShowForm(false);
      setFormName('');
      setFormConditionValue('');
      setFormTargetChatbotId('');
      const { data } = await supabase
        .from('orchestration_rules')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('priority', { ascending: true });
      setRules(data as OrchestrationRule[] || []);
    }
  };

  const handleToggle = async (rule: OrchestrationRule) => {
    const { error } = await supabase
      .from('orchestration_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);
    if (error) {
      toast.error(error.message || 'Failed to toggle rule');
    } else {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('orchestration_rules').delete().eq('id', id);
    if (error) {
      toast.error(error.message || 'Failed to delete rule');
    } else {
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
    }
  };

  const handleMovePriority = async (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newRules.length) return;
    const temp = newRules[index].priority;
    newRules[index].priority = newRules[swapIndex].priority;
    newRules[swapIndex].priority = temp;
    [newRules[index], newRules[swapIndex]] = [newRules[swapIndex], newRules[index]];

    setRules(newRules);

    await Promise.all(
      newRules.map(rule =>
        supabase.from('orchestration_rules').update({ priority: rule.priority }).eq('id', rule.id)
      )
    );
  };

  if (loading) {
    return (
      <PageWrapper>
        <SEO title="Orchestration" noIndex />
        <div className="flex-1 min-w-0 max-w-3xl">
          <div className="mb-4 h-4 w-12 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          <div className="mb-3 h-6 w-56 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          <div className="mt-1 h-4 w-64 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          <div className="mt-6 space-y-6">
            <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-36 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                <div className="h-7 w-20 animate-pulse rounded-[10px] bg-[hsl(var(--color-surface-2))]" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-[10px] border border-border bg-[hsl(var(--color-surface-1))] px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="h-3 w-3 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                      <div className="h-3 w-3 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-36 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                      <div className="h-3 w-48 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                    </div>
                    <div className="h-5 w-5 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                    <div className="h-4 w-4 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="space-y-1">
                      <div className="h-3 w-52 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                      <div className="h-3 w-36 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                    </div>
                    <div className="h-3 w-28 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <SEO title="Multi-Bot Orchestration" noIndex />
      <div className="flex-1 min-w-0 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-[22px] font-semibold text-foreground">Multi-Bot Orchestration</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Route conversations between bots for {currentBot?.name || 'this chatbot'}.
          </p>
        </motion.div>

        <ToolGuide
          storageKey="walkthrough-orchestration"
          title="How Orchestration works"
          description="Route conversations between multiple chatbots based on keywords, visitor intent, or sentiment. Each rule defines a condition and which chatbot handles the conversation when that condition is met."
          steps={[
            'Create a rule by clicking "Add Rule" — give it a name and pick a condition type (keyword, persona, sentiment, or always).',
            'Set the condition value: keywords like "pricing,buy", a persona like "purchase_intent", or a sentiment score threshold.',
            'Select the target chatbot that will handle conversations matching this rule. Rules are checked in priority order (drag to reorder).',
            'Toggle rules on/off with the switch. Only active rules are evaluated during conversations.',
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
              <h2 className="text-[15px] font-semibold text-foreground">Orchestration Rules</h2>
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
                    placeholder="e.g. Route sales inquiries"
                    className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Condition Type</label>
                    <select
                      value={formConditionType}
                      onChange={(e) => setFormConditionType(e.target.value)}
                      className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {CONDITION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Target Chatbot</label>
                    <select
                      value={formTargetChatbotId}
                      onChange={(e) => setFormTargetChatbotId(e.target.value)}
                      className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Select chatbot...</option>
                      {chatbots.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {formConditionType !== 'always' && (
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground mb-1 block">
                      Condition Value {formConditionType === 'keyword' ? '(comma-separated keywords)' : formConditionType === 'persona' ? '(purchase_intent, support_seeking, etc.)' : '(positive, negative, neutral)'}
                    </label>
                    <input
                      type="text"
                      value={formConditionValue}
                      onChange={(e) => setFormConditionValue(e.target.value)}
                      placeholder={formConditionType === 'keyword' ? 'buy, price, support' : 'purchase_intent'}
                      className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}
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
                icon={<GitBranch className="h-8 w-8 text-muted-foreground/40" />}
                title="No routing rules configured"
                description="Create rules to route conversations between your chatbots."
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Rule
                  </button>
                }
              />
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-3 rounded-[10px] border border-border bg-[hsl(var(--color-surface-1))] px-4 py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMovePriority(index, 'up')}
                        disabled={index === 0}
                        aria-label="Move rule up"
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleMovePriority(index, 'down')}
                        disabled={index === rules.length - 1}
                        aria-label="Move rule down"
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{rule.name || 'Unnamed Rule'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {CONDITION_TYPES.find(t => t.value === rule.condition_type)?.label || rule.condition_type}
                        {rule.condition_value ? `: ${rule.condition_value}` : ''} → {chatbots.find(b => b.id === rule.target_chatbot_id)?.name || 'Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(rule)}
                      aria-label="Toggle rule"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={rule.is_active ? 'Disable' : 'Enable'}
                    >
                      {rule.is_active ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      aria-label="Delete rule"
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
            <h2 className="text-[15px] font-semibold text-foreground mb-4">Transfer History</h2>
            {transfers.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No transfers yet.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {transfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-[12px] text-foreground">
                        {t.from_chatbot_id === chatbotId ? '→ Transferred to ' : '← Received from '}
                        <span className="font-medium">
                          {chatbots.find(b => b.id === (t.from_chatbot_id === chatbotId ? t.to_chatbot_id : t.from_chatbot_id))?.name || 'Unknown'}
                        </span>
                      </p>
                      {t.reason && <p className="text-[11px] text-muted-foreground mt-0.5">{t.reason}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-3">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
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

export default OrchestrationPage;
