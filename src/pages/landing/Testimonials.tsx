import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "I set up my restaurant chatbot during my lunch break. By dinner service it was answering booking questions automatically.",
    name: 'Amara O.',
    role: 'Restaurant Owner',
    stars: 5,
    rotate: -1,
  },
  {
    quote: "Our law firm needed something that could handle basic queries without us worrying it would say something wrong. ChatBot Studio gives us full control of every answer.",
    name: 'David K.',
    role: 'Law Firm Partner',
    stars: 5,
    rotate: 0,
  },
  {
    quote: "The Supercharge feature is wild. I typed 10 FAQs and suddenly my bot understood 80+ ways customers ask questions.",
    name: 'Priya M.',
    role: 'E-commerce Founder',
    stars: 5,
    rotate: 1.5,
  },
];

const Testimonials = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#0a0a12] px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          Loved by real business owners
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="relative bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 transition-transform duration-300"
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              animate={inView ? { opacity: 1, y: 0, rotate: t.rotate } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              whileHover={{ rotate: 0, y: -4, transition: { duration: 0.2 } }}
            >
              {/* Quote mark */}
              <span className="absolute top-4 right-4 font-display text-6xl text-[#00d4ff]/10 leading-none select-none">"</span>

              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} className="fill-[#ffb547] text-[#ffb547]" />
                ))}
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6 relative z-10">"{t.quote}"</p>

              <div>
                <div className="text-white text-sm font-semibold">{t.name}</div>
                <div className="text-gray-500 text-xs">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
