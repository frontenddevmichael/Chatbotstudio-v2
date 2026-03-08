import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCreateChatbot, useUpdateChatbot, useChatbot } from '@/hooks/useChatbot';
import { useCreateFAQ } from '@/hooks/useFAQs';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { Check, ChevronRight, Smile, Briefcase, Coffee, Crown, Sparkles, Copy, ExternalLink, Trash2, Upload } from 'lucide-react';
import { canCreateChatbot } from '@/lib/plans';
import { sanitizeText } from '@/lib/sanitize';
import ReactConfetti from 'react-confetti';

const EMOJIS = ['🤖', '💬', '🧠', '⚡', '🎯', '🚀', '🌟', '🎨', '🔥', '💎', '🦊', '🐱', '🎭', '🌈', '🏢', '📦', '🛒', '🏥', '📚', '🎓'];

const TONES = [
  { value: 'friendly', label: 'Friendly', icon: Smile, desc: 'Warm, approachable, uses contractions' },
  { value: 'professional', label: 'Professional', icon: Briefcase, desc: 'Formal, precise, structured' },
  { value: 'casual', label: 'Casual', icon: Coffee, desc: 'Like texting a smart friend' },
  { value: 'formal', label: 'Formal', icon: Crown, desc: 'Corporate, authoritative' },
];

const COLOR_PRESETS = ['#00d4ff', '#7c3aed', '#00e5a0', '#ff4d6d', '#ffb547', '#3b82f6'];

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
  const [embedToken, setEmbedToken] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isEdit && existingBot) {
      setName(existingBot.name);
      setWelcomeMessage(existingBot.welcome_message || '');
      setAvatarEmoji(existingBot.avatar_emoji || '🤖');
      setTone(existingBot.tone || 'friendly');
      setPrimaryColor(existingBot.primary_color || '#00d4ff');
      setEmbedToken(existingBot.embed_token || '');
    }
  }, [existingBot, isEdit]);

  if (isEdit && loadingBot) {
    return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></PageWrapper>;
  }

  const saveDraft = async (): Promise<string | null> => {
    try {
      if (botId) {
        const result = await updateMutation.mutateAsync({
          id: botId,
          name: sanitizeText(name) || 'Untitled Bot',
          welcome_message: sanitizeText(welcomeMessage),
          avatar_emoji: avatarEmoji,
          tone,
          primary_color: primaryColor,
        });
        if (result.embed_token) setEmbedToken(result.embed_token);
        return botId;
      } else {
        if (!canCreateChatbot(profile, 0)) {
          toast.error('Upgrade to create more chatbots');
          return null;
        }
        const result = await createMutation.mutateAsync({
          name: sanitizeText(name) || 'Untitled Bot',
          welcome_message: sanitizeText(welcomeMessage),
          avatar_emoji: avatarEmoji,
          tone,
          primary_color: primaryColor,
        });
        setBotId(result.id);
        if (result.embed_token) setEmbedToken(result.embed_token);
        return result.id;
      }
    } catch {
      toast.error('Failed to save');
      return null;
    }
  };

  const handleNext = async () => {
    if (step === 1 && !name.trim()) {
      toast.error('Give your chatbot a name');
      return;
    }

    const savedId = await saveDraft();
    if (!savedId) return;

    // Save FAQs on step 3
    if (step === 3) {
      const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
      for (const faq of validFaqs) {
        try {
          await createFAQMutation.mutateAsync({ chatbot_id: savedId, ...faq });
        } catch { /* continue - may already exist */ }
      }
    }

    if (step < 5) {
      const nextStep = step + 1;
      setStep(nextStep);
      // Show confetti when reaching deploy step
      if (nextStep === 5) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  const addFAQ = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const removeFAQ = (index: number) => {
    if (faqs.length <= 1) return;
    setFaqs(faqs.filter((_, i) => i !== index));
  };
  const updateFAQField = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  // File upload handler for .txt and .csv FAQ files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const newFaqs: FAQPair[] = [];
      if (file.name.endsWith('.csv')) {
        // CSV: each row is question,answer
        const lines = text.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          const [question, ...answerParts] = line.split(',');
          const answer = answerParts.join(',').trim();
          if (question?.trim() && answer) {
            newFaqs.push({ question: question.trim().replace(/^"/, '').replace(/"$/, ''), answer: answer.replace(/^"/, '').replace(/"$/, '') });
          }
        }
      } else {
        // TXT: alternating lines Q then A, or "Q: ... A: ..." format
        const lines = text.split('\n').filter((l) => l.trim());
        for (let i = 0; i < lines.length - 1; i += 2) {
          const q = lines[i].replace(/^Q:\s*/i, '').trim();
          const a = lines[i + 1]?.replace(/^A:\s*/i, '').trim();
          if (q && a) newFaqs.push({ question: q, answer: a });
        }
      }
      if (newFaqs.length) {
        setFaqs((prev) => [...prev.filter((f) => f.question || f.answer), ...newFaqs]);
        toast.success(`Imported ${newFaqs.length} FAQs`);
      } else {
        toast.error('No FAQs found in file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const widgetUrl = embedToken ? `${window.location.origin}/widget/${embedToken}` : '';
  const embedCode = widgetUrl
    ? `<iframe src="${widgetUrl}" width="400" height="600" frameborder="0" style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)"></iframe>`
    : '';

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
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Welcome Message</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                maxLength={500}
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
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Add FAQs</h2>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
                <Upload className="h-3.5 w-3.5" />
                Upload .txt/.csv
                <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Teach your chatbot about your business. You can add more later.</p>
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">FAQ {i + 1}</span>
                  {faqs.length > 1 && (
                    <button onClick={() => removeFAQ(i)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFAQField(i, 'question', e.target.value)}
                  placeholder="Question"
                  maxLength={500}
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFAQField(i, 'answer', e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  maxLength={2000}
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
              <div className="mb-3 flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      primaryColor === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{avatarEmoji}</span>
                  <span className="text-sm font-bold text-foreground">{name || 'Your Bot'}</span>
                </div>
                <div className="mb-2 rounded-lg bg-muted p-2.5 text-xs text-foreground">{welcomeMessage || 'Hello!'}</div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground">Type a message...</div>
                  <button className="rounded-md px-3 py-1.5 text-xs font-medium text-primary-foreground" style={{ backgroundColor: primaryColor }}>Send</button>
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

            {embedToken ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">Embed code will be available after saving.</p>
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
