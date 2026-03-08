import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { MessageSquare, Zap, Code2, BarChart3, Shield } from 'lucide-react';

const TABS = [
  {
    id: 'conversations',
    icon: MessageSquare,
    title: 'Intelligent Conversations',
    headline: 'Two brains. One bot.',
    points: [
      'Answers from your FAQ knowledge base first',
      'Falls back to general AI intelligence for everything else',
      'Remembers full conversation context across messages',
    ],
  },
  {
    id: 'supercharge',
    icon: Zap,
    title: 'Supercharge FAQ',
    headline: 'One question, infinite understanding.',
    points: [
      'AI generates 8 natural language variations per FAQ',
      'Your bot understands every way a customer might ask',
      'One click — powered by advanced AI',
    ],
  },
  {
    id: 'deploy',
    icon: Code2,
    title: 'Deploy Anywhere',
    headline: 'Two lines. Any website.',
    points: [
      'Simple embed code — copy, paste, done',
      'Works on any website, WordPress, Shopify, or custom',
      'Fully responsive — looks great on mobile',
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Real-time Analytics',
    headline: 'Know what your customers ask.',
    points: [
      'Track conversations, messages, and engagement',
      'See trending questions and knowledge gaps',
      'Monitor bot performance over time',
    ],
  },
  {
    id: 'admin',
    icon: Shield,
    title: 'Full Admin Control',
    headline: 'Your platform, your rules.',
    points: [
      'Manage users, chatbots, and billing from one dashboard',
      'Toggle bots on/off instantly',
      'Platform-wide settings and announcements',
    ],
  },
];

const TabContent = ({ tab }: { tab: typeof TABS[0] }) => {
  if (tab.id === 'conversations') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-border bg-background p-4">
          <div className="text-[11px] font-mono text-primary mb-2">Layer 1 — Knowledge</div>
          <div className="text-[13px] text-muted-foreground bg-muted/40 rounded-md p-2">
            <span className="text-muted-foreground/60">Q:</span> "What are your hours?"<br />
            <span className="text-primary">→</span> Mon–Sat 9am–6pm
          </div>
        </div>
        <div className="rounded-[10px] border border-border bg-background p-4">
          <div className="text-[11px] font-mono text-[#ff9f0a] mb-2">Layer 2 — General AI</div>
          <div className="text-[13px] text-muted-foreground bg-muted/40 rounded-md p-2">
            <span className="text-muted-foreground/60">Q:</span> "Write a return policy"<br />
            <span className="text-[#ff9f0a]">→</span> Generates complete policy
          </div>
        </div>
      </div>
    );
  }
  if (tab.id === 'deploy') {
    return (
      <div className="rounded-[10px] border border-border bg-background p-4 font-mono text-[13px]">
        <div className="text-muted-foreground/50 mb-1">{'<!-- Add to your website -->'}</div>
        <div className="text-primary">{'<script src="chatbot-studio.js"'}</div>
        <div className="text-primary pl-4">{'data-token="your-token" />'}</div>
      </div>
    );
  }
  if (tab.id === 'analytics') {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Messages today', val: '247' },
          { label: 'Conversations', val: '89' },
          { label: 'Satisfaction', val: '94%' },
        ].map(s => (
          <div key={s.label} className="rounded-[10px] border border-border bg-background p-3 text-center">
            <div className="font-serif text-[22px] text-foreground/90">{s.val}</div>
            <div className="text-[11px] text-muted-foreground/60 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    );
  }
  if (tab.id === 'admin') {
    return (
      <div className="rounded-[10px] border border-border bg-background overflow-hidden">
        <div className="grid grid-cols-4 text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground/50 p-3 border-b border-border">
          <span>User</span><span>Plan</span><span>Bots</span><span>Status</span>
        </div>
        {[['Sarah K.', 'Premium', '3', 'Active'], ['Mike J.', 'Free', '1', 'Active'], ['Lisa T.', 'Premium', '7', 'Active']].map((row, i) => (
          <div key={i} className="grid grid-cols-4 text-[13px] p-3 border-b border-border/40 text-muted-foreground">
            <span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span>
            <span className="text-[#30d158]">{row[3]}</span>
          </div>
        ))}
      </div>
    );
  }
  // supercharge
  return (
    <div className="space-y-3">
      <div className="rounded-[10px] border border-border bg-background p-3 text-[13px] text-muted-foreground">
        <span className="text-muted-foreground/50">Original:</span> "What are your opening hours?"
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['When do you open?', 'What time do you close?', 'Are you open on weekends?', 'Business hours?'].map((v, i) => (
          <div key={i} className="rounded-[8px] border border-[#ff9f0a]/15 bg-[#ff9f0a]/[0.05] px-3 py-2 text-[12px] text-[#ff9f0a]/80">
            {v}
          </div>
        ))}
      </div>
    </div>
  );
};

const FeatureShowcase = () => {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} id="features" className="py-24 md:py-32 bg-background px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary text-center mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Features
        </motion.p>
        <motion.h2
          className="font-serif text-[36px] sm:text-[44px] font-normal text-foreground/90 text-center mb-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Everything your chatbot needs
        </motion.h2>
        <motion.p
          className="text-[15px] text-muted-foreground text-center mb-16 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15 }}
        >
          Built-in intelligence. One-click deployment. Total control.
        </motion.p>

        {/* Desktop: side-by-side */}
        <div className="hidden md:grid grid-cols-[240px_1fr] gap-6">
          <div className="space-y-0.5">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(i)}
                  className={`w-full text-left px-3 py-2.5 rounded-[8px] flex items-center gap-2.5 transition-all relative ${
                    active === i ? 'bg-muted/60 text-foreground/90' : 'text-muted-foreground hover:text-foreground/60'
                  }`}
                >
                  {active === i && (
                    <motion.div
                      layoutId="activeFeatureTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-full"
                    />
                  )}
                  <Icon size={16} className={active === i ? 'text-primary' : ''} />
                  <span className="text-[13px] font-medium">{tab.title}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-[14px] p-8 min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h3 className="font-serif text-[22px] text-foreground/90 mb-2">{TABS[active].headline}</h3>
                <ul className="space-y-2 mb-6">
                  {TABS[active].points.map((p, i) => (
                    <li key={i} className="text-[13px] text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5 text-[11px]">✓</span> {p}
                    </li>
                  ))}
                </ul>
                <TabContent tab={TABS[active]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden space-y-2">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            const isOpen = active === i;
            return (
              <div key={tab.id} className="border border-border rounded-[10px] overflow-hidden">
                <button
                  onClick={() => setActive(i)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left bg-card"
                >
                  <Icon size={16} className={isOpen ? 'text-primary' : 'text-muted-foreground/60'} />
                  <span className={`text-[13px] font-medium ${isOpen ? 'text-foreground/90' : 'text-muted-foreground'}`}>{tab.title}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-background">
                        <h4 className="font-serif text-[17px] text-foreground/85 mb-2">{tab.headline}</h4>
                        <ul className="space-y-1.5 mb-4">
                          {tab.points.map((p, j) => (
                            <li key={j} className="text-[13px] text-muted-foreground">✓ {p}</li>
                          ))}
                        </ul>
                        <TabContent tab={tab} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
