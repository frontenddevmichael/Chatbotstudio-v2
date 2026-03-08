import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SCRIPT: Msg[] = [
  { role: 'user', content: "What are your shop opening hours?" },
  { role: 'assistant', content: "We're open Monday–Saturday, 9am–6pm, and Sunday 11am–4pm! Anything else I can help with? 🕐" },
  { role: 'user', content: "How do I write a good return policy?" },
  { role: 'assistant', content: "Great question! A solid return policy should cover: the return window (30–90 days is standard), condition of items, refund method, and any exceptions. Want me to draft one for your business?" },
  { role: 'user', content: "Yes please!" },
  { role: 'assistant', content: "Here's a starter template:\n\n✦ 30-day return window from purchase date\n✦ Items must be unused, in original packaging\n✦ Full refund to original payment method within 5 business days\n✦ Final sale items clearly marked at checkout\n\nWant me to customize this further?" },
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
  <div className="flex gap-1 py-2 px-1">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]/60"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const LiveChatDemo = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<'playing' | 'typing' | 'interactive'>('playing');
  const [scriptIdx, setScriptIdx] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, showTyping]);

  // Auto-play script
  useEffect(() => {
    if (startedRef.current || phase !== 'playing') return;
    startedRef.current = true;
    const play = (idx: number) => {
      if (idx >= SCRIPT.length) { setPhase('interactive'); return; }
      const msg = SCRIPT[idx];
      if (msg.role === 'user') {
        setTimeout(() => {
          setMessages(prev => [...prev, msg]);
          setScriptIdx(idx + 1);
          // Show typing dots then bot response
          setTimeout(() => {
            setShowTyping(true);
            setTimeout(() => {
              setShowTyping(false);
              setScriptIdx(idx + 2);
              if (idx + 1 < SCRIPT.length) {
                setMessages(prev => [...prev, SCRIPT[idx + 1]]);
              }
              setTimeout(() => play(idx + 2), 1200);
            }, 1500);
          }, 600);
        }, idx === 0 ? 1000 : 800);
      }
    };
    play(0);
  }, [phase]);

  const sendReal = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);
    setShowTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          chatbot_id: '00000000-0000-0000-0000-000000000000',
          session_id: 'landing-demo-' + Math.random().toString(36).slice(2),
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          new_message: userMsg,
        },
      });
      setShowTyping(false);
      if (data?.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm a demo bot — sign up to build your own! 🚀" }]);
      }
    } catch {
      setShowTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sign up to create your own AI chatbot! 🚀" }]);
    }
    setSending(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Widget chrome */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#111118] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 flex items-center justify-center text-sm">🤖</div>
          <div>
            <div className="text-sm font-semibold text-white">ShopBot</div>
            <div className="text-xs text-gray-500">Always online</div>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-72 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#00d4ff] text-[#080810] rounded-br-md'
                    : 'bg-[#1a1a24] text-gray-200 rounded-bl-md'
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
              <div className="bg-[#1a1a24] rounded-2xl rounded-bl-md px-3">
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#1e1e2e]">
          {phase === 'interactive' ? (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReal()}
                placeholder="Try asking something..."
                className="flex-1 bg-[#0c0c14] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00d4ff]/50"
              />
              <button
                onClick={sendReal}
                disabled={sending}
                className="p-2 rounded-lg bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-600 py-2">
              Watching live demo...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatDemo;
