import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FAQPair { question: string; answer: string; }

export function parseFAQFile(file: File): Promise<FAQPair[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || '';
      const out: FAQPair[] = [];
      if (file.name.endsWith('.csv')) {
        text.split('\n').filter(l => l.trim()).forEach(line => {
          const [q, ...rest] = line.split(',');
          const a = rest.join(',').trim();
          if (q?.trim() && a) out.push({ question: q.trim().replace(/^"|"$/g, ''), answer: a.replace(/^"|"$/g, '') });
        });
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length - 1; i += 2) {
          const q = lines[i].replace(/^Q:\s*/i, '').trim();
          const a = lines[i + 1]?.replace(/^A:\s*/i, '').trim();
          if (q && a) out.push({ question: q, answer: a });
        }
      }
      resolve(out);
    };
    reader.readAsText(file);
  });
}

export function useAIGenerateFAQs() {
  const [generating, setGenerating] = useState(false);

  const generate = async (file: File): Promise<FAQPair[]> => {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve((ev.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });

    if (text.trim().length < 50) {
      toast.error('Document is too short. Please upload a more detailed file.');
      return [];
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-faqs', {
        body: { document_text: text },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return []; }
      const faqs: FAQPair[] = data?.faqs ?? [];
      if (!faqs.length) {
        toast.error('No FAQs could be extracted. Try a different document.');
        return [];
      }
      toast.success(`Generated ${faqs.length} FAQs from your document`);
      return faqs;
    } catch (err) {
      console.error('AI FAQ generation failed:', err);
      toast.error('Failed to generate FAQs. Please try again.');
      return [];
    } finally {
      setGenerating(false);
    }
  };

  return { generating, generate };
}
