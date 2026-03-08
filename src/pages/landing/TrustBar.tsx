import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const INDUSTRIES_1 = ['E-commerce', 'Restaurants', 'Law Firms', 'Healthcare', 'Real Estate', 'Education', 'Hospitality', 'Retail'];
const INDUSTRIES_2 = ['Startups', 'Agencies', 'NGOs', 'Consultancies', 'SaaS', 'Finance', 'Fitness', 'Travel'];

const MarqueeRow = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-2">
      <div
        className={`flex gap-3 w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ ['--marquee-duration' as string]: '30s' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#1e1e2e] text-sm text-gray-400 whitespace-nowrap hover:border-[#00d4ff]/30 hover:text-[#00d4ff] transition-colors"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const TrustBar = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="py-16 bg-[#080810] border-y border-[#1e1e2e]/50 overflow-hidden">
      <motion.h3
        className="text-center font-display text-sm tracking-[0.2em] uppercase text-gray-500 mb-8"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        Built for real businesses
      </motion.h3>
      <MarqueeRow items={INDUSTRIES_1} />
      <MarqueeRow items={INDUSTRIES_2} reverse />
    </section>
  );
};

export default TrustBar;
