import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ, useSupercharge } from '@/hooks/useFAQs';
import { useChatbot } from '@/hooks/useChatbot';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { Trash2, Zap, Plus, Pencil, Check, X, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient } from '@tanstack/react-query';

const FAQManager = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot } = useChatbot(id!);
  const { data: faqs, isLoading } = useFAQs(id!);
  const createMutation = useCreateFAQ();
  const updateMutation = useUpdateFAQ();
  const deleteMutation = useDeleteFAQ();
  const superchargeMutation = useSupercharge();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [superchargingId, setSuperchargingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) { toast.error('Fill in both fields'); return; }
    try {
      await createMutation.mutateAsync({ chatbot_id: id!, question, answer });
      setQuestion(''); setAnswer('');
      toast.success('FAQ added');
    } catch { toast.error('Failed to add FAQ'); }
  };

  const handleStartEdit = (faq: { id: string; question: string; answer: string }) => {
    setEditingId(faq.id); setEditQuestion(faq.question); setEditAnswer(faq.answer);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) { toast.error('Fill in both fields'); return; }
    try {
      await updateMutation.mutateAsync({ id: editingId, chatbot_id: id!, question: editQuestion, answer: editAnswer });
      setEditingId(null);
      toast.success('FAQ updated');
    } catch { toast.error('Failed to update FAQ'); }
  };

  const handleSupercharge = async (faqId: string) => {
    setSuperchargingId(faqId);
    try {
      await superchargeMutation.mutateAsync(faqId);
      queryClient.invalidateQueries({ queryKey: ['faqs', id] });
      toast.success('⚡ FAQ Supercharged!');
    } catch { toast.error('Supercharge failed'); }
    finally { setSuperchargingId(null); }
  };

  const toggleSelect = (faqId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(faqId)) next.delete(faqId); else next.add(faqId);
      return next;
    });
  };

  const selectAll = () => {
    if (!faqs) return;
    if (selected.size === faqs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(faqs.map(f => f.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} FAQ(s)?`)) return;
    try {
      await Promise.all(Array.from(selected).map(faqId => deleteMutation.mutateAsync({ id: faqId, chatbot_id: id! })));
      setSelected(new Set());
      toast.success(`${selected.size} FAQ(s) deleted`);
    } catch { toast.error('Some deletes failed'); }
  };

  const handleBulkSupercharge = async () => {
    if (!selected.size) return;
    try {
      for (const faqId of selected) {
        await superchargeMutation.mutateAsync(faqId);
      }
      queryClient.invalidateQueries({ queryKey: ['faqs', id] });
      setSelected(new Set());
      toast.success(`⚡ ${selected.size} FAQ(s) supercharged!`);
    } catch { toast.error('Some supercharges failed'); }
  };

  const filteredFaqs = faqs?.filter(f =>
    !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";

  return (
    <PageWrapper>
      <SEO title={`FAQs — ${chatbot?.name || 'Chatbot'}`} noIndex />
      <h1 className="text-[22px] font-semibold text-foreground mb-6">FAQs — {chatbot?.name}</h1>

      {/* Add FAQ */}
      <div className="mb-6 space-y-3 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" className={inputClass} />
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" rows={3} className={inputClass} />
        <button
          onClick={handleAdd}
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 transition-all"
        >
          {createMutation.isPending ? <Spinner /> : <><Plus className="h-3.5 w-3.5" /> Add FAQ</>}
        </button>
      </div>

      {/* Search + Bulk actions */}
      {faqs && faqs.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] pl-9 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <button onClick={handleBulkSupercharge} className="inline-flex items-center gap-1 rounded-[8px] bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/20 transition-colors">
                <Zap className="h-3 w-3" /> Supercharge ({selected.size})
              </button>
              <button onClick={handleBulkDelete} className="inline-flex items-center gap-1 rounded-[8px] bg-destructive/10 px-3 py-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/20 transition-colors">
                <Trash2 className="h-3 w-3" /> Delete ({selected.size})
              </button>
            </div>
          )}
        </div>
      )}

      {/* FAQ list */}
      {isLoading ? (
        <div className="space-y-px rounded-[14px] border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card animate-pulse border-b border-border last:border-b-0" />)}
        </div>
      ) : !filteredFaqs?.length ? (
        <div className="rounded-[14px] border border-dashed border-border py-12 text-center">
          <span className="mb-2 inline-block text-3xl">📚</span>
          <p className="text-[13px] text-muted-foreground">{search ? 'No FAQs match your search.' : 'No FAQs yet. Add your first one above.'}</p>
        </div>
      ) : (
        <div className="rounded-[14px] border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
          {/* Select all header */}
          <div className="flex items-center gap-3 border-b border-border bg-[hsl(var(--color-surface-1))] px-4 py-2">
            <Checkbox
              checked={selected.size === filteredFaqs.length && filteredFaqs.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selected` : `${filteredFaqs.length} FAQ${filteredFaqs.length > 1 ? 's' : ''}`}
            </span>
          </div>
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="border-b border-border bg-card px-4 py-3.5 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={selected.has(faq.id)}
                    onCheckedChange={() => toggleSelect(faq.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === faq.id ? (
                      <div className="space-y-2">
                        <input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} className={inputClass} />
                        <textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} rows={2} className={inputClass} />
                      </div>
                    ) : (
                      <>
                        <p className="text-[14px] font-medium text-foreground">{faq.question}</p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">{faq.answer}</p>
                      </>
                    )}
                    {faq.variations?.length ? (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 rounded-[6px] bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Zap className="h-2.5 w-2.5" /> Supercharged
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {faq.variations.map((v, i) => (
                            <span key={i} className="rounded-[6px] bg-[hsl(var(--color-surface-3))] px-2 py-0.5 text-[11px] text-muted-foreground">{v}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {editingId === faq.id ? (
                    <>
                      <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="rounded-[6px] p-1.5 text-success hover:bg-success/10 transition-colors" title="Save">
                        {updateMutation.isPending ? <Spinner /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-[6px] p-1.5 text-muted-foreground hover:bg-[hsl(var(--color-surface-3))] transition-colors" title="Cancel">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleStartEdit(faq)} className="rounded-[6px] p-1.5 text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--color-surface-3))] transition-colors" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleSupercharge(faq.id)} disabled={superchargingId === faq.id} className={`rounded-[6px] p-1.5 transition-colors ${superchargingId === faq.id ? 'animate-pulse text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`} title="Supercharge">
                        <Zap className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { deleteMutation.mutate({ id: faq.id, chatbot_id: id! }, { onSuccess: () => toast.success('FAQ deleted') }); }} className="rounded-[6px] p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
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
