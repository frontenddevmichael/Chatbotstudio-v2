import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface ToolGuideProps {
  storageKey: string;
  title: string;
  description: string;
  steps: string[];
}

const ToolGuide = ({ storageKey, title, description, steps }: ToolGuideProps) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-[14px] border border-primary/20 bg-primary/[0.03] p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Info className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{description}</p>
          <ol className="mt-3 space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-[6px] p-1 text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--color-surface-2))] transition-colors"
          aria-label="Dismiss guide"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ToolGuide;
