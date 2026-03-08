import { Link } from 'react-router-dom';
import { Bot, MessageSquare, Settings, Rocket, Trash2, BarChart3, FileQuestion, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Chatbot } from '@/hooks/useChatbot';
import BotAvatar from './BotAvatar';

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: (id: string) => void;
}

const ChatbotCard = ({ chatbot, onDelete }: ChatbotCardProps) => {
  const accentColor = chatbot.primary_color || 'hsl(190 100% 50%)';

  return (
    <div className="glass-card glow-border card-hover relative overflow-hidden rounded-lg p-4">
      {/* Accent stripe */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accentColor }} />

      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <BotAvatar avatarEmoji={chatbot.avatar_emoji} botName={chatbot.name} accentColor={accentColor} size="md" />
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">{chatbot.name}</h3>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`relative inline-block h-2 w-2 rounded-full ${
                  chatbot.is_active ? 'bg-success pulse-dot' : 'bg-muted-foreground'
                }`}
              />
              <span className="text-[10px] text-muted-foreground">
                {chatbot.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/chatbot/${chatbot.id}`} className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" /> Manage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/chatbot/${chatbot.id}/faqs`} className="flex items-center gap-2">
                <FileQuestion className="h-3.5 w-3.5" /> FAQs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/chatbot/${chatbot.id}/analytics`} className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" /> Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(chatbot.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {chatbot.total_conversations ?? 0} convos
        </span>
        <span className="flex items-center gap-1">
          <Bot className="h-3 w-3" />
          {chatbot.tone}
        </span>
      </div>

      <Link
        to={`/chatbot/${chatbot.id}/deploy`}
        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Rocket className="h-3 w-3" /> Deploy
      </Link>
    </div>
  );
};

export default ChatbotCard;
