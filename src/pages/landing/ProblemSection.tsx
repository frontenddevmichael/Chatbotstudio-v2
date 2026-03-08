import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const PAINS = [
  { title: 'Hiring support staff is expensive', desc: 'Salaries, training, turnover — it adds up fast.' },
  { title: 'Response time kills conversions', desc: 'Every minute of silence is a customer lost.' },
  { title: 'Generic chatbots frustrate customers', desc: 'Scripted responses feel robotic and unhelpful.' },
];

const ProblemSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-16">
          <motion.h2
            className="font-serif text-[36px] sm:text-[44px] lg:text-[52px] font-normal text-foreground/90 leading-[1.05]"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Your customers have questions.{' '}
            <span className="text-muted-foreground/60">Right now. At 2am.</span>
          </motion.h2>
          <motion.p
            className="text-[15px] text-muted-foreground leading-relaxed self-end"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            There's a growing gap between when your customers need help and when your team is available.
            Email takes hours. Phone lines close. Live chat requires staff. The result? Lost sales and
            opportunities that slip away silently.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {PAINS.map((pain, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-[14px] bg-card border border-border"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
            >
              <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <span className="text-destructive text-[11px] font-bold">✕</span>
              </div>
              <h4 className="text-[15px] font-semibold text-foreground/85 mb-2">{pain.title}</h4>
              <p className="text-[13px] text-muted-foreground/70 leading-relaxed">{pain.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-[15px] font-medium text-primary"
          initial={{ opacity: 0, x: -12 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          ChatBot Studio fixes all three →
        </motion.p>
      </div>
    </section>
  );
};

export default ProblemSection;
