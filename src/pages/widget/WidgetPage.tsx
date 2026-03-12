import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize';
import SEO from '@/components/ui/SEO';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ArrowUp, RotateCcw, X, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';
import BotAvatar from '@/components/chatbot/BotAvatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGES_PER_SESSION = 20;
const MAX_RETRIES = 3;

function getSessionKey(token: string) { return `widget_session_${token}`; }
function isEmbedded() { try { return window.self !== window.top; } catch { return true; } }

function renderMarkdown(text: string): string {
  let html = text
    .replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(128,128,128,0.12);padding:8px;border-radius:8px;overflow-x:auto;font-size:13px;margin:4px 0"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(128,128,128,0.12);padding:1px 4px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">$1</a>')
    .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
  html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, (match) => {
    return '<ul style="margin:4px 0;padding-left:18px">' + match.replace(/<br\/>/g, '') + '</ul>';
  });
  return html;
}

function getParentOrigin(): string | null {
  try { if (document.referrer) return new URL(document.referrer).origin; } catch {}
  return null;
}

/** Parse hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** Derive theme colors from primary color */
function deriveTheme(primary: string, isDark: boolean) {
  const rgb = hexToRgb(primary) || { r: 10, g: 132, b: 255 };
  const { r, g, b } = rgb;
  return {
    primary,
    headerBg: isDark ? `rgba(${r},${g},${b},0.08)` : `rgba(${r},${g},${b},0.06)`,
    headerBorder: isDark ? `rgba(${r},${g},${b},0.12)` : `rgba(${r},${g},${b},0.10)`,
    userBubble: primary,
    userBubbleText: '#fff',
    sendBtn: primary,
    inputFocusBorder: primary,
    onlineDot: primary,
    linkColor: primary,
    bg: isDark ? '#000' : '#ffffff',
    textPrimary: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)',
    textSecondary: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.50)',
    textMuted: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    botBubbleBg: isDark ? 'hsl(0 0% 8%)' : 'hsl(0 0% 94%)',
    botBubbleBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    inputBg: isDark ? 'hsl(0 0% 11%)' : 'hsl(0 0% 96%)',
    inputAreaBg: isDark ? 'hsl(0 0% 4%)' : 'hsl(0 0% 98%)',
    iconMuted: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    dotColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
  };
}

