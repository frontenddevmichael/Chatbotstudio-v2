import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ToolGuide from '@/components/ui/ToolGuide';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface LighthouseScore {
  id: string;
  chatbot_id: string;
  url: string;
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
  pwa: number | null;
  score_json: unknown;
  created_at: string;
}

const scoreColor = (value: number | null) => {
  if (value === null) return 'bg-muted';
  if (value >= 90) return 'bg-success';
  if (value >= 70) return 'bg-warning';
  return 'bg-destructive';
};

const scoreLabel = (value: number | null) => {
  if (value === null) return 'N/A';
  if (value >= 90) return 'Good';
  if (value >= 70) return 'Needs work';
  return 'Poor';
};

const LighthousePage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [scores, setScores] = useState<LighthouseScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!chatbotId) return;
    let cancelled = false;
    const fetchScores = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lighthouse_scores')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (!cancelled) {
          setScores(data ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch lighthouse scores:', err);
          setLoading(false);
        }
      }
    };
    fetchScores();
    return () => { cancelled = true; };
  }, [chatbotId]);

  const runAudit = async () => {
    if (!chatbotId || !url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    setAuditing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lighthouse-audit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chatbot_id: chatbotId, url: url.trim() }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Audit failed');
      }

      const result: LighthouseScore = await res.json();
      setScores((prev) => [result, ...prev]);
      toast.success('Lighthouse audit complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  const metrics: { key: keyof LighthouseScore; label: string }[] = [
    { key: 'performance', label: 'Performance' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'best_practices', label: 'Best Practices' },
    { key: 'seo', label: 'SEO' },
    { key: 'pwa', label: 'PWA' },
  ];

  return (
    <PageWrapper>
      <SEO title="Lighthouse Scores" noIndex />
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-semibold text-foreground mb-6">Lighthouse Performance</h1>

          <ToolGuide
            storageKey="walkthrough-lighthouse"
            title="How Lighthouse works"
            description="Run Google Lighthouse performance audits against your chatbot's embedded web pages. Get scored on performance, accessibility, best practices, SEO, and PWA support — then track changes over time."
            steps={[
              'Enter the full URL of the page where your chatbot is embedded (e.g., https://yoursite.com/contact).',
              'Click "Run Audit" — the audit takes 10-30 seconds to complete.',
              'Review your scores in five categories. Scores above 90 are good, 70-89 need work, below 70 is poor.',
              'Run audits regularly to track improvements. Each audit result is saved and displayed in a timeline.',
            ]}
          />

          <div className="mb-6 flex items-end gap-3 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex-1">
              <label htmlFor="audit-url" className="text-[13px] font-medium text-muted-foreground mb-1.5 block">
                URL to audit
              </label>
              <input
                id="audit-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-background px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={runAudit}
              disabled={auditing}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              {auditing ? 'Running...' : 'Run Audit'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-64 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, j) => (
                      <div key={j}>
                        <div className="h-3 w-16 rounded bg-muted mb-1.5" />
                        <div className="h-2 rounded-full bg-muted" />
                        <div className="mt-1 h-2 w-8 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : scores.length === 0 ? (
            <div className="rounded-[14px] border border-border bg-card p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-[13px] text-muted-foreground">No audits yet. Enter a URL and click "Run Audit".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scores.map((score) => (
                <motion.div
                  key={score.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[14px] border border-border bg-card p-5"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <a
                      href={score.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-medium text-primary hover:underline truncate max-w-[400px]"
                    >
                      {score.url}
                    </a>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                      {new Date(score.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {metrics.map(({ key, label }) => {
                      const value = score[key] as number | null;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-muted-foreground">{label}</span>
                            <span className="text-[12px] font-semibold tabular-nums">
                              {value !== null ? `${Math.round(value)}` : 'N/A'}
                            </span>
                          </div>
                          <Progress
                            value={value ?? 0}
                            className={`h-2 bg-muted [&>div]:transition-all [&>div]:duration-500 ${scoreColor(value)}`}
                          />
                          <span className={`mt-1 text-[10px] font-medium ${scoreColor(value).replace('bg-', 'text-')}`}>
                            {scoreLabel(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default LighthousePage;
