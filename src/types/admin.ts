// Shared types for admin pages, hooks, and adminApi
export type Plan = 'free' | 'premium';

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: Plan | null;
  monthly_message_count: number | null;
  message_limit: number | null;
  created_at: string | null;
}

export interface AdminChatbotMapEntry {
  name: string;
  emoji: string | null;
}
export type AdminChatbotMap = Record<string, AdminChatbotMapEntry>;

export interface AdminChatbot {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean | null;
  total_conversations: number | null;
  total_messages: number | null;
  created_at: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'bot' | 'system';
  content: string;
  timestamp?: string;
}

export interface AdminConversation {
  id: string;
  chatbot_id: string;
  session_id: string | null;
  messages: ChatMessage[] | null;
  started_at: string | null;
  last_message_at: string | null;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string | null;
}

export interface AdminAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  is_active: boolean;
  position: string | null;
  click_count?: number;
  created_at?: string;
}

export interface ActivityFeedItem {
  type: 'signup' | 'bot_created' | 'conversation';
  id: string;
  label: string;
  timestamp: string;
}
