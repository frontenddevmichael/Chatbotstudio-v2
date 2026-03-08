import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Code2, Monitor, Link as LinkIcon, Copy, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type EmbedTab = 'floating' | 'iframe' | 'link';

const TABS: { id: EmbedTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'floating', label: 'Floating Widget', icon: Monitor, desc: 'A chat bubble that floats in the corner of your site.' },
  { id: 'iframe', label: 'Inline Iframe', icon: Code2, desc: 'Embed the chatbot directly inside a page section.' },
  { id: 'link', label: 'Direct Link', icon: LinkIcon, desc: 'Share a standalone chatbot page with anyone.' },
];

const SNIPPETS: Record<EmbedTab, string> = {
  floating: `<!-- Floating Chat Widget -->
<script>
  (function() {
    var d = document, s = d.createElement('iframe');
    s.src = 'https://yourapp.com/widget/YOUR_EMBED_TOKEN';
    s.style.cssText = 'position:fixed;bottom:20px;right:20px;' +
      'width:400px;height:560px;border:none;border-radius:16px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.25);z-index:9999';
    d.body.appendChild(s);
  })();
</script>`,
  iframe: `<!-- Inline Chatbot Embed -->
<iframe
  src="https://yourapp.com/widget/YOUR_EMBED_TOKEN"
  width="100%"
  height="600"
  style="border:none; border-radius:12px;"
  title="ChatBot"
></iframe>`,
  link: `https://yourapp.com/widget/YOUR_EMBED_TOKEN

Share this URL directly — no code needed.
Users can chat with your bot from any browser.`,
};

const STEPS = [
  { num: '01', title: 'Create your bot', desc: 'Set up name, tone, and FAQs in the builder.' },
  { num: '02', title: 'Copy embed code', desc: 'Grab the snippet for your preferred method.' },
  { num: '03', title: 'Paste & go live', desc: 'Add to your site — your bot is live instantly.' },
];

const DeveloperDocs = () => {
  const [active, setActive] = useState<EmbedTab>('floating');
  const [copied, setCopied] = useState(false);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.12 });

  const copy = () => {
    navigator.clipboard.writeText(SNIPPETS[active]);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" ref={ref} className="relative py-28 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">
            For Developers
          </span>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] italic leading-[1.1] text-foreground/90">
            Embed in minutes
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Three simple ways to add your AI chatbot to any website. Copy, paste, done.
          </p>
        </motion.div>

        {/* 3-step flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-6 mb-16"
        >
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-start gap-3">
              <span className="font-serif text-[28px] italic text-muted-foreground/30 leading-none shrink-0">
                {step.num}
              </span>
              <div>
                <p className="text-[14px] font-medium text-foreground/80">{step.title}</p>
                <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
              {i < 2 && <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/20 mt-1 ml-auto shrink-0" />}
            </div>
          ))}
        </motion.div>

        {/* Tabs + code */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-[16px] border border-border bg-card/50 overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActive(tab.id); setCopied(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-[13px] font-medium transition-colors relative ${
                  active === tab.id
                    ? 'text-foreground/90 bg-muted/50'
                    : 'text-muted-foreground/70 hover:text-foreground/60'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {active === tab.id && (
                  <motion.div
                    layoutId="dev-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-foreground/30"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="px-5 py-3 border-b border-border/60">
            <p className="text-[12px] text-muted-foreground/70">
              {TABS.find(t => t.id === active)?.desc}
            </p>
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="p-5 text-[12px] leading-[1.7] text-muted-foreground font-mono overflow-x-auto whitespace-pre">
              {SNIPPETS[active]}
            </pre>
            <button
              onClick={copy}
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-[8px] bg-muted/70 hover:bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground/80 transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DeveloperDocs;
