import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "I set up my restaurant chatbot during my lunch break. By dinner service it was answering booking questions automatically.",
    name: 'Amara O.',
    role: 'Restaurant Owner',
  },
  {
    quote: "Our law firm needed something that could handle basic queries without us worrying it would say something wrong. ChatBot Studio gives us full control of every answer.",
    name: 'David K.',
    role: 'Law Firm Partner',
  },
  {
    quote: "The Supercharge feature is wild. I typed 10 FAQs and suddenly my bot understood 80+ ways customers ask questions.",
    name: 'Priya M.',
    role: 'E-commerce Founder',
  },
];

const Testimonials = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-black px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0a84ff] text-center mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Testimonials
        </motion.p>
        <motion.h2
          className="font-serif text-[36px] sm:text-[44px] font-normal text-white/90 text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Loved by real business owners
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="relative bg-[#0a0a0a] border border-white/[0.06] rounded-[14px] p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={12} className="fill-[#ff9f0a] text-[#ff9f0a]" />
                ))}
              </div>

              <p className="text-[14px] text-white/55 leading-relaxed mb-6">"{t.quote}"</p>

              <div>
                <div className="text-[14px] font-medium text-white/80">{t.name}</div>
                <div className="text-[12px] text-white/30">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
