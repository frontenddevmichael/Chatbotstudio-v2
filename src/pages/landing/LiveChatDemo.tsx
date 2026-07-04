import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LaunchIcon } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import BotAvatar from '@/components/chatbot/BotAvatar';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SCRIPT: Msg[] = [
  { role: 'user', content: "What are your shop opening hours?" },
  { role: 'assistant', content: "We're open Monday–Saturday, 9am–6pm, and Sunday 11am–4pm. Anything else I can help with?" },
  { role: 'user', content: "How do I write a good return policy?" },
  { role: 'assistant', content: "A solid return policy should cover: the return window (30–90 days is standard), condition of items, refund method, and any exceptions. Want me to draft one for your business?" },
  { role: 'user', content: "Yes please!" },
  { role: 'assistant', content: "Here's a starter:\n\n• 30-day return window from purchase\n• Items must be unused, original packaging\n• Full refund within 5 business days\n• Final sale items marked at checkout\n\nWant me to customize this further?" },
];

const Typewriter = ({ text, speed = 25, onDone }: { text: string; speed?: number; onDone?: () => void }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown < text.length) {
      const t = setTimeout(() => setShown(s => s + 1), speed);
      return () => clearTimeout(t);
    } else {
      onDone?.();
    }
  }, [shown, text, speed, onDone]);
  return <>{text.slice(0, shown)}</>;
};

const TypingDots = () => (
  <div className="flex gap-1.5 py-2 px-1">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-[5px] h-[5px] rounded-full bg-ink-muted/30"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

interface Props {
  botName?: string;
  welcomeMessage?: string;
}

const LiveChatDemo = ({ botName = 'ShopBot', welcomeMessage = 'Hi! How can I help you today?' }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<'playing' | 'typing' | 'interactive'>('playing');
  const [showTyping, setShowTyping] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const isDefault = botName === 'ShopBot';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, showTyping]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (startedRef.current) return;
    startedRef.current = true;
    if (!isDefault) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
      setPhase('interactive');
      return;
    }
    if (phase !== 'playing') return;
    const play = (idx: number) => {
      if (idx >= SCRIPT.length) { setPhase('interactive'); return; }
      const msg = SCRIPT[idx];
      if (msg.role === 'user') {
        const t1 = setTimeout(() => {
          setMessages(prev => [...prev, msg]);
          const t2 = setTimeout(() => {
            setShowTyping(true);
            const t3 = setTimeout(() => {
              setShowTyping(false);
              if (idx + 1 < SCRIPT.length) {
                setMessages(prev => [...prev, SCRIPT[idx + 1]]);
              }
              const t4 = setTimeout(() => play(idx + 2), 1200);
              timers.push(t4);
            }, 1500);
            timers.push(t3);
          }, 600);
          timers.push(t2);
        }, idx === 0 ? 1000 : 800);
        timers.push(t1);
      }
    };
    play(0);
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const sendReal = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);
    setShowTyping(true);
    try {
      const { data } = await supabase.functions.invoke('chat', {
        body: {
          chatbot_id: '00000000-0000-0000-0000-000000000000',
          session_id: 'landing-demo-' + Math.random().toString(36).slice(2),
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          new_message: userMsg,
        },
      });
      setShowTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.response || "I'm a demo — sign up to build your own!",
      }]);
    } catch {
      setShowTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sign up to create your own AI chatbot!" }]);
    }
    setSending(false);
  };

  return (
    <div className="w-full max-w-[360px] mx-auto">
      <div className="rounded-[20px] bg-surface border border-border/10 shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/10 flex items-center gap-3 bg-surface/80 backdrop-blur-xl">
          <BotAvatar avatarEmoji="headphones" botName={botName} accentColor="hsl(var(--primary))" size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-ink">{botName}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full bg-success-dot" />
              <span className="text-[11px] text-label-muted">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-[280px] overflow-y-auto p-4 space-y-3 bg-surface">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-[14px] py-[10px] text-[14px] whitespace-pre-line leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-fill text-ink rounded-[18px] rounded-br-[4px]'
                    : 'bg-surface border border-border/10 text-ink-muted rounded-[18px] rounded-bl-[4px]'
                }`}>
                  {msg.role === 'assistant' && i === messages.length - 1 && phase === 'playing' ? (
                    <Typewriter text={msg.content} speed={20} />
                  ) : msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {showTyping && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border/10 rounded-[18px] rounded-bl-[4px] px-[14px]">
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/10 bg-surface">
          {phase === 'interactive' ? (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReal()}
                placeholder="Try asking something..."
                className="flex-1 h-9 bg-surface-3 border border-border/10 rounded-full px-4 text-[14px] text-ink placeholder:text-label-muted/50 focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={sendReal}
                disabled={sending}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <LaunchIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-2">
              <span className="text-[11px] text-label-muted/50">Watching live demo...</span>
              <button
                onClick={() => { startedRef.current = true; setPhase('interactive'); }}
                className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatDemo;
