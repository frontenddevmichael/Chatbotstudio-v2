import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize';
import SEO from '@/components/ui/SEO';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import type { Chatbot } from '@/hooks/useChatbot';
import { RotateCcw, X, Maximize2, Minimize2, ChevronLeft, MessageSquare, Mail, Mic, MicOff, Volume2 } from 'lucide-react';
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
    .replace(/^[•*-] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
  html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, (match) => {
    return '<ul style="margin:4px 0;padding-left:18px">' + match.replace(/<br\/>/g, '') + '</ul>';
  });
  return html;
}

function getParentOrigin(): string | null {
  try { if (document.referrer) return new URL(document.referrer).origin; } catch (e) { console.error("Failed to parse parent origin:", e); }
  return null;
}

function getConfidenceScore(text: string): number {
  const uncertain = [
    "i'm not sure", "i don't know", "i cannot", "can't answer", "unable to",
    "i'm sorry, i", "sorry, i'm not", "i don't have", "not sure how",
    "i'm an ai", "as an ai", "i would recommend contacting",
    "i'd recommend", "you may want to", "you could try", "might want to",
    "i can't provide", "cannot provide",
  ];
  const hedging = [
    "i think", "maybe", "perhaps", "possibly", "could be",
    "not entirely sure", "not 100%", "best guess",
  ];
  const lower = text.toLowerCase();
  const matches = uncertain.filter(p => lower.includes(p)).length;
  const hedgeMatches = hedging.filter(p => lower.includes(p)).length;
  const totalSignals = matches + hedgeMatches * 0.5;
  if (totalSignals >= 3) return 0.3;
  if (totalSignals >= 2) return 0.45;
  if (totalSignals >= 1) return 0.6;
  return 1;
}

function isUncertainResponse(text: string): boolean {
  return getConfidenceScore(text) < 0.7;
}

const WHATSAPP_NUMBER = import.meta.env.VITE_WIDGET_WHATSAPP as string | undefined;
const HANDOFF_EMAIL = import.meta.env.VITE_WIDGET_EMAIL as string | undefined;

