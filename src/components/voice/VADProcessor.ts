const DEFAULT_SAMPLE_RATE = 16000;
const FRAME_SIZE = 480;
const SILENCE_THRESHOLD = 0.015;
const SPEECH_TIMEOUT_MS = 500;

export class VADProcessor {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isSpeaking = false;
  private silenceStart = 0;
  private level = 0;
  private running = false;

  onSpeechStart: (() => void) | null = null;
  onSpeechEnd: (() => void) | null = null;
  onAudioLevel: ((level: number) => void) | null = null;
  onAudioData: ((pcm: Int16Array) => void) | null = null;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext({ sampleRate: DEFAULT_SAMPLE_RATE });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.source.connect(this.analyser);

    this.processor = this.audioContext.createScriptProcessor(FRAME_SIZE, 1, 1);
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.running = true;
    this.silenceStart = performance.now();

    this.processor.onaudioprocess = (e) => {
      if (!this.running) return;
      const input = e.inputBuffer.getChannelData(0);
      const pcm = this.float32ToInt16(input);
      const rms = this.computeRMS(input);
      this.level = Math.min(rms * 10, 1);
      this.onAudioLevel?.(this.level);

      const now = performance.now();
      if (rms > SILENCE_THRESHOLD) {
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.onSpeechStart?.();
        }
        this.silenceStart = now;
      } else {
        if (this.isSpeaking && now - this.silenceStart > SPEECH_TIMEOUT_MS) {
          this.isSpeaking = false;
          this.onSpeechEnd?.();
        }
      }
      this.onAudioData?.(pcm);
    };
  }

  stop(): void {
    this.running = false;
    this.processor?.disconnect();
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.processor = null;
    this.source = null;
    this.analyser = null;
    this.stream = null;
    this.audioContext = null;
    this.isSpeaking = false;
    this.level = 0;
  }

  get currentLevel(): number {
    return this.level;
  }

  get currentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  private float32ToInt16(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  private computeRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }
}
