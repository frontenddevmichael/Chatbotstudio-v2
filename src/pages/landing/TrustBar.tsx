import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const INDUSTRIES_1 = ['E-commerce', 'Restaurants', 'Law Firms', 'Healthcare', 'Real Estate', 'Education', 'Hospitality', 'Retail'];
const INDUSTRIES_2 = ['Startups', 'Agencies', 'NGOs', 'Consultancies', 'SaaS', 'Finance', 'Fitness', 'Travel'];

const MarqueeRow = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-1.5">
      <div
        className={`flex gap-2 w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ ['--marquee-duration' as string]: '35s' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center px-3 py-1 rounded-full border border-border text-[13px] text-muted-foreground/70 whitespace-nowrap hover:text-foreground/60 hover:border-foreground/10 transition-colors"
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
    <section ref={ref} className="py-12 bg-background border-y border-border/60 overflow-hidden">
      <motion.p
        className="text-center text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/50 mb-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        Built for real businesses
      </motion.p>
      <MarqueeRow items={INDUSTRIES_1} />
      <MarqueeRow items={INDUSTRIES_2} reverse />
    </section>
  );
};

export default TrustBar;
