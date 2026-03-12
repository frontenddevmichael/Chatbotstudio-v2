import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Monitor, Link as LinkIcon, Copy, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type EmbedTab = 'sdk' | 'link';

const TABS: { id: EmbedTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'sdk', label: 'SDK Embed', icon: Monitor, desc: 'Lightweight launcher with toggle bubble, lazy loading, and mobile support.' },
  { id: 'link', label: 'Direct Link', icon: LinkIcon, desc: 'Share a standalone chatbot page with anyone.' },
];

const SNIPPETS: Record<EmbedTab, string> = {
  sdk: `<!-- ChatBot Studio Embed -->
<script>
  window.$chatbot = {
    id: "YOUR_EMBED_TOKEN",
    color: "#0a84ff",
    position: "bottom-right"
  };
</script>
<script src="https://ideaweave-bot.lovable.app/embed.js" async></script>`,
  link: `https://ideaweave-bot.lovable.app/widget/YOUR_EMBED_TOKEN

Share this URL directly — no code needed.
Users can chat with your bot from any browser.`,
};

const STEPS = [
  { num: '01', title: 'Create your bot', desc: 'Set up name, tone, and FAQs in the builder.' },
  { num: '02', title: 'Copy embed code', desc: 'Grab the snippet for your preferred method.' },
  { num: '03', title: 'Paste & go live', desc: 'Add to your site — your bot is live instantly.' },
];

const DeveloperDocs = () => {
  const [active, setActive] = useState<EmbedTab>('sdk');
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-16">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">For Developers</span>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] italic leading-[1.1] text-foreground/90">Embed in minutes</h2>
          <p className="mt-4 text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed">Two simple ways to add your AI chatbot to any website. Copy, paste, done.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="grid sm:grid-cols-3 gap-6 mb-16">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-start gap-3">
              <span className="font-serif text-[28px] italic text-muted-foreground/30 leading-none shrink-0">{step.num}</span>
              <div>
                <p className="text-[14px] font-medium text-foreground/80">{step.title}</p>
                <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
              {i < 2 && <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/20 mt-1 ml-auto shrink-0" />}
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-[16px] border border-border bg-card/50 overflow-hidden">
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActive(tab.id); setCopied(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-[13px] font-medium transition-colors relative ${active === tab.id ? 'text-foreground/90 bg-muted/50' : 'text-muted-foreground/70 hover:text-foreground/60'}`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {active === tab.id && <motion.div layoutId="dev-tab-indicator" className="absolute bottom-0 left-0 right-0 h-px bg-foreground/30" />}
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-b border-border/60">
            <p className="text-[12px] text-muted-foreground/70">{TABS.find(t => t.id === active)?.desc}</p>
          </div>
          <div className="relative">
            <pre className="p-5 text-[12px] leading-[1.7] text-muted-foreground font-mono overflow-x-auto whitespace-pre">{SNIPPETS[active]}</pre>
            <button onClick={copy} className="absolute top-3 right-3 flex items-center gap-1.5 rounded-[8px] bg-muted/70 hover:bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground/80 transition-colors">
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
