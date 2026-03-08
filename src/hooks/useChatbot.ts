import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sanitizeText } from '@/lib/sanitize';

export interface Chatbot {
  id: string;
  user_id: string;
  name: string;
  welcome_message: string | null;
  tone: string | null;
  primary_color: string | null;
  avatar_emoji: string | null;
  is_active: boolean | null;
  total_conversations: number | null;
  embed_token: string | null;
  created_at: string | null;
}

export const useChatbots = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Chatbot[];
    },
    enabled: !!user,
  });
};

export const useChatbot = (id: string) => {
  return useQuery({
    queryKey: ['chatbot', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Chatbot;
    },
    enabled: !!id,
  });
};

export const useCreateChatbot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<Chatbot>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('chatbots')
        .insert({
          name: data.name || 'Untitled Bot',
          welcome_message: data.welcome_message ?? null,
          avatar_emoji: data.avatar_emoji ?? null,
          tone: data.tone ?? null,
          primary_color: data.primary_color ?? null,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return result as Chatbot;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatbots'] }),
  });
};

export const useUpdateChatbot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Chatbot> & { id: string }) => {
      const updates: Record<string, any> = { ...data };
      if (data.name) updates.name = sanitizeText(data.name);
      if (data.welcome_message) updates.welcome_message = sanitizeText(data.welcome_message);
      const { data: result, error } = await supabase
        .from('chatbots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as Chatbot;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot', data.id] });
    },
  });
};

export const useDeleteChatbot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chatbots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatbots'] }),
  });
};

export const useDuplicateChatbot = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      // Fetch source bot
      const { data: source, error: fetchErr } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', sourceId)
        .single();
      if (fetchErr || !source) throw fetchErr || new Error('Not found');

      // Create duplicate
      const { data: newBot, error: createErr } = await supabase
        .from('chatbots')
        .insert({
          name: `${source.name} (Copy)`,
          welcome_message: source.welcome_message,
          tone: source.tone,
          primary_color: source.primary_color,
          avatar_emoji: source.avatar_emoji,
          user_id: user!.id,
        })
        .select()
        .single();
      if (createErr || !newBot) throw createErr || new Error('Create failed');

      // Copy FAQs
      const { data: faqs } = await supabase
        .from('faqs')
        .select('question, answer, variations')
        .eq('chatbot_id', sourceId);
      if (faqs?.length) {
        await supabase.from('faqs').insert(
          faqs.map((f) => ({ ...f, chatbot_id: newBot.id }))
        );
      }

      return newBot as Chatbot;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatbots'] }),
  });
};
