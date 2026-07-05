import { useRef, useEffect } from 'react';
import type { TranscriptEntry } from './useVoiceSession';

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
}

export function TranscriptDisplay({ entries }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin"
      style={{ maxHeight: '100%' }}
    >
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
              entry.role === 'user'
                ? 'rounded-br-md'
                : 'rounded-bl-md'
            }`}
            style={{
              background: entry.role === 'user' ? 'var(--cbs-primary, #0a84ff)' : 'var(--cbs-bot-bubble-bg, #f0f0f0)',
              color: entry.role === 'user' ? '#fff' : 'var(--cbs-text-primary, #1a1a1a)',
            }}
          >
            {entry.text}
          </div>
        </div>
      ))}
    </div>
  );
}
