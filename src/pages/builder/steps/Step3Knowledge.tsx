import { Upload, Trash2, Wand2, FileText } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { parseFAQFile, useAIGenerateFAQs, type FAQPair } from '../hooks/useFAQImport';
import { toast } from 'sonner';

interface Props {
  faqs: FAQPair[];
  setFaqs: (updater: (prev: FAQPair[]) => FAQPair[]) => void;
  inputClass: string;
}

const Step3Knowledge = ({ faqs, setFaqs, inputClass }: Props) => {
  const { generating, generate } = useAIGenerateFAQs();

  const addFAQ = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
  const removeFAQ = (i: number) => setFaqs(prev => prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i));
  const updateField = (i: number, field: 'question' | 'answer', value: string) =>
    setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = await parseFAQFile(file);
    if (parsed.length) {
      setFaqs(prev => [...prev.filter(f => f.question || f.answer), ...parsed]);
      toast.success(`Imported ${parsed.length} FAQs`);
    } else toast.error('No FAQs found in file');
  };

  const handleAIGenerate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const generated = await generate(file);
    if (generated.length) setFaqs(prev => [...prev.filter(f => f.question || f.answer), ...generated]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">Teach your chatbot about your business</p>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Upload className="h-3 w-3" /> Import
          <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="rounded-[14px] border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-[10px] bg-primary/10 p-2">
            <Wand2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground">Auto-Generate FAQs</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Upload a company document (.txt, .csv) and AI will generate FAQs automatically</p>
            <label className={`mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97] ${generating ? 'opacity-50 pointer-events-none' : ''}`}>
              {generating ? (<><Spinner className="h-3 w-3" /> Generating...</>) : (<><FileText className="h-3 w-3" /> Upload Document</>)}
              <input type="file" accept=".txt,.csv" onChange={handleAIGenerate} className="hidden" disabled={generating} />
            </label>
          </div>
        </div>
      </div>

      {faqs.map((faq, i) => (
        <div key={i} className="space-y-2 rounded-[14px] border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">FAQ {i + 1}</span>
            {faqs.length > 1 && (
              <button type="button" onClick={() => removeFAQ(i)} aria-label={`Remove FAQ ${i + 1}`} className="rounded-[6px] p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <input type="text" value={faq.question} onChange={(e) => updateField(i, 'question', e.target.value)} placeholder="Question" maxLength={500} className={inputClass} />
          <textarea value={faq.answer} onChange={(e) => updateField(i, 'answer', e.target.value)} placeholder="Answer" rows={2} maxLength={2000} className={inputClass} />
        </div>
      ))}
      <button type="button" onClick={addFAQ} className="text-[13px] font-medium text-primary hover:underline">+ Add another FAQ</button>
    </div>
  );
};

export default Step3Knowledge;
