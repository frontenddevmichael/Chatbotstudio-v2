import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCreateChatbot, useUpdateChatbot, useChatbot } from '@/hooks/useChatbot';
import { useCreateFAQ } from '@/hooks/useFAQs';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { ChevronLeft, Smile, Briefcase, Coffee, Crown, Sparkles, Copy, ExternalLink, Trash2, Upload } from 'lucide-react';
import { canCreateChatbot } from '@/lib/plans';
import { sanitizeText } from '@/lib/sanitize';
import { chatbotNameSchema } from '@/lib/validations';
import ReactConfetti from 'react-confetti';
import AvatarPicker from '@/components/chatbot/AvatarPicker';
import BotAvatar from '@/components/chatbot/BotAvatar';
import ColorPicker from '@/components/chatbot/ColorPicker';

const TONES = [
  { value: 'friendly', label: 'Friendly', icon: Smile, desc: 'Warm, approachable' },
  { value: 'professional', label: 'Professional', icon: Briefcase, desc: 'Formal, precise' },
  { value: 'casual', label: 'Casual', icon: Coffee, desc: 'Like a smart friend' },
  { value: 'formal', label: 'Formal', icon: Crown, desc: 'Corporate, authoritative' },
];

interface FAQPair { question: string; answer: string; }

const STEP_NAMES = ['Identity', 'Personality', 'Knowledge', 'Appearance', 'Deploy'];

