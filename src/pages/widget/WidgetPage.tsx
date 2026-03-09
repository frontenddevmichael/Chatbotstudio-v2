import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize';
import SEO from '@/components/ui/SEO';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ArrowUp, RotateCcw, X } from 'lucide-react';
import BotAvatar from '@/components/chatbot/BotAvatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGES_PER_SESSION = 20;
const MAX_RETRIES = 3;

function getSessionKey(token: string) {
  return `widget_session_${token}`;
}

/** Detect if running inside an iframe */
function isEmbedded() {
  try { return window.self !== window.top; } catch { return true; }
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const embedded = isEmbedded();

  // Restore session from localStorage (works in iframes unlike sessionStorage in some browsers)
  useEffect(() => {
    if (!embedToken) return;
    try {
      const saved = localStorage.getItem(getSessionKey(embedToken));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) {
          setMessages(parsed.messages);
          setMsgCount(parsed.msgCount ?? 0);
        }
      }
    } catch {
      // localStorage may be blocked in cross-origin iframes — fall back silently
    }
  }, [embedToken]);

  // Persist session
  useEffect(() => {
    if (!embedToken || messages.length === 0) return;
    try {
      localStorage.setItem(getSessionKey(embedToken), JSON.stringify({ messages, msgCount }));
    } catch {}
  }, [messages, msgCount, embedToken]);

  // PostMessage listener — receive config from embed SDK
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'cbs:init') {
        if (e.data.theme === 'light') setTheme('light');
      }
      if (e.data.type === 'cbs:user') {
        // Could store user metadata for analytics in future
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const closeWidget = useCallback(() => {
    if (embedded) {
      window.parent.postMessage({ type: 'cbs:close' }, '*');
    }
  }, [embedded]);

  useEffect(() => {
    const fetchChatbot = async () => {
      const { data, error: rpcError } = await supabase.rpc('get_chatbot_by_embed_token', {
        token: embedToken,
      });
      if (rpcError || !data?.length) {
        setError('Chatbot not found or inactive');
        setInitialLoad(false);
        return;
      }
      const bot = data[0];
      setChatbot(bot);
      setMessages(prev => prev.length ? prev : (bot.welcome_message ? [{ role: 'assistant', content: bot.welcome_message }] : []));
      setInitialLoad(false);
    };
    fetchChatbot();
  }, [embedToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const clearSession = () => {
    if (embedToken) {
      try { localStorage.removeItem(getSessionKey(embedToken)); } catch {}
    }
    setMessages(chatbot?.welcome_message ? [{ role: 'assistant', content: chatbot.welcome_message }] : []);
    setMsgCount(0);
  };

  const invokeWithRetry = useCallback(async (body: any, retries = MAX_RETRIES): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('chat', { body });
        if (fnError) throw fnError;
        return data;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }, []);

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
      const data = await invokeWithRetry({
        chatbot_id: chatbot.id, session_id: sessionId, messages: newMessages, new_message: text,
      });
      if (data?.error === 'rate_limit') {
        setMessages([...newMessages, { role: 'assistant', content: "You've sent too many messages. Please wait a moment." }]);
      } else if (data?.response) {
        setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble responding. Please try again." }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble responding. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const primaryColor = chatbot?.primary_color || '#0a84ff';
  const botAvatar = chatbot?.avatar_emoji || 'bot';
  const botName = chatbot?.name || 'Bot';

  // Theme-aware colors
  const isDark = theme === 'dark';
  const bg = isDark ? '#000' : '#ffffff';
  const headerBg = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const textPrimary = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
  const textSecondary = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.45)';
  const textMuted = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const bubbleBg = isDark ? 'hsl(0 0% 8%)' : 'hsl(0 0% 94%)';
  const bubbleBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? 'hsl(0 0% 11%)' : 'hsl(0 0% 96%)';
  const inputAreaBg = isDark ? 'hsl(0 0% 4%)' : 'hsl(0 0% 98%)';
  const iconMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const dotColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  if (initialLoad) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: bg }}>
        <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', borderTopColor: primaryColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: bg }}>
        <div className="text-center">
          <BotAvatar avatarEmoji="bot" botName="Bot" accentColor="#666" size="lg" className="mx-auto mb-3" />
          <p className="text-[13px]" style={{ color: textSecondary }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col" style={{ background: bg }} role="application" aria-label={`Chat with ${botName}`}>
        <SEO title={botName} description={`Chat with ${botName}`} />

        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: headerBg, backdropFilter: 'saturate(180%) blur(20px)', borderBottom: `1px solid ${headerBorder}` }}
        >
          <BotAvatar avatarEmoji={botAvatar} botName={botName} accentColor={primaryColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: textPrimary }}>{botName}</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#30d158]" aria-hidden="true" />
              <p className="text-[11px]" style={{ color: textSecondary }}>Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <button
                onClick={clearSession}
                className="rounded-[6px] p-1.5 transition-colors"
                style={{ color: iconMuted }}
                aria-label="Clear conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {embedded && (
              <button
                onClick={closeWidget}
                className="rounded-[6px] p-1.5 transition-colors"
                style={{ color: iconMuted }}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${i * 40}ms` }}>
              {msg.role === 'assistant' && (
                <BotAvatar avatarEmoji={botAvatar} botName={botName} accentColor={primaryColor} size="sm" className="mr-2 shrink-0 mt-0.5" />
              )}
              <div
                className="max-w-[80%] px-3.5 py-2.5 text-[15px] leading-relaxed"
                style={
                  msg.role === 'user'
                    ? { background: primaryColor, color: '#fff', borderRadius: '18px 18px 4px 18px' }
                    : { background: bubbleBg, border: `1px solid ${bubbleBorder}`, color: textPrimary, borderRadius: '18px 18px 18px 4px' }
                }
              >
                <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(msg.content) }} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-in flex justify-start" aria-label="Bot is typing">
              <BotAvatar avatarEmoji={botAvatar} botName={botName} accentColor={primaryColor} size="sm" className="mr-2 shrink-0" />
              <div className="px-4 py-3" style={{ background: bubbleBg, border: `1px solid ${bubbleBorder}`, borderRadius: '18px 18px 18px 4px' }}>
                <div className="flex gap-1.5" role="status" aria-label="Loading response">
                  {[0, 1, 2].map(d => (
                    <span key={d} className="h-[6px] w-[6px] rounded-full animate-bounce" style={{ background: dotColor, animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ background: inputAreaBg, borderTop: `1px solid ${headerBorder}` }} className="p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="cbs-input" className="sr-only">Type a message</label>
            <input
              id="cbs-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={msgCount >= MAX_MESSAGES_PER_SESSION ? 'Message limit reached' : 'Message...'}
              maxLength={2000}
              disabled={msgCount >= MAX_MESSAGES_PER_SESSION}
              className="flex-1 rounded-full px-4 py-2 text-[15px] outline-none disabled:opacity-40"
              style={{ background: inputBg, border: `1px solid ${bubbleBorder}`, color: textPrimary }}
              autoComplete="off"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || msgCount >= MAX_MESSAGES_PER_SESSION}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-all active:scale-90 disabled:opacity-25"
              style={{ background: primaryColor }}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px]" style={{ color: textMuted }} aria-hidden="true">
            Powered by <span className="font-medium">ChatBot Studio</span>
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default WidgetPage;
