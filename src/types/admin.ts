export type Plan = 'free' | 'premium';

export interface OrphanUser {
  id: string;
  email: string;
  created_at: string | null;
}

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
  avatar_emoji: string | null;
  welcome_message: string | null;
  tone: string | null;
  primary_color: string | null;
  embed_token: string | null;
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
  cta_text: string | null;
  cta_url: string | null;
  placement: string;
  is_active: boolean;
  created_at: string | null;
}

export interface ActivityFeedItem {
  type: string;
  label: string;
  time: string;
}

export interface AdminStats {
  userCount: number;
  botCount: number;
  convoCount: number;
  waitlistCount: number;
  faqCount: number;
  premiumCount: number;
  revenue: number;
  settings: Record<string, unknown> | null;
}

export interface AdminDeltaStats {
  usersThisWeek: number;
  usersLastWeek: number;
  botsThisWeek: number;
  botsLastWeek: number;
  convosThisWeek: number;
  convosLastWeek: number;
}

export interface ChartPoint {
  created_at: string;
  started_at: string;
}

export interface AdminPlatformSettings {
  maintenance_mode?: boolean;
  announcement_text?: string;
  free_message_limit?: number;
  premium_price_monthly?: number;
  updated_at?: string;
}
