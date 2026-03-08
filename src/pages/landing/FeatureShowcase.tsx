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
    title: '⚡ Supercharge FAQ',
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
        <div className="rounded-lg border border-[#1e1e2e] bg-[#0c0c14] p-4">
          <div className="text-xs font-mono text-[#00d4ff] mb-2">Layer 1 — Knowledge Base</div>
          <div className="text-sm text-gray-300 bg-[#111118] rounded p-2">
            <span className="text-gray-500">Q:</span> "What are your hours?"<br />
            <span className="text-[#00d4ff]">→</span> Mon–Sat 9am–6pm, Sun 11am–4pm
          </div>
        </div>
        <div className="rounded-lg border border-[#1e1e2e] bg-[#0c0c14] p-4">
          <div className="text-xs font-mono text-[#ffb547] mb-2">Layer 2 — General AI</div>
          <div className="text-sm text-gray-300 bg-[#111118] rounded p-2">
            <span className="text-gray-500">Q:</span> "Write a return policy"<br />
            <span className="text-[#ffb547]">→</span> Generates a complete, customized policy
          </div>
        </div>
      </div>
    );
  }
  if (tab.id === 'deploy') {
    return (
      <div className="rounded-lg border border-[#1e1e2e] bg-[#0c0c14] p-4 font-mono text-sm">
        <div className="text-gray-500 mb-1">{'<!-- Add to your website -->'}</div>
        <div className="text-[#00d4ff]">{'<script src="chatbot-studio.js"'}</div>
        <div className="text-[#00d4ff] pl-4">{'data-token="your-token" />'}</div>
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
          <div key={s.label} className="rounded-lg border border-[#1e1e2e] bg-[#0c0c14] p-3 text-center">
            <div className="text-xl font-display font-bold text-white">{s.val}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    );
  }
  if (tab.id === 'admin') {
    return (
      <div className="rounded-lg border border-[#1e1e2e] bg-[#0c0c14] overflow-hidden">
        <div className="grid grid-cols-4 text-xs font-mono text-gray-500 p-3 border-b border-[#1e1e2e]">
          <span>User</span><span>Plan</span><span>Bots</span><span>Status</span>
        </div>
        {[['Sarah K.', 'Premium', '3', '●'], ['Mike J.', 'Free', '1', '●'], ['Lisa T.', 'Premium', '7', '●']].map((row, i) => (
          <div key={i} className="grid grid-cols-4 text-sm p-3 border-b border-[#1e1e2e]/50 text-gray-300">
            <span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span>
            <span className="text-emerald-400">{row[3]} Active</span>
          </div>
        ))}
      </div>
    );
  }
  // supercharge
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#1e1e2e] bg-[#0c0c14] p-3 text-sm text-gray-300">
        <span className="text-gray-500">Original:</span> "What are your opening hours?"
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['When do you open?', 'What time do you close?', 'Are you open on weekends?', 'Business hours?'].map((v, i) => (
          <div key={i} className="rounded-lg border border-[#ffb547]/20 bg-[#ffb547]/5 px-3 py-2 text-xs text-[#ffb547]">
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
    <section ref={ref} id="features" className="py-24 md:py-32 bg-[#0a0a12] px-6">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Everything your business chatbot needs
        </motion.h2>
        <motion.p
          className="text-gray-500 text-center mb-16 max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          Built-in intelligence, one-click deployment, total control.
        </motion.p>

        {/* Desktop: side-by-side tabs */}
        <div className="hidden md:grid grid-cols-[280px_1fr] gap-8">
          {/* Tab list */}
          <div className="space-y-1">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(i)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all relative ${
                    active === i ? 'bg-[#111118] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {active === i && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00d4ff] rounded-full"
                    />
                  )}
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* Content panel */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-8 min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-display text-2xl font-bold text-white mb-2">{TABS[active].headline}</h3>
                <ul className="space-y-2 mb-6">
                  {TABS[active].points.map((p, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-[#00d4ff] mt-0.5">✓</span> {p}
                    </li>
                  ))}
                </ul>
                <TabContent tab={TABS[active]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden space-y-3">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            const isOpen = active === i;
            return (
              <div key={tab.id} className="border border-[#1e1e2e] rounded-lg overflow-hidden">
                <button
                  onClick={() => setActive(i)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left bg-[#111118]"
                >
                  <Icon size={18} className={isOpen ? 'text-[#00d4ff]' : 'text-gray-500'} />
                  <span className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-400'}`}>{tab.title}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-[#0c0c14]">
                        <h4 className="font-display text-lg font-bold text-white mb-2">{tab.headline}</h4>
                        <ul className="space-y-1 mb-4">
                          {tab.points.map((p, j) => (
                            <li key={j} className="text-sm text-gray-400">✓ {p}</li>
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
