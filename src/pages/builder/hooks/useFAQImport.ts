import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FAQPair { question: string; answer: string; }

const COLUMN_ALIASES: Record<string, string> = {
  question: 'question', title: 'question', subject: 'question', name: 'question',
  answer: 'answer', response: 'answer', content: 'answer', reply: 'answer', description: 'answer',
};

function sniffDelimiter(header: string): string {
  if (header.includes('\t')) return '\t';
  return ',';
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseJsonFAQs(text: string): FAQPair[] {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.faqs || data.data || data.items || [];
    return arr
      .map((item: Record<string, unknown>) => {
        const q = String(item.question || item.title || item.name || item.subject || '').trim();
        const a = String(item.answer || item.response || item.content || item.description || '').trim();
        return q && a ? { question: q, answer: a } : null;
      })
      .filter(Boolean) as FAQPair[];
  } catch { return []; }
}

function parseCSVFAQs(text: string): FAQPair[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const delimiter = sniffDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map(h => COLUMN_ALIASES[h.trim().toLowerCase()] || h.trim().toLowerCase());
  const qIdx = headers.indexOf('question');
  const aIdx = headers.indexOf('answer');
  const usePositional = qIdx === -1 || aIdx === -1;

  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line, delimiter);
    if (usePositional) {
      const q = (cols[0] || '').trim().replace(/^"|"$/g, '');
      const a = (cols.slice(1).join(delimiter) || '').trim().replace(/^"|"$/g, '');
      return q && a ? { question: q, answer: a } : null;
    }
    const q = (cols[qIdx] || '').trim().replace(/^"|"$/g, '');
    const a = (cols[aIdx] || '').trim().replace(/^"|"$/g, '');
    return q && a ? { question: q, answer: a } : null;
  }).filter(Boolean) as FAQPair[];
}

function parseTxtFAQs(text: string): FAQPair[] {
  const lines = text.split('\n').filter(l => l.trim());
  const out: FAQPair[] = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    const q = lines[i].replace(/^Q:\s*/i, '').trim();
    const a = lines[i + 1]?.replace(/^A:\s*/i, '').trim();
    if (q && a) out.push({ question: q, answer: a });
  }
  return out;
}

export function parseFAQFile(file: File): Promise<FAQPair[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || '';
      let out: FAQPair[] = [];
      if (file.name.endsWith('.json')) {
        out = parseJsonFAQs(text);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        out = parseCSVFAQs(text);
      } else {
        out = parseTxtFAQs(text);
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
