import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { X } from 'lucide-react';

const PAINS = [
  { title: 'Hiring support staff is expensive', desc: 'Salaries, training, turnover — it adds up fast.' },
  { title: 'Response time kills conversions', desc: 'Every minute of silence is a customer lost.' },
  { title: 'Generic chatbots frustrate customers', desc: 'Scripted responses feel robotic and unhelpful.' },
];

const ProblemSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#0a0a12] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-16">
          <motion.h2
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Your customers have questions.{' '}
            <span className="text-gray-500">Right now. At 2am.</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-lg leading-relaxed self-end"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            There's a growing gap between when your customers need help and when your team is available.
            Email takes hours. Phone lines close. Live chat requires staff. The result? Lost sales, frustrated
            customers, and opportunities that slip away silently.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {PAINS.map((pain, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-xl bg-[#111118] border border-[#1e1e2e]"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <X size={16} className="text-red-400" />
              </div>
              <h4 className="font-display text-white font-semibold mb-2">{pain.title}</h4>
              <p className="text-sm text-gray-500">{pain.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-[#00d4ff] font-display text-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          ChatBot Studio fixes all three. →
        </motion.p>
      </div>
    </section>
  );
};

export default ProblemSection;
