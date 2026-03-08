import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Conversation {
  id: string;
  chatbot_id: string;
  session_id: string | null;
  messages: any[];
  started_at: string | null;
  last_message_at: string | null;
}

export const useConversations = (chatbotId: string) => {
  return useQuery({
    queryKey: ['conversations', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('last_message_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!chatbotId,
  });
};

export const useAllConversationStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversation-stats', user?.id],
    queryFn: async () => {
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user!.id);
      if (!chatbots?.length) return { totalConversations: 0, totalMessages: 0 };

      const ids = chatbots.map((c) => c.id);
      const { data: conversations } = await supabase
        .from('conversations')
        .select('messages')
        .in('chatbot_id', ids);

      const totalConversations = conversations?.length ?? 0;
      const totalMessages = conversations?.reduce((acc, c) => {
        const msgs = Array.isArray(c.messages) ? c.messages.length : 0;
        return acc + msgs;
      }, 0) ?? 0;

      return { totalConversations, totalMessages };
    },
    enabled: !!user,
  });
};
