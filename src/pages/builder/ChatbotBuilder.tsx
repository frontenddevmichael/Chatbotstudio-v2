import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCreateChatbot, useUpdateChatbot, useChatbot } from '@/hooks/useChatbot';
import { useCreateFAQ } from '@/hooks/useFAQs';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { Check, ChevronRight, Smile, Briefcase, Coffee, Crown, Sparkles, Copy, ExternalLink } from 'lucide-react';
import { canCreateChatbot } from '@/lib/plans';
import ReactConfetti from 'react-confetti';

const EMOJIS = ['🤖', '💬', '🧠', '⚡', '🎯', '🚀', '🌟', '🎨', '🔥', '💎', '🦊', '🐱', '🎭', '🌈'];

const TONES = [
  { value: 'friendly', label: 'Friendly', icon: Smile, desc: 'Warm, approachable, uses contractions' },
  { value: 'professional', label: 'Professional', icon: Briefcase, desc: 'Formal, precise, structured' },
  { value: 'casual', label: 'Casual', icon: Coffee, desc: 'Like texting a smart friend' },
  { value: 'formal', label: 'Formal', icon: Crown, desc: 'Corporate, authoritative' },
];

interface FAQPair { question: string; answer: string; }

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
  const [avatarEmoji, setAvatarEmoji] = useState('🤖');
  const [tone, setTone] = useState('friendly');
  const [faqs, setFaqs] = useState<FAQPair[]>([{ question: '', answer: '' }]);
  const [primaryColor, setPrimaryColor] = useState('#00d4ff');
  const [botId, setBotId] = useState<string | null>(id || null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isEdit && existingBot) {
      setName(existingBot.name);
      setWelcomeMessage(existingBot.welcome_message || '');
      setAvatarEmoji(existingBot.avatar_emoji || '🤖');
      setTone(existingBot.tone || 'friendly');
      setPrimaryColor(existingBot.primary_color || '#00d4ff');
    }
  }, [existingBot, isEdit]);

  if (isEdit && loadingBot) {
    return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></PageWrapper>;
  }

  const saveDraft = async () => {
    try {
      if (botId) {
        await updateMutation.mutateAsync({
          id: botId,
          name: name || 'Untitled Bot',
          welcome_message: welcomeMessage,
          avatar_emoji: avatarEmoji,
          tone,
          primary_color: primaryColor,
        });
      } else {
        if (!canCreateChatbot(profile, 0)) {
          toast.error('Upgrade to create more chatbots');
          return;
        }
        const result = await createMutation.mutateAsync({
          name: name || 'Untitled Bot',
          welcome_message: welcomeMessage,
          avatar_emoji: avatarEmoji,
          tone,
          primary_color: primaryColor,
        });
        setBotId(result.id);
      }
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleNext = async () => {
    if (step === 1 && !name.trim()) { toast.error('Give your chatbot a name'); return; }
    await saveDraft();
    if (step === 3 && botId) {
      const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
      for (const faq of validFaqs) {
        try {
          await createFAQMutation.mutateAsync({ chatbot_id: botId, ...faq });
        } catch { /* continue */ }
      }
    }
    if (step < 5) setStep(step + 1);
    if (step === 4) {
      await saveDraft();
      setStep(5);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const addFAQ = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const updateFAQField = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const embedToken = existingBot?.embed_token || '';
  const widgetUrl = `${window.location.origin}/widget/${embedToken}`;
  const embedCode = `<iframe src="${widgetUrl}" width="400" height="600" frameborder="0" style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)"></iframe>`;

  return (
    <PageWrapper>
      <SEO title={isEdit ? `Edit ${name}` : 'New Chatbot'} noIndex />
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={300} />}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 5 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {['Identity', 'Personality', 'Knowledge Base', 'Appearance', 'Deploy'][step - 1]}
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">Name your chatbot</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Chatbot Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Support Bot"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Welcome Message</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setAvatarEmoji(e)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-all ${
                      avatarEmoji === e ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personality */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">Choose a personality</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TONES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    tone === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Icon className={`mb-2 h-5 w-5 ${tone === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Knowledge Base */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">Add FAQs</h2>
            <p className="text-sm text-muted-foreground">Teach your chatbot about your business. You can add more later.</p>
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-4">
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFAQField(i, 'question', e.target.value)}
                  placeholder="Question"
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFAQField(i, 'answer', e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
            <button onClick={addFAQ} className="text-sm font-medium text-primary hover:underline">
              + Add another FAQ
            </button>
          </div>
        )}

        {/* Step 4: Appearance */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">Customize appearance</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 rounded-md border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            {/* Live preview */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Preview</p>
              <div className="mx-auto w-64 rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2" style={{ color: primaryColor }}>
                  <span className="text-xl">{avatarEmoji}</span>
                  <span className="text-sm font-bold">{name || 'Your Bot'}</span>
                </div>
                <div className="mb-2 rounded-lg bg-muted p-2.5 text-xs text-foreground">{welcomeMessage}</div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground">Type a message...</div>
                  <button className="rounded-md px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: primaryColor, color: '#000' }}>Send</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Deploy */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h2 className="font-display text-2xl font-bold text-foreground">Your chatbot is ready! 🎉</h2>
            <p className="text-sm text-muted-foreground">Deploy it anywhere with the embed code below</p>

            {embedToken && (
              <>
                <div className="rounded-lg border border-border bg-card p-4 text-left">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Embed Code</p>
                  <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-xs text-foreground">{embedCode}</pre>
                  <button
                    onClick={() => { navigator.clipboard.writeText(embedCode); toast.success('Copied!'); }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Copy className="h-3 w-3" /> Copy code
                  </button>
                </div>
                <a
                  href={widgetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> Open live preview
                </a>
              </>
            )}

            <div>
              <button
                onClick={() => navigate(botId ? `/chatbot/${botId}` : '/dashboard')}
                className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
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
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? <Spinner /> : step === 4 ? 'Deploy' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ChatbotBuilder;
