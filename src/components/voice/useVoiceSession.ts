import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VADProcessor } from './VADProcessor';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'disconnected';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceSessionConfig {
  chatbotId: string;
  systemPrompt?: string;
}

interface LiveTokenResponse {
  token: string;
  model: string;
}

const WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const SAMPLE_RATE_IN = 16000;
const SAMPLE_RATE_OUT = 24000;

function base64EncodeInt16(int16: Int16Array): string {
  const uint8 = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8[i] = binary.charCodeAt(i);
  }
  return new Int16Array(uint8.buffer);
}

export function useVoiceSession(config: VoiceSessionConfig) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const vadRef = useRef<VADProcessor | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const apiKeyRef = useRef<string | null>(null);
  const modelRef = useRef<string>('gemini-2.5-flash-native-audio');
  const reconnectRef = useRef(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const stateRef = useRef<VoiceState>('idle');
  const mutedRef = useRef(false);

  const setStateSafe = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const updateTranscript = useCallback((entry: TranscriptEntry) => {
    transcriptRef.current = [...transcriptRef.current, entry];
    setTranscript(transcriptRef.current);
  }, []);

  const appendPartialText = useCallback((role: 'user' | 'assistant', text: string) => {
    const current = transcriptRef.current;
    const last = current[current.length - 1];
    if (last && last.role === role) {
      const updated = [...current];
      updated[updated.length - 1] = { role, text: last.text + text };
      transcriptRef.current = updated;
      setTranscript(updated);
    } else {
      updateTranscript({ role, text });
    }
  }, [updateTranscript]);

  const playAudioChunk = useCallback((pcm: Int16Array) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const buffer = ctx.createBuffer(1, pcm.length, SAMPLE_RATE_OUT);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) {
      channel[i] = pcm[i] / 0x7FFF;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }, []);

  const sendAudioData = useCallback((pcm: Int16Array) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    if (mutedRef.current) return;
    const base64 = base64EncodeInt16(pcm);
    wsRef.current.send(JSON.stringify({
      realtime_input: {
        parts: [{ inlineData: { mimeType: 'audio/pcm', data: base64 } }],
      },
    }));
  }, []);

  const sendTurnComplete = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      realtime_input: { parts: [] },
    }));
  }, []);

  const cleanup = useCallback(() => {
    reconnectRef.current = false;
    wsRef.current?.close();
    wsRef.current = null;
    vadRef.current?.stop();
    vadRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  const setupWebSocket = useCallback(async () => {
    if (!apiKeyRef.current) return;
    const url = `${WS_URL}?key=${apiKeyRef.current}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      const setupMsg = {
        setup: {
          model: `models/${modelRef.current}`,
          systemInstruction: config.systemPrompt
            ? { parts: [{ text: config.systemPrompt }] }
            : undefined,
          audioConfig: {
            inputAudioFormat: 'PCM_S16LE_16000',
            outputAudioFormat: 'PCM_S16LE_24000',
          },
        },
      };
      ws.send(JSON.stringify(setupMsg));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.setupComplete) {
          setStateSafe('listening');
          return;
        }

        if (msg.serverContent) {
          const sc = msg.serverContent;
          if (sc.interrupted) {
            setStateSafe('listening');
            return;
          }

          setStateSafe('speaking');
          for (const part of sc.parts || []) {
            if (part.inlineData?.mimeType === 'audio/pcm') {
              const pcm = base64ToInt16(part.inlineData.data);
              playAudioChunk(pcm);
            }
            if (part.text) {
              appendPartialText('assistant', part.text);
            }
          }

          if (sc.turnComplete) {
            setStateSafe('listening');
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      setError('Connection lost. Please try again.');
      setStateSafe('disconnected');
    };

    ws.onclose = () => {
      if (reconnectRef.current) {
        reconnectRef.current = false;
        setupWebSocket();
      } else if (stateRef.current !== 'idle') {
        setStateSafe('disconnected');
      }
    };

    wsRef.current = ws;
  }, [config.systemPrompt, playAudioChunk, appendPartialText, setStateSafe]);

  const startSession = useCallback(async () => {
    cleanup();
    setError(null);
    setAudioLevel(0);
    setStateSafe('connecting');
    setTranscript([]);
    transcriptRef.current = [];
    apiKeyRef.current = null;

    try {
      const { data, error: fnErr } = await supabase.functions.invoke<LiveTokenResponse>(
        'generate-live-token',
        { body: { chatbot_id: config.chatbotId } },
      );

      if (fnErr || !data?.token) {
        setError('Failed to start voice session. Please try again.');
        setStateSafe('disconnected');
        return;
      }

      apiKeyRef.current = data.token;
      if (data.model) modelRef.current = data.model;

      audioCtxRef.current = new AudioContext();

      const vad = new VADProcessor();
      vadRef.current = vad;

      await setupWebSocket();

      vad.onAudioData = (pcm) => {
        if (stateRef.current === 'listening') {
          sendAudioData(pcm);
        }
      };
      vad.onAudioLevel = (level) => setAudioLevel(level);
      vad.onSpeechStart = () => {
        if (stateRef.current === 'speaking') {
          reconnectRef.current = true;
          wsRef.current?.close();
          audioCtxRef.current?.close();
          audioCtxRef.current = new AudioContext();
          setStateSafe('listening');
          setupWebSocket();
        }
      };
      vad.onSpeechEnd = () => {
        if (stateRef.current === 'listening') {
          setStateSafe('processing');
          sendTurnComplete();
        }
      };

      await vad.start();
    } catch {
      setError('Microphone access denied or session failed.');
      setStateSafe('disconnected');
    }
  }, [config.chatbotId, setupWebSocket, sendAudioData, sendTurnComplete, cleanup, setStateSafe]);

  const endSession = useCallback(() => {
    cleanup();
    apiKeyRef.current = null;
    setAudioLevel(0);
    setStateSafe('disconnected');
  }, [cleanup, setStateSafe]);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      mutedRef.current = !m;
      return !m;
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    transcript,
    audioLevel,
    error,
    muted,
    startSession,
    endSession,
    toggleMute,
  };
}
