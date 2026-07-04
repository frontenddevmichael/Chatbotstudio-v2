import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ToolGuide from '@/components/ui/ToolGuide';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon, CheckIcon } from '@/components/ui/icons';
import { Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FlaskConical } from 'lucide-react';

interface Variant {
  id: string;
  chatbot_id: string;
  name: string;
  tone: string | null;
  welcome_message: string | null;
  ai_model: string | null;
  system_prompt_override: string | null;
  traffic_percentage: number;
  is_active: boolean;
  created_at: string | null;
}

interface AbTestResult {
  id: string;
  variant_id: string;
  chatbot_id: string;
  total_conversations: number;
  total_messages: number;
  avg_satisfaction: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string | null;
}

const useVariants = (chatbotId: string) => {
  return useQuery({
    queryKey: ['chatbot-variants', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_variants')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Variant[];
    },
    enabled: !!chatbotId,
  });
};

const useAbTestResults = (chatbotId: string) => {
  return useQuery({
    queryKey: ['ab-test-results', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data as AbTestResult[];
    },
    enabled: !!chatbotId,
  });
};

const trafficColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500'];

const ABTestingPage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: variants, isLoading } = useVariants(chatbotId!);
  const { data: results } = useAbTestResults(chatbotId!);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', tone: '', welcome_message: '', ai_model: '', traffic_percentage: 50 });

  const resetForm = () => {
    setForm({ name: '', tone: '', welcome_message: '', ai_model: '', traffic_percentage: 50 });
    setShowCreate(false);
    setEditId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string; tone: string; welcome_message: string; ai_model: string; traffic_percentage: number }) => {
      if (data.id) {
        const { error } = await supabase
          .from('chatbot_variants')
          .update({
            name: data.name,
            tone: data.tone || null,
            welcome_message: data.welcome_message || null,
            ai_model: data.ai_model || null,
            traffic_percentage: data.traffic_percentage,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('chatbot_variants').insert({
          chatbot_id: chatbotId,
          name: data.name,
          tone: data.tone || null,
          welcome_message: data.welcome_message || null,
          ai_model: data.ai_model || null,
          traffic_percentage: data.traffic_percentage,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-variants', chatbotId] });
      toast.success(editId ? 'Variant updated' : 'Variant created');
      resetForm();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to save variant'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chatbot_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-variants', chatbotId] });
      toast.success('Variant deleted');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete variant'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('chatbot_variants').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-variants', chatbotId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update variant'),
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Variant name is required');
      return;
    }
    saveMutation.mutate({
      id: editId || undefined,
      name: form.name.trim(),
      tone: form.tone.trim(),
      welcome_message: form.welcome_message.trim(),
      ai_model: form.ai_model.trim(),
      traffic_percentage: form.traffic_percentage,
    });
  };

  const handleEdit = (v: Variant) => {
    setEditId(v.id);
    setForm({
      name: v.name,
      tone: v.tone || '',
      welcome_message: v.welcome_message || '',
      ai_model: v.ai_model || '',
      traffic_percentage: v.traffic_percentage,
    });
    setShowCreate(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this variant? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  };

  const totalTraffic = (variants || []).reduce((sum, v) => sum + (v.is_active ? v.traffic_percentage : 0), 0);

  return (
    <PageWrapper>
      <SEO title="A/B Testing" noIndex />
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-foreground">A/B Testing</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Create and manage chatbot variants to optimize your conversations.
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <PlusIcon className="h-3.5 w-3.5" /> Create Variant
          </Button>
        </div>

        <ToolGuide
          storageKey="walkthrough-abtesting"
          title="How A/B Testing works"
          description="Create different versions of your chatbot (variants) with different tones, welcome messages, or AI models. Split traffic between variants to see which performs better."
          steps={[
            'Click "Create Variant" to make a new version of your chatbot. Give it a name like "Friendly Tone V2".',
            'Customize the variant: change the tone, welcome message, AI model, or system prompt. Each variant can be completely different.',
            'Set the traffic percentage — this controls how much visitor traffic goes to this variant vs the original (control). Active variants share traffic proportionally.',
            'Monitor performance in the stats section. Compare conversations, messages, and satisfaction scores across variants to pick the winner.',
          ]}
        />

        {/* Traffic split visualization */}
        {variants && variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[14px] font-semibold text-foreground">Traffic Split</h2>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              {variants.filter(v => v.is_active).length === 0 ? (
                <div className="w-full bg-muted flex items-center justify-center text-[11px] text-muted-foreground">
                  No active variants — 100% control traffic
                </div>
              ) : (
                variants.filter(v => v.is_active).map((v, i) => (
                  <div
                    key={v.id}
                    className={`${trafficColors[i % trafficColors.length]} flex items-center justify-center text-[11px] font-medium text-white transition-all`}
                    style={{ width: `${(v.traffic_percentage / Math.max(totalTraffic, 1)) * 100}%`, minWidth: v.traffic_percentage > 0 ? 'fit-content' : undefined }}
                  >
                    {v.traffic_percentage > 10 && (
                      <span className="px-1 truncate">{v.traffic_percentage}%</span>
                    )}
                  </div>
                ))
              )}
            </div>
            {totalTraffic < 100 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {100 - totalTraffic}% of traffic goes to the original (control) variant
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              {variants.filter(v => v.is_active).map((v, i) => (
                <div key={v.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${trafficColors[i % trafficColors.length]}`} />
                  {v.name}
                </div>
              ))}
              {totalTraffic < 100 && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />
                  Control (original)
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Create/Edit form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-[14px] font-medium text-foreground mb-4">
              {editId ? 'Edit Variant' : 'Create Variant'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Friendly Tone V2"
                  className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Tone</label>
                <input
                  type="text"
                  value={form.tone}
                  onChange={(e) => setForm(prev => ({ ...prev, tone: e.target.value }))}
                  placeholder="friendly, professional, casual..."
                  className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Welcome Message</label>
                <textarea
                  value={form.welcome_message}
                  onChange={(e) => setForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Hi! How can I help you today?"
                  rows={2}
                  className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">AI Model Override</label>
                <input
                  type="text"
                  value={form.ai_model}
                  onChange={(e) => setForm(prev => ({ ...prev, ai_model: e.target.value }))}
                  placeholder="google/gemini-2.5-flash"
                  className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">
                  Traffic Percentage: <span className="text-foreground font-semibold">{form.traffic_percentage}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.traffic_percentage}
                  onChange={(e) => setForm(prev => ({ ...prev, traffic_percentage: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  <CheckIcon className="h-3.5 w-3.5" /> {editId ? 'Update' : 'Create'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Variants list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="h-5 w-16 rounded-full bg-muted" />
                      <div className="h-5 w-20 rounded-full bg-muted" />
                      <div className="h-5 w-24 rounded-full bg-muted" />
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="h-3 w-28 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <div className="h-7 w-7 rounded-[6px] bg-muted" />
                    <div className="h-7 w-7 rounded-[6px] bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : variants?.length ? (
          <div className="space-y-3">
            {variants.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="rounded-[14px] border border-border bg-card p-5 transition-all hover:border-border/80"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-foreground">{v.name}</h3>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: v.id, is_active: !v.is_active })}
                        className={`inline-block h-1.5 w-1.5 rounded-full ${v.is_active ? 'bg-success' : 'bg-muted-foreground'}`}
                        title={v.is_active ? 'Active' : 'Inactive'}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {v.traffic_percentage}% traffic
                      </Badge>
                      {v.tone && (
                        <Badge variant="outline" className="text-[10px]">
                          Tone: {v.tone}
                        </Badge>
                      )}
                      {v.ai_model && (
                        <Badge variant="outline" className="text-[10px]">
                          Model: {v.ai_model}
                        </Badge>
                      )}
                      {v.welcome_message && (
                        <Badge variant="outline" className="text-[10px]">
                          Custom welcome
                        </Badge>
                      )}
                      {v.system_prompt_override && (
                        <Badge variant="outline" className="text-[10px]">
                          Custom prompt
                        </Badge>
                      )}
                    </div>
                    {v.welcome_message && (
                      <p className="mt-2 text-[12px] text-muted-foreground line-clamp-1">
                        Welcome: {v.welcome_message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Created {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Unknown'}
                    </p>

                    {/* A/B test results for this variant */}
                    {results && (() => {
                      const variantResults = results.filter(r => r.variant_id === v.id);
                      if (!variantResults.length) return null;
                      return (
                        <div className="mt-3 flex items-center gap-4 text-[12px]">
                          <span className="text-muted-foreground">
                            Conversations: <strong className="text-foreground">{variantResults.reduce((s, r) => s + r.total_conversations, 0)}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Messages: <strong className="text-foreground">{variantResults.reduce((s, r) => s + r.total_messages, 0)}</strong>
                          </span>
                          {variantResults.some(r => r.avg_satisfaction !== null) && (
                            <span className="text-muted-foreground">
                              Satisfaction: <strong className="text-foreground">
                                {(variantResults.reduce((s, r) => s + (r.avg_satisfaction ?? 0), 0) / variantResults.filter(r => r.avg_satisfaction !== null).length).toFixed(1)}
                              </strong>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={() => handleEdit(v)}
                      aria-label={`Edit ${v.name}`}
                      className="rounded-[6px] p-1.5 text-muted-foreground hover:bg-[hsl(var(--color-surface-3))] hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      aria-label={`Delete ${v.name}`}
                      className="rounded-[6px] p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-[14px] border border-border bg-card p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <FlaskConical className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-[14px] font-medium text-foreground">No variants yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Create your first A/B test variant to start optimizing.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ABTestingPage;
