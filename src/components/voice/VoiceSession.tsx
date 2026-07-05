import { useCallback, useEffect } from 'react';
import { Mic, X, ArrowLeft, RefreshCw } from 'lucide-react';
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
    muted,
    startSession,
    endSession,
    toggleMute,
  } = useVoiceSession({ chatbotId, systemPrompt });

  useEffect(() => {
    startSession();
  }, [startSession]);

  const handleEnd = useCallback(() => {
    endSession();
    onSessionEnd(transcript);
  }, [endSession, onSessionEnd, transcript]);

  const handleRetry = useCallback(() => {
    startSession();
  }, [startSession]);

  const isRunning = state === 'listening' || state === 'speaking' || state === 'processing' || state === 'connecting';
  const visualizerMode = state === 'speaking' ? 'speaking' : state === 'listening' ? 'listening' : 'idle';

  const statusText = {
    idle: 'Starting...',
    connecting: 'Connecting...',
    listening: muted ? 'Muted' : 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    disconnected: error || 'Session ended',
  }[state];

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: 'var(--cbs-bg, #ffffff)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cbs-bot-bubble-border, #e5e5e5)' }}>
        <div className="flex items-center gap-2">
          {(isRunning || state === 'disconnected') && (
            <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#22C55E' }}>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          <SessionTimer isRunning={isRunning} />
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              onClick={toggleMute}
              className="rounded-full p-2 transition-colors hover:opacity-70"
              style={{ color: muted ? '#EF4444' : 'var(--cbs-text-muted, #999)' }}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleEnd}
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
        <p className="text-[13px] font-medium" style={{ color: error ? '#EF4444' : 'var(--cbs-text-secondary, #666)' }}>
          {statusText}
        </p>

        {/* Transcript */}
        <div className="flex-1 w-full min-h-0 max-h-[40vh]">
          <TranscriptDisplay entries={transcript} />
        </div>

        {/* Error */}
        {error && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all active:scale-95"
            style={{ background: accentColor + '20', color: accentColor }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>

      {/* Bottom bar */}
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
    </div>
  );
}
