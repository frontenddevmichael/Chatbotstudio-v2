import { Link } from 'react-router-dom';
import { Bot, MessageSquare, Settings, Rocket, Trash2 } from 'lucide-react';
import type { Chatbot } from '@/hooks/useChatbot';

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: (id: string) => void;
}

const ChatbotCard = ({ chatbot, onDelete }: ChatbotCardProps) => (
  <div className="card-hover rounded-lg border border-border bg-card p-4">
    <div className="mb-3 flex items-start justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{chatbot.avatar_emoji || '🤖'}</span>
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">{chatbot.name}</h3>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            chatbot.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          }`}>
            {chatbot.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(chatbot.id)}
        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Delete chatbot"
      >
        <Trash2 className="h-4 w-4" />
      </button>
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
    <div className="flex gap-2">
      <Link
        to={`/chatbot/${chatbot.id}`}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
      >
        <Settings className="h-3 w-3" /> Manage
      </Link>
      <Link
        to={`/chatbot/${chatbot.id}/deploy`}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Rocket className="h-3 w-3" /> Deploy
      </Link>
    </div>
  </div>
);

export default ChatbotCard;
