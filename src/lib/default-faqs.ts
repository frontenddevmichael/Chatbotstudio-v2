export interface FAQPair {
  question: string;
  answer: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
  faqs: FAQPair[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'plumber',
    label: 'Plumber / Home Services',
    faqs: [
      { question: 'Do you offer emergency plumbing services?', answer: 'Yes, we provide 24/7 emergency plumbing services. Call our emergency line for immediate assistance with burst pipes, severe leaks, and other urgent issues.' },
      { question: 'How much does a typical plumbing visit cost?', answer: 'Our standard service call includes a diagnostic fee, and we provide a free estimate before any work begins. Pricing depends on the complexity of the job.' },
      { question: 'What areas do you serve?', answer: 'We serve within a 30-mile radius of our base location. Contact us to confirm we cover your area.' },
      { question: 'Are you licensed and insured?', answer: 'Yes, we are fully licensed, bonded, and insured for your protection. All our technicians are certified professionals.' },
      { question: 'How do I prevent frozen pipes?', answer: 'Insulate exposed pipes, keep cabinet doors open during cold weather, let faucets drip slightly, and maintain your heating system.' },
    ],
  },
  {
    id: 'salon',
    label: 'Salon / Spa / Barber',
    faqs: [
      { question: 'Do I need to book an appointment?', answer: 'Yes, appointments are recommended to ensure availability. Walk-ins are welcome but subject to stylist availability.' },
      { question: 'What is your cancellation policy?', answer: 'We require 24 hours notice for cancellations. Late cancellations may result in a 50% charge of the service value.' },
      { question: 'What products do you use?', answer: 'We use professional-grade products that are sulfate-free and cruelty-free. We carry brands that prioritize hair and skin health.' },
      { question: 'How long does a typical appointment take?', answer: 'A standard haircut takes 30-45 minutes. Color services range from 1-3 hours depending on complexity.' },
      { question: 'Do you offer gift cards?', answer: 'Yes, we offer digital and physical gift cards in any denomination. They make great gifts for any occasion.' },
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant / Cafe / Bakery',
    faqs: [
      { question: 'Do you take reservations?', answer: 'Yes, we accept reservations for parties of any size. Walk-ins are always welcome based on table availability.' },
      { question: 'Do you accommodate dietary restrictions?', answer: 'Absolutely. We offer gluten-free, vegetarian, and vegan options. Please inform your server about any allergies.' },
      { question: 'What are your hours of operation?', answer: 'We are open Monday through Friday from 11 AM to 10 PM, Saturday from 10 AM to 11 PM, and Sunday from 10 AM to 9 PM.' },
      { question: 'Do you offer takeout or delivery?', answer: 'Yes, we offer both takeout and delivery through our website and partner apps. Online ordering is available.' },
      { question: 'Do you cater events?', answer: 'Yes, we offer full catering services for parties, corporate events, and special occasions. Contact us for a custom quote.' },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce / Online Store',
    faqs: [
      { question: 'What is your return policy?', answer: 'We offer free returns within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5-7 business days.' },
      { question: 'How long does shipping take?', answer: 'Standard shipping takes 3-7 business days. Express shipping (1-3 days) and overnight options are available at checkout.' },
      { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 50 countries. International shipping typically takes 7-14 business days. Duties and taxes may apply.' },
      { question: 'How can I track my order?', answer: 'Once your order ships, you will receive a tracking number via email. You can also track your order in your account dashboard.' },
      { question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, American Express, PayPal, Apple Pay, and Google Pay. All payments are processed securely.' },
    ],
  },
  {
    id: 'dental',
    label: 'Dental / Medical',
    faqs: [
      { question: 'Do you accept my insurance?', answer: 'We accept most major insurance plans. Contact our office with your insurance details and we will verify your coverage.' },
      { question: 'How often should I visit the dentist?', answer: 'We recommend a routine check-up and cleaning every six months to maintain optimal oral health.' },
      { question: 'What should I do in a dental emergency?', answer: 'Call our office immediately. For after-hours emergencies, our answering service will connect you with the on-call dentist.' },
      { question: 'Do you offer payment plans?', answer: 'Yes, we offer flexible payment plans through third-party financing options. Ask about our interest-free plans for qualifying patients.' },
      { question: 'What cosmetic dentistry services do you offer?', answer: 'We offer teeth whitening, veneers, bonding, Invisalign, and full smile makeovers. Schedule a consultation to discuss your goals.' },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    faqs: [
      { question: 'How much is a typical commission?', answer: 'Our commission rate is competitive and transparent. We will discuss all fees upfront during our initial consultation.' },
      { question: 'How long does it take to sell a home?', answer: 'Average time on market varies by location and price point. We will provide a customized marketing plan and timeline for your property.' },
      { question: 'What is the first step to buying a home?', answer: 'The first step is getting pre-approved for a mortgage. We can recommend trusted lenders to help you understand your budget.' },
      { question: 'Do you help with staging?', answer: 'Yes, we provide professional staging consultations and can recommend staging services to help your home sell faster and for a higher price.' },
      { question: 'What areas do you cover?', answer: 'We specialize in residential properties across the metro area. Contact us to discuss your specific location needs.' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal / Law Firm',
    faqs: [
      { question: 'How much does a consultation cost?', answer: 'We offer a free initial consultation to discuss your case and determine how we can help.' },
      { question: 'What types of cases do you handle?', answer: 'We handle cases in family law, personal injury, business law, real estate, and estate planning. Contact us to discuss your specific situation.' },
      { question: 'How long will my case take?', answer: 'Case timelines vary significantly based on complexity and court schedules. We will give you a realistic estimate during your consultation.' },
      { question: 'Will I have to go to court?', answer: 'Many cases are resolved through negotiation or mediation without going to court. We will advise you on the best approach for your situation.' },
      { question: 'How do I prepare for our first meeting?', answer: 'Bring any relevant documents, contracts, or correspondence related to your case. We will guide you through everything else.' },
    ],
  },
  {
    id: 'fitness',
    label: 'Gym / Fitness Studio',
    faqs: [
      { question: 'Do you offer a free trial?', answer: 'Yes, we offer a free 7-day trial pass so you can experience our facilities and classes before committing.' },
      { question: 'What are your membership options?', answer: 'We offer monthly, quarterly, and annual memberships. We also have class-pass options for those who prefer pay-per-visit.' },
      { question: 'What classes do you offer?', answer: 'We offer yoga, Pilates, HIIT, spin, Zumba, strength training, and meditation. Our schedule is updated monthly.' },
      { question: 'Do you have personal trainers?', answer: 'Yes, we have certified personal trainers available for one-on-one sessions. Customized programs start with a fitness assessment.' },
      { question: 'Can I freeze my membership?', answer: 'Yes, you can freeze your membership for up to 3 months per year. A small monthly fee applies during the freeze period.' },
    ],
  },
  {
    id: 'cleaning',
    label: 'Cleaning Services',
    faqs: [
      { question: 'What is included in a standard cleaning?', answer: 'Standard cleaning includes dusting, vacuuming, mopping, kitchen and bathroom cleaning, and trash removal. Deep cleaning adds appliances, windows, and baseboards.' },
      { question: 'How often should I schedule cleaning?', answer: 'Weekly or bi-weekly cleaning works best for maintaining a consistently clean home. Monthly deep cleaning is also popular.' },
      { question: 'Do I need to be home during cleaning?', answer: 'No, many of our clients provide access instructions and we clean while they are at work. Your security is our priority.' },
      { question: 'Are your cleaners insured?', answer: 'Yes, all our cleaners are fully insured and bonded. We perform background checks on every team member.' },
      { question: 'What cleaning products do you use?', answer: 'We use eco-friendly, non-toxic cleaning products that are safe for pets and children. We can also use your preferred products.' },
    ],
  },
];

export function getDefaultFAQs(categoryId: string): FAQPair[] {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category ? [...category.faqs] : [];
}

export function detectCategoryFromText(text: string): string | null {
  const lower = text.toLowerCase();
  const keywords: Record<string, string[]> = {
    plumber: ['plumb', 'pipe', 'leak', 'drain', 'water heater', 'faucet'],
    salon: ['salon', 'hair', 'stylist', 'barber', 'spa', 'manicure', 'pedicure'],
    restaurant: ['restaurant', 'menu', 'cafe', 'bakery', 'dining', 'cuisine', 'chef'],
    ecommerce: ['shop', 'store', 'order', 'shipping', 'checkout', 'cart', 'product'],
    dental: ['dentist', 'dental', 'teeth', 'oral', 'gum', 'tooth'],
    realestate: ['real estate', 'property', 'home', 'listing', 'mortgage', 'realtor'],
    legal: ['law firm', 'attorney', 'lawyer', 'legal', 'court', 'litigation'],
    fitness: ['gym', 'fitness', 'workout', 'yoga', 'pilates', 'personal trainer'],
    cleaning: ['clean', 'maid', 'housekeeping', 'janitorial', 'cleaning service'],
  };

  const scores: [string, number][] = Object.entries(keywords).map(([id, words]) => {
    const score = words.reduce((sum, w) => sum + (lower.includes(w) ? 1 : 0), 0);
    return [id, score];
  });

  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : null;
}
