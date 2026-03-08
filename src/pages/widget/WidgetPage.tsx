import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize';
import SEO from '@/components/ui/SEO';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Send } from 'lucide-react';
import BotAvatar from '@/components/chatbot/BotAvatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGES_PER_SESSION = 20;

const WidgetPage = () => {
  const { embedToken } = useParams<{ embedToken: string }>();
  const [chatbot, setChatbot] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [msgCount, setMsgCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchChatbot = async () => {
      const { data } = await supabase
        .from('chatbots')
        .select('*')
        .eq('embed_token', embedToken)
        .eq('is_active', true)
        .single();
      if (data) {
        setChatbot(data);
        if (data.welcome_message) {
          setMessages([{ role: 'assistant', content: data.welcome_message }]);
        }
      } else {
        setError('Chatbot not found or inactive');
      }
      setInitialLoad(false);
    };
    fetchChatbot();
  }, [embedToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = sanitizeText(input);
    if (!text || loading || !chatbot) return;

    if (msgCount >= MAX_MESSAGES_PER_SESSION) {
      setMessages(prev => [...prev, { role: 'assistant', content: "You've reached the message limit for this session. Please refresh to start a new conversation." }]);
      setInput('');
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setMsgCount(prev => prev + 1);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chat', {
        body: {
          chatbot_id: chatbot.id,
          session_id: sessionId,
          messages: newMessages,
          new_message: text,
        },
      });

      if (fnError) throw fnError;
      if (data?.error === 'rate_limit') {
        setMessages([...newMessages, { role: 'assistant', content: "You've sent too many messages. Please wait a moment and try again." }]);
      } else if (data?.response) {
        setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      } else if (data?.error) {
        setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble responding right now. Please try again." }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble responding right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const primaryColor = chatbot?.primary_color || '#00d4ff';
  const botAvatar = chatbot?.avatar_emoji || 'bot';
  const botName = chatbot?.name || 'Bot';

  if (initialLoad) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground" style={{ borderTopColor: primaryColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <span className="mb-3 inline-block text-4xl">🤖</span>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-background">
        <SEO
          title={chatbot?.name || 'Chat'}
          description={`Chat with ${chatbot?.name} — powered by ChatBot Studio`}
        />

        {/* Header */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderBottomColor: `${primaryColor}22`, boxShadow: `0 1px 12px -4px ${primaryColor}15` }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
            style={{ background: `${primaryColor}15` }}
          >
            {botEmoji}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{chatbot?.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
              <p className="text-[11px] text-muted-foreground">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`message-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${i * 50}ms` }}>
              {msg.role === 'assistant' && (
                <div
                  className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ background: `${primaryColor}15` }}
                >
                  {botEmoji}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border text-foreground rounded-bl-md'
                }`}
                style={msg.role === 'user' ? { backgroundColor: primaryColor } : undefined}
              >
                <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(msg.content) }} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-in flex justify-start">
              <div
                className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                style={{ background: `${primaryColor}15` }}
              >
                {botEmoji}
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 rounded-bl-md">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Typing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={msgCount >= MAX_MESSAGES_PER_SESSION ? 'Message limit reached' : 'Type a message...'}
              maxLength={2000}
              disabled={msgCount >= MAX_MESSAGES_PER_SESSION}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              style={{ borderColor: input ? primaryColor : undefined }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || msgCount >= MAX_MESSAGES_PER_SESSION}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground transition-colors disabled:opacity-30"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">
            Powered by <span className="font-semibold">ChatBot Studio</span>
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default WidgetPage;