const ChatbotBuilder = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const createMutation = useCreateChatbot();
  const updateMutation = useUpdateChatbot();
  const createFAQMutation = useCreateFAQ();
  const { data: existingBot, isLoading: loadingBot } = useChatbot(id || '');

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [avatarEmoji, setAvatarEmoji] = useState('bot');
  const [avatarType, setAvatarType] = useState<'icon' | 'initials'>('icon');
  const [tone, setTone] = useState('friendly');
  const [faqs, setFaqs] = useState<FAQPair[]>([{ question: '', answer: '' }]);
  const [primaryColor, setPrimaryColor] = useState('#0a84ff');
  const [botId, setBotId] = useState<string | null>(id || null);
  const [embedToken, setEmbedToken] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const savedFaqsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isEdit && existingBot) {
      setName(existingBot.name);
      setWelcomeMessage(existingBot.welcome_message || '');
      const av = existingBot.avatar_emoji || 'bot';
      if (/[^\x00-\x7F]/.test(av)) { setAvatarType('initials'); setAvatarEmoji('initials'); }
      else setAvatarEmoji(av);
      setTone(existingBot.tone || 'friendly');
      setPrimaryColor(existingBot.primary_color || '#0a84ff');
      setEmbedToken(existingBot.embed_token || '');
    }
  }, [existingBot, isEdit]);

  if (isEdit && loadingBot) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div></PageWrapper>;

  const saveDraft = async (): Promise<string | null> => {
    try {
      const avatarValue = avatarType === 'initials' ? 'initials' : avatarEmoji;
      const payload = {
        name: sanitizeText(name) || 'Untitled Bot',
        welcome_message: sanitizeText(welcomeMessage),
        avatar_emoji: avatarValue,
        tone,
        primary_color: primaryColor,
      };
      if (botId) {
        const result = await updateMutation.mutateAsync({ id: botId, ...payload });
        if (result.embed_token) setEmbedToken(result.embed_token);
        return botId;
      } else {
        if (!canCreateChatbot(profile, 0)) { toast.error('Upgrade to create more chatbots'); return null; }
        const result = await createMutation.mutateAsync(payload);
        setBotId(result.id);
        if (result.embed_token) setEmbedToken(result.embed_token);
        return result.id;
      }
    } catch (err: any) {
      console.error('saveDraft failed:', err);
      toast.error(err?.message || 'Failed to save chatbot');
      return null;
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const nameResult = chatbotNameSchema.safeParse(name);
      if (!nameResult.success) { toast.error(nameResult.error.errors[0].message); return; }
    }
    const savedId = await saveDraft();
    if (!savedId) return;
    if (step === 3) {
      const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
      for (const faq of validFaqs) {
        const key = `${faq.question}::${faq.answer}`;
        if (savedFaqsRef.current.has(key)) continue;
        try { await createFAQMutation.mutateAsync({ chatbot_id: savedId, ...faq }); savedFaqsRef.current.add(key); } catch { /* continue */ }
      }
    }
    if (step < 5) {
      const next = step + 1;
      setStep(next);
      if (next === 5) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 5000); }
    }
  };

  const addFAQ = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const removeFAQ = (i: number) => { if (faqs.length <= 1) return; setFaqs(faqs.filter((_, idx) => idx !== i)); };
  const updateFAQField = (i: number, field: 'question' | 'answer', value: string) => { const u = [...faqs]; u[i][field] = value; setFaqs(u); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const newFaqs: FAQPair[] = [];
      if (file.name.endsWith('.csv')) {
        text.split('\n').filter(l => l.trim()).forEach(line => {
          const [q, ...rest] = line.split(',');
          const a = rest.join(',').trim();
          if (q?.trim() && a) newFaqs.push({ question: q.trim().replace(/^"|"$/g, ''), answer: a.replace(/^"|"$/g, '') });
        });
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length - 1; i += 2) {
          const q = lines[i].replace(/^Q:\s*/i, '').trim();
          const a = lines[i + 1]?.replace(/^A:\s*/i, '').trim();
          if (q && a) newFaqs.push({ question: q, answer: a });
        }
      }
      if (newFaqs.length) { setFaqs(prev => [...prev.filter(f => f.question || f.answer), ...newFaqs]); toast.success(`Imported ${newFaqs.length} FAQs`); }
      else toast.error('No FAQs found in file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const widgetUrl = embedToken ? `${window.location.origin}/widget/${embedToken}` : '';
  const embedCode = widgetUrl ? `<iframe src="${widgetUrl}" width="400" height="600" frameborder="0" style="border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.15)"></iframe>` : '';

  const inputClass = "w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";

  return (
    <PageWrapper>
      <SEO title={isEdit ? `Edit ${name}` : 'New Chatbot'} noIndex />
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={300} />}

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[12px] text-muted-foreground">Step {step} of 5</p>
          <h1 className="text-[22px] font-semibold text-foreground">{STEP_NAMES[step - 1]}</h1>
        </div>
        {/* Dots */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1.5 w-1.5 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[480px]">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Chatbot Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Support Bot" maxLength={100} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Welcome Message</label>
              <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} maxLength={500} className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-muted-foreground">Avatar</label>
              <AvatarPicker value={avatarEmoji} avatarType={avatarType} botName={name} accentColor={primaryColor} onChangeType={setAvatarType} onChangeIcon={setAvatarEmoji} />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {TONES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={`rounded-[14px] border p-4 text-left transition-all ${
                    tone === value ? 'border-primary bg-primary/5' : 'border-border hover:border-[hsl(var(--border)/0.18)]'
                  }`}
                >
                  <Icon className={`mb-2 h-4 w-4 ${tone === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-[14px] font-medium text-foreground">{label}</p>
                  <p className="text-[12px] text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">Teach your chatbot about your business</p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Upload className="h-3 w-3" /> Upload
                <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2 rounded-[14px] border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">FAQ {i + 1}</span>
                  {faqs.length > 1 && (
                    <button onClick={() => removeFAQ(i)} className="rounded-[6px] p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <input type="text" value={faq.question} onChange={(e) => updateFAQField(i, 'question', e.target.value)} placeholder="Question" maxLength={500} className={inputClass} />
                <textarea value={faq.answer} onChange={(e) => updateFAQField(i, 'answer', e.target.value)} placeholder="Answer" rows={2} maxLength={2000} className={inputClass} />
              </div>
            ))}
            <button onClick={addFAQ} className="text-[13px] font-medium text-primary hover:underline">+ Add another FAQ</button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-muted-foreground">Primary Color</label>
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
            </div>
            <div className="rounded-[14px] border border-border bg-card p-5">
              <p className="mb-3 text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">Preview</p>
              <div className="mx-auto w-64 rounded-[14px] border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <BotAvatar avatarEmoji={avatarType === 'initials' ? 'initials' : avatarEmoji} botName={name} accentColor={primaryColor} size="sm" />
                  <span className="text-[13px] font-semibold text-foreground">{name || 'Your Bot'}</span>
                </div>
                <div className="mb-2 rounded-[10px] bg-[hsl(var(--color-surface-2))] p-2.5 text-[12px] text-foreground">{welcomeMessage || 'Hello!'}</div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-full border border-border bg-[hsl(var(--color-surface-3))] px-2.5 py-1 text-[11px] text-muted-foreground">Message...</div>
                  <button className="rounded-full px-3 py-1 text-[11px] font-medium text-white" style={{ backgroundColor: primaryColor }}>Send</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h2 className="text-[22px] font-semibold text-foreground">Your chatbot is ready!</h2>
            <p className="text-[13px] text-muted-foreground">Deploy it anywhere with the embed code</p>
            {embedToken ? (
              <>
                <div className="rounded-[14px] border border-border bg-card p-4 text-left">
                  <p className="mb-2 text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">Embed Code</p>
                  <pre className="overflow-x-auto rounded-[10px] bg-[hsl(var(--color-surface-3))] p-3 font-mono text-[12px] text-foreground">{embedCode}</pre>
                  <button onClick={() => { navigator.clipboard.writeText(embedCode); toast.success('Copied!'); }} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
                    <Copy className="h-3 w-3" /> Copy code
                  </button>
                </div>
                <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Open live preview
                </a>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">Embed code will be available after saving.</p>
            )}
            <div>
              <button
                onClick={() => navigate(botId ? `/chatbot/${botId}` : '/dashboard')}
                className="rounded-[10px] bg-primary px-6 py-2.5 text-[15px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="inline-flex items-center gap-1 rounded-[10px] border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-[hsl(var(--color-surface-1))] disabled:opacity-25"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-[10px] bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 transition-all"
            >
              {createMutation.isPending || updateMutation.isPending ? <Spinner /> : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ChatbotBuilder;
