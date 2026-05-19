import { Smile, Briefcase, Coffee, Crown } from 'lucide-react';

const TONES = [
  { value: 'friendly', label: 'Friendly', icon: Smile, desc: 'Warm, approachable' },
  { value: 'professional', label: 'Professional', icon: Briefcase, desc: 'Formal, precise' },
  { value: 'casual', label: 'Casual', icon: Coffee, desc: 'Like a smart friend' },
  { value: 'formal', label: 'Formal', icon: Crown, desc: 'Corporate, authoritative' },
];

interface Props { tone: string; setTone: (v: string) => void; }

const Step2Personality = ({ tone, setTone }: Props) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {TONES.map(({ value, label, icon: Icon, desc }) => (
      <button
        key={value}
        type="button"
        onClick={() => setTone(value)}
        className={`rounded-[14px] border p-4 text-left transition-all ${
          tone === value ? 'border-primary bg-primary/5' : 'border-border hover:border-[hsl(var(--border)/0.18)]'
        }`}
      >
        <Icon className={`mb-2 h-4 w-4 ${tone === value ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-[14px] font-medium text-foreground">{label}</p>
        <p className="text-[12px] text-muted-foreground">{desc}</p>
      </button>
    ))}
  </div>
);

export default Step2Personality;
