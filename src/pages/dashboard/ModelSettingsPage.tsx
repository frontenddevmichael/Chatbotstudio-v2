import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ToolGuide from '@/components/ui/ToolGuide';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface AiModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  supports_vision: boolean;
  is_active: boolean;
}

interface Chatbot {
  id: string;
  name: string;
  ai_model: string;
  fallback_model: string | null;
  routing_strategy: string;
  user_id: string;
}

const strategies = [
  { value: 'single', label: 'Single Model', desc: 'Use one model for all messages' },
  { value: 'fallback', label: 'Fallback', desc: 'Try primary model, auto-fallback on failure' },
  { value: 'complexity', label: 'Complexity-based', desc: 'Use smarter model for complex queries' },
];

const ModelSettingsPage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [models, setModels] = useState<AiModel[]>([]);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const [aiModel, setAiModel] = useState('');
  const [fallbackModel, setFallbackModel] = useState('');
  const [routingStrategy, setRoutingStrategy] = useState('single');

  useEffect(() => {
    if (!chatbotId) return;
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const [{ data: modelsData, error: modelsErr }, { data: bot, error: botErr }] = await Promise.all([
          supabase.from('ai_models').select('*').eq('is_active', true).order('display_name'),
          supabase.from('chatbots').select('id, name, ai_model, fallback_model, routing_strategy, user_id').eq('id', chatbotId).single(),
        ]);
        if (modelsErr) throw modelsErr;
        if (botErr) throw botErr;

        if (!cancelled) {
          setModels(modelsData ?? []);
          if (bot) {
            setChatbot(bot as Chatbot);
            setAiModel(bot.ai_model || 'google/gemini-2.5-flash');
            setFallbackModel(bot.fallback_model || '');
            setRoutingStrategy(bot.routing_strategy || 'single');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load model settings:', err);
          setLoading(false);
        }
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [chatbotId]);

  const handleSave = async () => {
    if (!chatbotId || !user) return;
    setSaving(true);
    const updates: Record<string, unknown> = {
      ai_model: aiModel,
      routing_strategy: routingStrategy,
    };
    if (routingStrategy !== 'single') {
      updates.fallback_model = fallbackModel || null;
    } else {
      updates.fallback_model = null;
    }
    const { error } = await supabase
      .from('chatbots')
      .update(updates)
      .eq('id', chatbotId);
    if (error) {
      toast.error(error.message || 'Failed to save model settings');
    } else {
      toast.success('Model settings saved');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <PageWrapper>
        <SEO title="Model Settings" noIndex />
        <div className="flex-1 min-w-0 max-w-2xl">
          <div className="mb-4 h-4 w-12 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          <div className="mb-6 h-6 w-44 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          <div className="mt-1 h-4 w-64 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
        <ToolGuide
          storageKey="walkthrough-model-settings"
          title="How Model Settings works"
          description="Choose which AI model powers your chatbot, set a fallback model if the primary fails, and pick a routing strategy for handling different types of queries."
          steps={[
            'Select a primary AI model from the dropdown — this is the default model your chatbot uses for all conversations.',
            'Choose a routing strategy: Single Model (one model for everything), Fallback (auto-switch on failure), or Complexity-based (use smarter models for harder questions).',
            'If using Fallback or Complexity, pick a secondary model. Toggle advanced options to configure further.',
            'Click "Save Model Settings" to apply changes. The new model takes effect immediately for new conversations.',
          ]}
        />
        <div className="mt-6 space-y-5">
            <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="mb-3 h-4 w-32 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              <div className="mb-3 h-3 w-56 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              <div className="h-10 w-full animate-pulse rounded-[10px] bg-[hsl(var(--color-surface-2))]" />
            </div>
            <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-4 w-28 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                  <div className="h-3 w-44 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                </div>
                <div className="h-7 w-14 animate-pulse rounded-[8px] bg-[hsl(var(--color-surface-2))]" />
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1.5 h-3.5 w-24 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                  <div className="h-10 w-full animate-pulse rounded-[10px] bg-[hsl(var(--color-surface-2))]" />
                </div>
                <div>
                  <div className="mb-1.5 h-3.5 w-36 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                  <div className="h-10 w-full animate-pulse rounded-[10px] bg-[hsl(var(--color-surface-2))]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <SEO title="Model Settings" noIndex />
      <div className="flex-1 min-w-0 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-[22px] font-semibold text-foreground">
            Model Settings
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Configure the AI model used by {chatbot?.name || 'this chatbot'}.
          </p>
        </motion.div>

        <div className="mt-6 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <label htmlFor="ai-model" className="text-[13px] font-medium text-foreground mb-1.5 block">
              Primary AI Model
            </label>
            <p className="text-[11px] text-muted-foreground mb-3">
              Select the model that powers your chatbot's responses.
            </p>
            <div className="relative">
              <select
                id="ai-model"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full appearance-none rounded-[10px] border border-border bg-background px-3.5 py-2.5 pr-10 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.display_name} ({m.provider})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-medium text-foreground">Advanced Routing</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Configure fallback models and routing strategies.
                </p>
              </div>
              <button
                onClick={() => setAdvanced(!advanced)}
                className="rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                {advanced ? 'Hide' : 'Show'}
              </button>
            </div>

            {advanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="routing-strategy" className="text-[13px] font-medium text-foreground mb-1.5 block">
                    Routing Strategy
                  </label>
                  <div className="relative">
                    <select
                      id="routing-strategy"
                      value={routingStrategy}
                      onChange={(e) => setRoutingStrategy(e.target.value)}
                      className="w-full appearance-none rounded-[10px] border border-border bg-background px-3.5 py-2.5 pr-10 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {strategies.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {strategies.find((s) => s.value === routingStrategy)?.desc}
                  </p>
                </div>

                {routingStrategy !== 'single' && (
                  <div>
                    <label htmlFor="fallback-model" className="text-[13px] font-medium text-foreground mb-1.5 block">
                      Fallback / Secondary Model
                    </label>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      {routingStrategy === 'fallback'
                        ? 'Used when the primary model fails (rate limit, payment required, or server error).'
                        : 'Used for short or simple queries (≤100 chars, ≤5 messages).'}
                    </p>
                    <div className="relative">
                      <select
                        id="fallback-model"
                        value={fallbackModel}
                        onChange={(e) => setFallbackModel(e.target.value)}
                        className="w-full appearance-none rounded-[10px] border border-border bg-background px-3.5 py-2.5 pr-10 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select a fallback model</option>
                        {models.map((m) => (
                          <option key={m.id} value={m.name} disabled={m.name === aiModel}>
                            {m.display_name} ({m.provider}){m.name === aiModel ? ' — currently primary' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-[10px] border border-border px-5 py-2.5 text-[13px] font-medium text-foreground transition-all hover:bg-[hsl(var(--color-surface-1))] active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ModelSettingsPage;