/** Parse hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** Derive theme colors from primary color */
function deriveTheme(primary: string, isDark: boolean) {
  const rgb = hexToRgb(primary) || { r: 154, g: 61, b: 34 };
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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const WidgetPage = () => {
  const { embedToken } = useParams<{ embedToken: string }>();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [variant, setVariant] = useState<{ id: string; tone?: string | null; welcome_message?: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [visitorId] = useState(() => {
    try {
      let vid = localStorage.getItem('cbs_visitor_id');
      if (!vid) { vid = crypto.randomUUID(); localStorage.setItem('cbs_visitor_id', vid); }
      return vid;
    } catch { return crypto.randomUUID(); }
  });
  const [msgCount, setMsgCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(() => import.meta.env.VITE_ENABLE_VOICE !== 'false');
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
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
    } catch { void 0; }
  }, [embedToken]);

  useEffect(() => {
    if (!embedToken || messages.length === 0) return;
    try { localStorage.setItem(getSessionKey(embedToken), JSON.stringify({ messages, msgCount })); } catch { void 0; }
  }, [messages, msgCount, embedToken]);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  const [pageContext, setPageContext] = useState<string>('');
  const [visitorLang] = useState(() => {
    try { return navigator.language || 'en'; } catch { return 'en'; }
  });
  const [customTheme, setCustomTheme] = useState<Partial<ReturnType<typeof deriveTheme>> | null>(null);
  const pageContextRef = useRef(pageContext);
  pageContextRef.current = pageContext;

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return;
      if (parentOrigin.current && e.origin !== parentOrigin.current) return;
      if (e.data.type === 'cbs:init') { if (e.data.theme === 'dark') setTheme('dark'); else setTheme('light'); if (e.data.voiceEnabled !== undefined) setVoiceEnabled(e.data.voiceEnabled); }
      if (e.data.type === 'cbs:focus') inputRef.current?.focus();
      if (e.data.type === 'cbs:expanded') setIsExpanded(!!e.data.expanded);
      if (e.data.type === 'cbs:theme') {
        setCustomTheme(e.data.theme);
      }
      if (e.data.type === 'cbs:page-context' && e.data.context) {
        const ctx = e.data.context;
        const parts: string[] = [];
        if (ctx.title) parts.push(`Page title: ${ctx.title}`);
        if (ctx.url) parts.push(`URL: ${ctx.url}`);
        if (ctx.selectedText) parts.push(`Visitor selected text: "${ctx.selectedText}"`);
        if (ctx.pageText) parts.push(`Page content: ${ctx.pageText.slice(0, 2000)}`);
        setPageContext(parts.join('\n'));
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
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

      if (bot.user_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('brand_color, logo_url')
          .eq('owner_id', bot.user_id)
          .eq('is_active', true)
          .maybeSingle();
        if (agencyData) {
          setCustomTheme({
            primary: agencyData.brand_color,
            userBubble: agencyData.brand_color,
            sendBtn: agencyData.brand_color,
            inputFocusBorder: agencyData.brand_color,
            onlineDot: agencyData.brand_color,
            linkColor: agencyData.brand_color,
          });
        }
      }

      let assignedVariant: typeof variant = null;
      const { data: variants } = await supabase
        .from('chatbot_variants')
        .select('id, tone, welcome_message, traffic_percentage')
        .eq('chatbot_id', bot.id)
        .eq('is_active', true);
      if (variants?.length) {
        const h = hashString(visitorId + bot.id);
        let cumulative = 0;
        for (const v of variants) {
          cumulative += (v as any).traffic_percentage || 0;
          if (h % 100 < cumulative) {
            assignedVariant = { id: v.id, tone: v.tone, welcome_message: v.welcome_message };
            break;
          }
        }
      }
      setVariant(assignedVariant);

      const welcomeMsg = assignedVariant?.welcome_message || bot.welcome_message;
      setMessages(prev => prev.length ? prev : (welcomeMsg ? [{ role: 'assistant', content: welcomeMsg }] : []));
      setInitialLoad(false);
    } catch { setError('Unable to connect. Check your internet and try again.'); setIsNetworkError(true); setInitialLoad(false); }
  }, [embedToken, visitorId]);

  useEffect(() => { fetchChatbot(); }, [fetchChatbot]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const clearSession = () => {
    if (embedToken) { try { localStorage.removeItem(getSessionKey(embedToken)); } catch { void 0; } }
    const welcomeMsg = variant?.welcome_message || chatbot?.welcome_message;
    setMessages(welcomeMsg ? [{ role: 'assistant', content: welcomeMsg }] : []);
    setMsgCount(0);
  };

  const invokeWithRetry = useCallback(async (body: Record<string, unknown>, retries = MAX_RETRIES): Promise<Record<string, unknown>> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('offline');
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('chat', { body });
        if (fnError) throw fnError;
        return data;
      } catch (err) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('offline');
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }, []);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4_000_000) { setError('Image must be under 4MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const sendMessage = async () => {
    const text = sanitizeText(input);
    if ((!text && !imagePreview && !audioPreview) || loading || !chatbot) return;
    if (msgCount >= MAX_MESSAGES_PER_SESSION) {
      setMessages(prev => [...prev, { role: 'assistant', content: "You've reached the message limit for this session. Please refresh to start a new conversation." }]);
      setInput(''); return;
    }
    const hasMultimodal = !!(imagePreview || audioPreview);
    const userContent = hasMultimodal ? `${text || (audioPreview ? 'Voice message' : 'See attached image')}\n<image>` : text;
    const userMsg: Message = { role: 'user', content: userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setLoading(true); setMsgCount(prev => prev + 1);
    const body: Record<string, unknown> = { chatbot_id: chatbot.id, session_id: sessionId, visitor_id: visitorId, messages: newMessages, new_message: text || (audioPreview ? 'Voice message' : 'See attached image') };
    if (variant) body.variant_id = variant.id;
    if (imagePreview) body.image = imagePreview;
    if (audioPreview) body.audio = audioPreview;
    if (pageContextRef.current) body.page_context = pageContextRef.current;
    body.visitor_lang = visitorLang;
    try {
      const data = await invokeWithRetry(body);
      removeImage();
      cancelAudio();
      const reply = data?.error === 'rate_limit'
        ? "You've sent too many messages. Please wait a moment."
        : data?.response || "Sorry, I'm having trouble responding. Please try again.";
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      postToParent({ type: 'cbs:unread' });
      if (voiceEnabled) speakMessage(reply);
    } catch (err) {
      cancelAudio();
      const msg = (err as Error)?.message === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine)
        ? "You appear to be offline. Please check your internet connection and try again."
        : "Sorry, I'm having trouble responding. Please try again.";
      setMessages([...newMessages, { role: 'assistant', content: msg }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const speakMessage = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const recorder = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
          if (blob.size < 1000) { setIsRecording(false); return; }
          const reader = new FileReader();
          reader.onloadend = () => {
            setIsRecording(false);
            const dataUrl = reader.result as string;
            setInput('Voice message');
            setAudioPreview(dataUrl);
          };
          reader.readAsDataURL(blob);
        };
        recorder.onerror = () => { stream.getTracks().forEach(t => t.stop()); setIsRecording(false); };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    })();
  }, [isRecording]);

  const cancelAudio = () => { setAudioPreview(null); };

  const primaryColor = chatbot?.primary_color || '#0a84ff';
  const botAvatar = chatbot?.avatar_emoji || 'bot';
  const botName = chatbot?.name || 'Bot';
  const isDark = theme === 'dark';
  const t = useMemo(() => {
    const base = deriveTheme(primaryColor, isDark);
    return customTheme ? { ...base, ...customTheme } : base;
  }, [primaryColor, isDark, customTheme]);
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
            <p className="text-[14px] font-semibold truncate flex items-center gap-1.5" style={{ color: t.textPrimary }}>
              {botName}
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ background: `${primaryColor}18`, color: primaryColor }}>
                AI
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: t.onlineDot }} aria-hidden="true" />
              <p className="text-[11px]" style={{ color: t.textSecondary }}>AI Assistant</p>
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

        {/* Offline banner */}
        {isOffline && (
          <div className="px-4 py-2 text-center text-[12px] font-medium" style={{ background: '#FEF3C7', color: '#92400E' }} role="alert" aria-live="assertive">
            No internet connection. Messages will send when you're back online.
          </div>
        )}

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
                {voiceEnabled && msg.role === 'assistant' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); speakMessage(msg.content); }}
                    className="mt-1 flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: t.textSecondary }}
                    aria-label="Read message aloud"
                  >
                    <Volume2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Handoff on uncertainty */}
          {!loading && messages.length > 0 && (() => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role !== 'assistant' || !isUncertainResponse(lastMsg.content)) return null;
            const confidence = getConfidenceScore(lastMsg.content);
            const confidencePct = Math.round(confidence * 100);
            const barColor = confidencePct < 40 ? '#EF4444' : confidencePct < 60 ? '#F59E0B' : '#10B981';
            return (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${t.botBubbleBorder}` }}>
                {/* Confidence indicator */}
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${t.textSecondary}20` }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${confidencePct}%`, background: barColor }} />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: barColor }}>
                    {confidencePct}%
                  </span>
                </div>
                <p className="text-[12px] font-medium text-center mb-3" style={{ color: t.textSecondary }}>
                  {confidencePct < 40 ? 'I\'m not confident about that answer. Let me connect you with a human.' :
                   'I may not have the best answer. Want to talk to a person instead?'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {WHATSAPP_NUMBER && (
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20need%20help%20with%20${encodeURIComponent(botName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[12px] font-medium transition-all hover:opacity-80 active:scale-95"
                      style={{ background: '#25D36620', color: '#25D366' }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                  {HANDOFF_EMAIL && (
                    <a
                      href={`mailto:${HANDOFF_EMAIL}?subject=Help%20with%20${encodeURIComponent(botName)}&body=Hi%2C%20I%20was%20chatting%20with%20${encodeURIComponent(botName)}%20and%20need%20further%20assistance.`}
                      className="flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[12px] font-medium transition-all hover:opacity-80 active:scale-95"
                      style={{ background: `${t.primary}15`, color: t.primary }}
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                </div>
              </div>
            );
          })()}

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
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-2 flex items-center gap-2 rounded-lg p-2" style={{ background: `${t.primary}10` }}>
              <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
              <span className="flex-1 truncate text-[11px]" style={{ color: t.textSecondary }}>Image attached</span>
              <button onClick={removeImage} className="rounded-full p-1 hover:bg-black/10 transition-colors" style={{ color: t.textSecondary }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" ref={fileInputRef} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || msgCount >= MAX_MESSAGES_PER_SESSION || !!imagePreview}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-25"
              style={{ color: t.textMuted }}
              aria-label="Attach image"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M4 16L10 8L13 12L15 9L18 14V4C18 3.45 17.55 3 17 3H3C2.45 3 2 3.45 2 4V16C2 16.55 2.45 17 3 17H16C16.55 17 17 16.55 17 16V15L14 11L10 16L8 13L4 16Z" fill="currentColor"/>
              </svg>
            </button>
            <label htmlFor="cbs-input" className="sr-only">Type a message</label>
            <input
              id="cbs-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isOffline ? 'No internet connection' : msgCount >= MAX_MESSAGES_PER_SESSION ? 'Message limit reached' : 'Message...'}
              maxLength={2000}
              disabled={msgCount >= MAX_MESSAGES_PER_SESSION || isOffline}
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
            {voiceEnabled && (
              <button
                onClick={toggleRecording}
                disabled={loading || !!audioPreview}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-25 ${isRecording ? 'animate-pulse shadow-lg' : ''}`}
                style={{
                  background: isRecording ? '#EF4444' : 'transparent',
                  color: isRecording ? '#fff' : t.textMuted,
                }}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !imagePreview && !audioPreview) || msgCount >= MAX_MESSAGES_PER_SESSION || isOffline}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-all active:scale-90 disabled:opacity-25"
              style={{ background: t.sendBtn }}
              aria-label="Send message"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" style={loading ? { animation: 'widgetSendPulse 0.6s ease-in-out infinite' } : {}}>
                <path d="M2 8L14 2L10 14L7.5 8.5L2 8Z" className="fill-current" />
              </svg>
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
