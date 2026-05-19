import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCreateChatbot, useUpdateChatbot, useChatbot, useChatbots } from '@/hooks/useChatbot';
import { useCreateFAQ } from '@/hooks/useFAQs';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { canCreateChatbot } from '@/lib/plans';
import { sanitizeText } from '@/lib/sanitize';
import { chatbotNameSchema } from '@/lib/validations';
import ReactConfetti from 'react-confetti';
import Step1Identity from './steps/Step1Identity';
import Step2Personality from './steps/Step2Personality';
import Step3Knowledge from './steps/Step3Knowledge';
import Step4Appearance from './steps/Step4Appearance';
import Step5Deploy from './steps/Step5Deploy';
import type { FAQPair } from './hooks/useFAQImport';

const STEP_NAMES = ['Identity', 'Personality', 'Knowledge', 'Appearance', 'Deploy'];
const INPUT_CLASS = "w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";

const ChatbotBuilder = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const createMutation = useCreateChatbot();
  const updateMutation = useUpdateChatbot();
  const createFAQMutation = useCreateFAQ();
  const { data: existingBot, isLoading: loadingBot } = useChatbot(id || '');
  const { data: chatbots } = useChatbots();

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
  const [saving, setSaving] = useState(false);

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
      }
      const currentCount = chatbots?.length ?? 0;
      if (!canCreateChatbot(profile, currentCount)) {
        toast.error('Upgrade to create more chatbots');
        return null;
      }
      const result = await createMutation.mutateAsync(payload);
      setBotId(result.id);
      if (result.embed_token) setEmbedToken(result.embed_token);
      return result.id;
    } catch (err: unknown) {
      console.error('saveDraft failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save chatbot');
      return null;
    }
  };

  const handleNext = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (step === 1) {
        const nameResult = chatbotNameSchema.safeParse(name);
        if (!nameResult.success) { toast.error(nameResult.error.errors[0].message); return; }
      }
      const savedId = await saveDraft();
      if (!savedId) return;

      if (step === 3) {
        const valid = faqs.filter(f => f.question.trim() && f.answer.trim());
        const newOnes = valid.filter(f => !savedFaqsRef.current.has(`${f.question}::${f.answer}`));
        if (newOnes.length) {
          const results = await Promise.allSettled(
            newOnes.map(f => createFAQMutation.mutateAsync({ chatbot_id: savedId, ...f }))
          );
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') savedFaqsRef.current.add(`${newOnes[i].question}::${newOnes[i].answer}`);
          });
          const failed = results.filter(r => r.status === 'rejected').length;
          if (failed > 0) toast.warning(`${failed} FAQ(s) failed to save, but you can continue`);
        }
      }

      if (step < 5) {
        const next = step + 1;
        setStep(next);
        if (next === 5) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          toast.success('🎉 Chatbot created successfully!');
        }
      }
    } catch (err: unknown) {
      console.error('handleNext error:', err);
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <SEO title={isEdit ? `Edit ${name}` : 'New Chatbot'} noIndex />
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={300} />}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[12px] text-muted-foreground">Step {step} of 5</p>
          <h1 className="text-[22px] font-semibold text-foreground">{STEP_NAMES[step - 1]}</h1>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1.5 w-1.5 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[480px]">
        {step === 1 && (
          <Step1Identity
            name={name} setName={setName}
            welcomeMessage={welcomeMessage} setWelcomeMessage={setWelcomeMessage}
            avatarEmoji={avatarEmoji} setAvatarEmoji={setAvatarEmoji}
            avatarType={avatarType} setAvatarType={setAvatarType}
            primaryColor={primaryColor} inputClass={INPUT_CLASS}
          />
        )}
        {step === 2 && <Step2Personality tone={tone} setTone={setTone} />}
        {step === 3 && <Step3Knowledge faqs={faqs} setFaqs={setFaqs} inputClass={INPUT_CLASS} />}
        {step === 4 && (
          <Step4Appearance
            primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
            name={name} welcomeMessage={welcomeMessage}
            avatarEmoji={avatarEmoji} avatarType={avatarType}
          />
        )}
        {step === 5 && <Step5Deploy embedToken={embedToken} primaryColor={primaryColor} botId={botId} />}

        {step < 5 && (
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1 || saving}
              className="inline-flex items-center gap-1 rounded-[10px] border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-[hsl(var(--color-surface-1))] disabled:opacity-25"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="rounded-[10px] bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 transition-all"
            >
              {saving ? <Spinner className="h-4 w-4" /> : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ChatbotBuilder;
