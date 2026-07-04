import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Plus, Trash2, Globe, Layout, FileText } from 'lucide-react';
import { chatbotNameSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { CATEGORIES, getDefaultFAQs } from '@/lib/default-faqs';
import { useURLCrawl } from '@/hooks/useURLCrawl';
import { useAIGenerateFAQs } from '@/pages/builder/hooks/useFAQImport';
import Spinner from '@/components/ui/Spinner';
import LiveChatDemo from './LiveChatDemo';

interface FAQPair {
  question: string;
  answer: string;
}

const TONES = [
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', desc: 'Formal and precise' },
  { id: 'casual', label: 'Casual', desc: 'Like a smart friend' },
  { id: 'formal', label: 'Formal', desc: 'Corporate and authoritative' },
];

const DEFAULT_FAQS: FAQPair[] = [
  { question: 'What are your hours?', answer: 'We are open Monday to Friday, 9 AM to 6 PM.' },
  { question: 'Where are you located?', answer: 'We are based in San Francisco, CA.' },
];

const INPUT_CLASS = 'w-full rounded-[10px] border border-border bg-muted/30 px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary';

const LandingWizard = () => {
  const { signUp } = useAuth();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [tone, setTone] = useState('friendly');
  const [faqs, setFaqs] = useState<FAQPair[]>(DEFAULT_FAQS);
  const [signingUp, setSigningUp] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Knowledge source
  const [knowledgeTab, setKnowledgeTab] = useState<'manual' | 'crawl' | 'template'>('manual');
  const [crawlUrl, setCrawlUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { crawling, crawl } = useURLCrawl();
  const { generating, generate } = useAIGenerateFAQs();

  const getWizardData = useCallback(() => ({
    name,
    welcomeMessage,
    tone,
    faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
  }), [name, welcomeMessage, tone, faqs]);

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleContinue = async () => {
    if (step === 1) {
      const result = chatbotNameSchema.safeParse(name);
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }
    }
    if (step === 3) {
      const valid = faqs.filter(f => f.question.trim() && f.answer.trim());
      if (valid.length === 0) {
        toast.error('Add at least one FAQ');
        return;
      }
    }
    if (step < 4) {
      setStep(s => s + 1);
    }
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSigningUp(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      localStorage.setItem('landing_wizard_data', JSON.stringify(getWizardData()));
      localStorage.setItem('pending_wizard', 'true');
      setSignedUp(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setSigningUp(false);
    }
  };

  const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
    setFaqs(prev => prev.map((f, j) => j === i ? { ...f, [field]: value } : f));
  };

  const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
  const removeFaq = (i: number) => setFaqs(prev => prev.filter((_, j) => j !== i));

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background px-6">
      <div className="max-w-3xl mx-auto">
        <motion.p
          className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary text-center mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Build Your Bot
        </motion.p>
        <motion.h2
          className="font-display text-[36px] sm:text-[44px] font-normal text-ink text-center mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Create your chatbot in minutes
        </motion.h2>
        <motion.p
          className="text-[15px] text-muted-foreground text-center mb-10 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          Name it, set its personality, add knowledge, and test it live.
        </motion.p>

        <motion.div
          className="max-w-[520px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25 }}
        >
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-primary w-6' : 'bg-border w-1.5'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="bg-card border border-border rounded-[14px] p-6 sm:p-8 min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                {/* Step 1: Identity */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-1">Step 1 of 5</p>
                      <h3 className="text-[20px] font-semibold text-foreground">Name your bot</h3>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-foreground/80 mb-1.5">Bot name</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. ShopBot, SupportAI..."
                        className={INPUT_CLASS}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-foreground/80 mb-1.5">Welcome message</label>
                      <textarea
                        value={welcomeMessage}
                        onChange={e => setWelcomeMessage(e.target.value)}
                        placeholder="Hi! How can I help you today?"
                        className={`${INPUT_CLASS} resize-none h-20`}
                        maxLength={500}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Personality */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-1">Step 2 of 5</p>
                      <h3 className="text-[20px] font-semibold text-foreground">Set the tone</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {TONES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={`text-left p-4 rounded-[10px] border transition-all ${
                            tone === t.id
                              ? 'border-primary bg-primary/5 text-foreground'
                              : 'border-border bg-background text-muted-foreground hover:border-border/60'
                          }`}
                        >
                          <div className="text-[14px] font-medium">{t.label}</div>
                          <div className="text-[12px] mt-0.5 opacity-70">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Knowledge */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-1">Step 3 of 5</p>
                      <h3 className="text-[20px] font-semibold text-foreground">Add knowledge</h3>
                      <p className="text-[13px] text-muted-foreground mt-1">
                        Teach your chatbot about your business
                      </p>
                    </div>

                    {/* Source tabs */}
                    <div className="flex gap-1.5 rounded-[10px] border border-border bg-muted/20 p-1">
                      {[
                        { id: 'manual' as const, label: 'Write', icon: FileText },
                        { id: 'crawl' as const, label: 'Website', icon: Globe },
                        { id: 'template' as const, label: 'Template', icon: Layout },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setKnowledgeTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[12px] font-medium transition-all ${
                            knowledgeTab === tab.id
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Crawl website */}
                    {knowledgeTab === 'crawl' && (
                      <div className="space-y-3">
                        <div className="rounded-[10px] border border-border p-4 space-y-3">
                          <p className="text-[13px] font-medium text-foreground">Import from your website</p>
                          <p className="text-[12px] text-muted-foreground">
                            Enter your website URL and we will extract content to generate FAQs automatically.
                          </p>
                          <div className="flex gap-2">
                            <input
                              value={crawlUrl}
                              onChange={e => setCrawlUrl(e.target.value)}
                              placeholder="yourwebsite.com"
                              className={`${INPUT_CLASS} flex-1 text-[14px]`}
                            />
                            <button
                              onClick={async () => {
                                if (!crawlUrl.trim()) { toast.error('Enter a URL'); return; }
                                const result = await crawl(crawlUrl.trim());
                                if (result) {
                                  const data = await generate(new File([result.text], 'crawled.txt', { type: 'text/plain' }));
                                  if (data.length) {
                                    setFaqs(prev => [...prev.filter(f => f.question || f.answer), ...data]);
                                    toast.success(`Generated ${data.length} FAQs from your website`);
                                  }
                                }
                              }}
                              disabled={crawling || generating || !crawlUrl.trim()}
                              className="shrink-0 rounded-[8px] bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                            >
                              {crawling || generating ? <Spinner className="h-3.5 w-3.5" /> : 'Crawl & Generate'}
                            </button>
                          </div>
                        </div>
                        {/* Show existing FAQs if any were imported */}
                        {faqs.some(f => f.question || f.answer) && (
                          <div className="rounded-[10px] border border-border/60 bg-muted/10 p-3">
                            <p className="text-[11px] font-medium text-muted-foreground mb-2">
                              {faqs.filter(f => f.question && f.answer).length} FAQ(s) loaded
                            </p>
                            <button
                              onClick={() => setKnowledgeTab('manual')}
                              className="text-[12px] text-primary hover:underline"
                            >
                              Edit FAQs manually
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Category template */}
                    {knowledgeTab === 'template' && (
                      <div className="space-y-3">
                        <div className="rounded-[10px] border border-border p-4 space-y-3">
                          <p className="text-[13px] font-medium text-foreground">Start from a template</p>
                          <p className="text-[12px] text-muted-foreground">
                            Pick a business category and we will pre-fill relevant FAQs. You can edit them afterwards.
                          </p>
                          <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className={`${INPUT_CLASS} text-[14px]`}
                          >
                            <option value="">Select a category...</option>
                            {CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (!selectedCategory) { toast.error('Select a category'); return; }
                              const defaults = getDefaultFAQs(selectedCategory);
                              setFaqs(defaults);
                              toast.success(`Loaded ${defaults.length} FAQs for ${CATEGORIES.find(c => c.id === selectedCategory)?.label}`);
                            }}
                            disabled={!selectedCategory}
                            className="rounded-[8px] bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                          >
                            Load Template
                          </button>
                        </div>
                        {faqs.some(f => f.question || f.answer) && (
                          <div className="rounded-[10px] border border-border/60 bg-muted/10 p-3">
                            <p className="text-[11px] font-medium text-muted-foreground mb-2">
                              {faqs.filter(f => f.question && f.answer).length} FAQ(s) loaded
                            </p>
                            <button
                              onClick={() => setKnowledgeTab('manual')}
                              className="text-[12px] text-primary hover:underline"
                            >
                              Edit FAQs manually
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual FAQ editing (visible for all tabs) */}
                    {knowledgeTab === 'manual' && (
                      <>
                        <div className="space-y-3">
                          {faqs.map((faq, i) => (
                            <div key={i} className="rounded-[10px] border border-border p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono text-muted-foreground/50">FAQ #{i + 1}</span>
                                {faqs.length > 1 && (
                                  <button onClick={() => removeFaq(i)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <input
                                value={faq.question}
                                onChange={e => updateFaq(i, 'question', e.target.value)}
                                placeholder="Question"
                                className={`${INPUT_CLASS} text-[14px]`}
                                maxLength={500}
                              />
                              <textarea
                                value={faq.answer}
                                onChange={e => updateFaq(i, 'answer', e.target.value)}
                                placeholder="Answer"
                                className={`${INPUT_CLASS} resize-none h-16 text-[14px]`}
                                maxLength={2000}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={addFaq}
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add another FAQ
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Step 4: Preview */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-1">Step 4 of 5</p>
                      <h3 className="text-[20px] font-semibold text-foreground">Test your bot</h3>
                      <p className="text-[13px] text-muted-foreground mt-1">
                        Watch a live demo with your bot, then try asking your own questions.
                      </p>
                    </div>
                    <LiveChatDemo botName={name || 'ShopBot'} welcomeMessage={welcomeMessage} />
                  </div>
                )}

                {/* Step 5: Claim */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-1">Step 5 of 5</p>
                      <h3 className="text-[20px] font-semibold text-foreground">
                        {signedUp ? 'Check your email' : 'Create your free account'}
                      </h3>
                      <p className="text-[13px] text-muted-foreground mt-1">
                        {signedUp
                          ? `We sent a verification email to ${email}. Click the link to activate your account and your bot will be built automatically.`
                          : 'Save your bot and start chatting with customers.'}
                      </p>
                    </div>

                    {signedUp ? (
                      <div className="rounded-[10px] border border-border bg-background p-6 text-center">
                        <div className="text-[40px] mb-3">✉️</div>
                        <p className="text-[14px] text-muted-foreground">
                          Verification sent to <span className="font-medium text-foreground">{email}</span>
                        </p>
                        <p className="text-[12px] text-muted-foreground/50 mt-2">
                          After verifying, your bot will be built automatically.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[13px] font-medium text-foreground/80 mb-1.5">Full name</label>
                          <input
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-foreground/80 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-foreground/80 mb-1.5">Password</label>
                          <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className={INPUT_CLASS}
                          />
                        </div>
                        {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                          <Turnstile
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                            onSuccess={setTurnstileToken}
                            options={{ size: 'flexible', theme: 'auto' }}
                          />
                        )}
                        <button
                          onClick={handleSignUp}
                          disabled={signingUp || (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken)}
                          className="w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                          {signingUp ? 'Creating account...' : 'Create Account'}
                        </button>
                        <p className="text-[11px] text-muted-foreground/40 text-center">
                          No credit card required. Free forever.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="inline-flex items-center gap-1 rounded-[10px] border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-25"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            {step < 4 ? (
              <button
                onClick={handleContinue}
                className="rounded-[10px] bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
              >
                Continue
              </button>
            ) : step === 4 ? (
              <button
                onClick={() => setStep(5)}
                className="rounded-[10px] bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
              >
                Continue
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingWizard;