const WidgetPage = () => {
  const { embedToken } = useParams<{ embedToken: string }>();
  const [chatbot, setChatbot] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [msgCount, setMsgCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isExpanded, setIsExpanded] = useState(false);
  const embedded = isEmbedded();
  const parentOrigin = useRef(getParentOrigin());

  useEffect(() => {
    if (!embedToken) return;
    try {
      const saved = localStorage.getItem(getSessionKey(embedToken));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) { setMessages(parsed.messages); setMsgCount(parsed.msgCount ?? 0); }
      }
    } catch {}
  }, [embedToken]);

  useEffect(() => {
    if (!embedToken || messages.length === 0) return;
    try { localStorage.setItem(getSessionKey(embedToken), JSON.stringify({ messages, msgCount })); } catch {}
  }, [messages, msgCount, embedToken]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return;
      if (parentOrigin.current && e.origin !== parentOrigin.current) return;
      if (e.data.type === 'cbs:init') { if (e.data.theme === 'dark') setTheme('dark'); else setTheme('light'); }
      if (e.data.type === 'cbs:focus') inputRef.current?.focus();
      if (e.data.type === 'cbs:expanded') setIsExpanded(!!e.data.expanded);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const postToParent = useCallback((msg: Record<string, unknown>) => {
    if (!embedded) return;
    const origin = parentOrigin.current || '*';
    window.parent.postMessage(msg, origin);
  }, [embedded]);

  const closeWidget = useCallback(() => { postToParent({ type: 'cbs:close' }); }, [postToParent]);

  const toggleExpand = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);
    postToParent({ type: 'cbs:expand-request', expanded: next });
  }, [isExpanded, postToParent]);

  const fetchChatbot = useCallback(async () => {
    setError(''); setIsNetworkError(false); setInitialLoad(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_chatbot_by_embed_token', { token: embedToken });
      if (rpcError) { setError('Unable to connect. Check your internet and try again.'); setIsNetworkError(true); setInitialLoad(false); return; }
      if (!data?.length) { setError('Chatbot not found or inactive'); setInitialLoad(false); return; }
      const bot = data[0];
      setChatbot(bot);
      setMessages(prev => prev.length ? prev : (bot.welcome_message ? [{ role: 'assistant', content: bot.welcome_message }] : []));
      setInitialLoad(false);
    } catch { setError('Unable to connect. Check your internet and try again.'); setIsNetworkError(true); setInitialLoad(false); }
  }, [embedToken]);

  useEffect(() => { fetchChatbot(); }, [fetchChatbot]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const clearSession = () => {
    if (embedToken) { try { localStorage.removeItem(getSessionKey(embedToken)); } catch {} }
    setMessages(chatbot?.welcome_message ? [{ role: 'assistant', content: chatbot.welcome_message }] : []);
    setMsgCount(0);
  };

  const invokeWithRetry = useCallback(async (body: any, retries = MAX_RETRIES): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('chat', { body });
        if (fnError) throw fnError;
        return data;
      } catch (err) { if (attempt === retries) throw err; await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500)); }
    }
  }, []);

  const sendMessage = async () => {
    const text = sanitizeText(input);
    if (!text || loading || !chatbot) return;
    if (msgCount >= MAX_MESSAGES_PER_SESSION) {
      setMessages(prev => [...prev, { role: 'assistant', content: "You've reached the message limit for this session. Please refresh to start a new conversation." }]);
      setInput(''); return;
    }
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setLoading(true); setMsgCount(prev => prev + 1);
    try {
      const data = await invokeWithRetry({ chatbot_id: chatbot.id, session_id: sessionId, messages: newMessages, new_message: text });
      const reply = data?.error === 'rate_limit'
        ? "You've sent too many messages. Please wait a moment."
        : data?.response || "Sorry, I'm having trouble responding. Please try again.";
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      // Send unread notification to parent if widget is embedded
      postToParent({ type: 'cbs:unread' });
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble responding. Please try again." }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const primaryColor = chatbot?.primary_color || '#0a84ff';
  const botAvatar = chatbot?.avatar_emoji || 'bot';
  const botName = chatbot?.name || 'Bot';
  const isDark = theme === 'dark';
  const t = useMemo(() => deriveTheme(primaryColor, isDark), [primaryColor, isDark]);
  const mobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  // Skeleton loading state
  if (initialLoad) {
    return (
      <div className="flex h-screen flex-col" style={{ background: t.bg }}>
        {/* Skeleton header */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${t.botBubbleBorder}` }}>
          <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: t.botBubbleBg }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded animate-pulse" style={{ background: t.botBubbleBg }} />
            <div className="h-2 w-14 rounded animate-pulse" style={{ background: t.botBubbleBg }} />
          </div>
        </div>
        {/* Skeleton messages */}
        <div className="flex-1 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full animate-pulse shrink-0" style={{ background: t.botBubbleBg }} />
            <div className="h-12 w-48 rounded-2xl animate-pulse" style={{ background: t.botBubbleBg }} />
          </div>
        </div>
        {/* Skeleton input */}
        <div className="p-3" style={{ borderTop: `1px solid ${t.botBubbleBorder}` }}>
          <div className="h-10 rounded-full animate-pulse" style={{ background: t.botBubbleBg }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: t.bg }}>
        <div className="text-center">
          <BotAvatar avatarEmoji="bot" botName="Bot" accentColor="#666" size="lg" className="mx-auto mb-3" />
          <p className="text-[13px] mb-3" style={{ color: t.textSecondary }}>{error}</p>
          {isNetworkError && (
            <button onClick={fetchChatbot} className="rounded-full px-4 py-2 text-[13px] font-medium text-white transition-all active:scale-95" style={{ background: t.primary }}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col" style={{ background: t.bg }} role="application" aria-label={`Chat with ${botName}`}>
        <SEO title={botName} description={`Chat with ${botName}`} />

        {/* Header — tinted with primaryColor */}
        <header
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: t.headerBg, backdropFilter: 'saturate(180%) blur(20px)', borderBottom: `1px solid ${t.headerBorder}` }}
        >
          {/* Mobile back chevron */}
          {embedded && mobile && (
            <button onClick={closeWidget} className="rounded-[6px] p-1 -ml-1 transition-colors hover:opacity-80" style={{ color: t.primary }} aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <BotAvatar avatarEmoji={botAvatar} botName={botName} accentColor={primaryColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: t.textPrimary }}>{botName}</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: t.onlineDot }} aria-hidden="true" />
              <p className="text-[11px]" style={{ color: t.textSecondary }}>Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {embedded && !mobile && (
              <button onClick={toggleExpand} className="rounded-[6px] p-1.5 transition-colors hover:opacity-80" style={{ color: t.iconMuted }} aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}
            {messages.length > 1 && (
              <button onClick={clearSession} className="rounded-[6px] p-1.5 transition-colors hover:opacity-80" style={{ color: t.iconMuted }} aria-label="Clear conversation">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {embedded && !mobile && (
              <button onClick={closeWidget} className="rounded-[6px] p-1.5 transition-colors hover:opacity-80" style={{ color: t.iconMuted }} aria-label="Close chat">
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
                    ? { background: t.userBubble, color: t.userBubbleText, borderRadius: '18px 18px 4px 18px' }
                    : { background: t.botBubbleBg, border: `1px solid ${t.botBubbleBorder}`, color: t.textPrimary, borderRadius: '18px 18px 18px 4px' }
                }
              >
                <div
                  className="widget-markdown"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHTML(msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content),
                  }}
                />
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-in flex justify-start" aria-label="Bot is typing">
              <BotAvatar avatarEmoji={botAvatar} botName={botName} accentColor={primaryColor} size="sm" className="mr-2 shrink-0" />
              <div className="px-4 py-3" style={{ background: t.botBubbleBg, border: `1px solid ${t.botBubbleBorder}`, borderRadius: '18px 18px 18px 4px' }}>
                <div className="flex gap-1.5" role="status" aria-label="Loading response">
                  {[0, 1, 2].map(d => (
                    <span key={d} className="h-[6px] w-[6px] rounded-full animate-bounce" style={{ background: t.dotColor, animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input — focus ring uses primary */}
        <div style={{ background: t.inputAreaBg, borderTop: `1px solid ${t.headerBorder}` }} className="p-3">
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
              className="flex-1 rounded-full px-4 py-2 text-[15px] outline-none disabled:opacity-40 transition-shadow"
              style={{
                background: t.inputBg,
                border: `1px solid ${t.botBubbleBorder}`,
                color: t.textPrimary,
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${t.inputFocusBorder}40`; e.currentTarget.style.borderColor = t.inputFocusBorder; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = t.botBubbleBorder; }}
              autoComplete="off"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || msgCount >= MAX_MESSAGES_PER_SESSION}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-all active:scale-90 disabled:opacity-25"
              style={{ background: t.sendBtn }}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px]" style={{ color: t.textMuted }} aria-hidden="true">
            Powered by <span className="font-medium">ChatBot Studio</span>
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default WidgetPage;
