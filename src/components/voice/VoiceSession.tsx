import { useCallback, useRef } from 'react';
import { Mic, MicOff, X, ArrowLeft } from 'lucide-react';
import { useVoiceSession, type TranscriptEntry } from './useVoiceSession';
import { AudioVisualizer } from './AudioVisualizer';
import { TranscriptDisplay } from './TranscriptDisplay';
import { SessionTimer } from './SessionTimer';

interface VoiceSessionProps {
  chatbotId: string;
  systemPrompt?: string;
  accentColor?: string;
  onSessionEnd: (transcript: TranscriptEntry[]) => void;
}

export function VoiceSession({ chatbotId, systemPrompt, accentColor = '#0a84ff', onSessionEnd }: VoiceSessionProps) {
  const {
    state,
    transcript,
    audioLevel,
    error,
    startSession,
    endSession,
  } = useVoiceSession({ chatbotId, systemPrompt });

  const sessionStarted = useRef(false);

  const handleStart = useCallback(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      startSession();
    }
  }, [startSession]);

  const handleEnd = useCallback(() => {
    endSession();
    onSessionEnd(transcript);
  }, [endSession, onSessionEnd, transcript]);

  const isRunning = state === 'listening' || state === 'speaking' || state === 'processing';
  const visualizerMode = state === 'speaking' ? 'speaking' : state === 'listening' ? 'listening' : 'idle';

  const statusText = {
    idle: '',
    connecting: 'Connecting...',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    disconnected: error || 'Session ended',
  }[state];

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: 'var(--cbs-bg, #ffffff)' }}
      onClick={handleStart}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cbs-bot-bubble-border, #e5e5e5)' }}>
        <div className="flex items-center gap-2">
          {isRunning || state === 'disconnected' ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#22C55E' }}>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-[12px] text-gray-400">Voice</span>
          )}
          <SessionTimer isRunning={isRunning} />
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              onClick={(e) => { e.stopPropagation(); /* mute toggle - could add state */ }}
              className="rounded-full p-2 transition-colors hover:opacity-70"
              style={{ color: 'var(--cbs-text-muted, #999)' }}
              aria-label="Mute microphone"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleEnd(); }}
            className="rounded-full p-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--cbs-text-muted, #999)' }}
            aria-label="End voice session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 overflow-hidden">
        {/* Visualizer */}
        <div className="flex items-center justify-center">
          <AudioVisualizer level={audioLevel} mode={visualizerMode} isActive={isRunning} />
        </div>

        {/* Status text */}
        {state !== 'idle' && (
          <p className="text-[13px] font-medium" style={{ color: 'var(--cbs-text-secondary, #666)' }}>
            {statusText}
          </p>
        )}

        {/* Transcript */}
        <div className="flex-1 w-full min-h-0 max-h-[40vh]">
          <TranscriptDisplay entries={transcript} />
        </div>

        {/* Error */}
        {error && (
          <p className="text-[12px] text-center px-4" style={{ color: '#EF4444' }}>
            {error}
          </p>
        )}

        {/* Start prompt */}
        {state === 'idle' && (
          <button
            className="rounded-full px-6 py-2.5 text-[14px] font-medium text-white transition-all active:scale-95"
            style={{ background: accentColor }}
          >
            Tap to start voice conversation
          </button>
        )}
      </div>

      {/* Bottom bar */}
      {state !== 'idle' && (
        <div className="flex items-center justify-center px-4 py-3" style={{ borderTop: '1px solid var(--cbs-bot-bubble-border, #e5e5e5)' }}>
          <button
            onClick={handleEnd}
            className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--cbs-text-secondary, #666)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>
        </div>
      )}
    </div>
  );
}
