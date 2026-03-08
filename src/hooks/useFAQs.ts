import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sanitizeFAQ } from '@/lib/sanitize';

export interface FAQ {
  id: string;
  chatbot_id: string;
  question: string;
  answer: string;
  variations: string[] | null;
  created_at: string | null;
}

export const useFAQs = (chatbotId: string) => {
  return useQuery({
    queryKey: ['faqs', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FAQ[];
    },
    enabled: !!chatbotId,
  });
};

export const useCreateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatbot_id: string; question: string; answer: string }) => {
      const sanitized = sanitizeFAQ(data);
      const { data: result, error } = await supabase
        .from('faqs')
        .insert({ ...sanitized, chatbot_id: data.chatbot_id })
        .select()
        .single();
      if (error) throw error;
      return result as FAQ;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['faqs', data.chatbot_id] }),
  });
};

export const useUpdateFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chatbot_id, ...data }: Partial<FAQ> & { id: string; chatbot_id: string }) => {
      const { data: result, error } = await supabase
        .from('faqs')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { ...result, chatbot_id } as FAQ;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['faqs', data.chatbot_id] }),
  });
};

export const useDeleteFAQ = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chatbot_id }: { id: string; chatbot_id: string }) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      return chatbot_id;
    },
    onSuccess: (chatbot_id) => queryClient.invalidateQueries({ queryKey: ['faqs', chatbot_id] }),
  });
};

export const useSupercharge = () => {
  return useMutation({
    mutationFn: async (faqId: string) => {
      const { data, error } = await supabase.functions.invoke('supercharge', {
        body: { faq_id: faqId },
      });
      if (error) throw error;
      return data as { variations: string[] };
    },
  });
};
