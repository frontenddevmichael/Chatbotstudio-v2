import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFAQs, useCreateFAQ, useDeleteFAQ, useSupercharge } from '@/hooks/useFAQs';
import { useChatbot } from '@/hooks/useChatbot';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { Trash2, Zap, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const FAQManager = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot } = useChatbot(id!);
  const { data: faqs, isLoading } = useFAQs(id!);
  const createMutation = useCreateFAQ();
  const deleteMutation = useDeleteFAQ();
  const superchargeMutation = useSupercharge();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [superchargingId, setSuperchargingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) { toast.error('Fill in both fields'); return; }
    try {
      await createMutation.mutateAsync({ chatbot_id: id!, question, answer });
      setQuestion('');
      setAnswer('');
      toast.success('FAQ added');
    } catch {
      toast.error('Failed to add FAQ');
    }
  };

  const handleSupercharge = async (faqId: string) => {
    setSuperchargingId(faqId);
    try {
      await superchargeMutation.mutateAsync(faqId);
      queryClient.invalidateQueries({ queryKey: ['faqs', id] });
      toast.success('⚡ FAQ Supercharged!');
    } catch {
      toast.error('Supercharge failed');
    } finally {
      setSuperchargingId(null);
    }
  };

  return (
    <PageWrapper>
      <SEO title={`FAQs - ${chatbot?.name || 'Chatbot'}`} noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
        FAQs — {chatbot?.name}
      </h1>

      {/* Add FAQ form */}
      <div className="mb-6 space-y-3 rounded-lg border border-border bg-card p-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question"
          className="w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
          rows={3}
          className="w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createMutation.isPending ? <Spinner /> : <><Plus className="h-4 w-4" /> Add FAQ</>}
        </button>
      </div>

      {/* FAQ list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : !faqs?.length ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
          <span className="mb-2 inline-block text-4xl">📚</span>
          <p className="text-sm text-muted-foreground">No FAQs yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                  {faq.variations?.length ? (
                    <div className="mt-2">
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Zap className="h-2.5 w-2.5" /> Supercharged
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {faq.variations.map((v, i) => (
                          <span key={i} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{v}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSupercharge(faq.id)}
                    disabled={superchargingId === faq.id}
                    className={`rounded p-1.5 transition-colors ${
                      superchargingId === faq.id ? 'animate-pulse-glow text-primary' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                    title="Supercharge with AI"
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      deleteMutation.mutate({ id: faq.id, chatbot_id: id! }, {
                        onSuccess: () => toast.success('FAQ deleted'),
                      });
                    }}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default FAQManager;
