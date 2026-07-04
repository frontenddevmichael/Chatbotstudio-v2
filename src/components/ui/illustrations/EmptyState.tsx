import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ icon, title, description, action, className = '' }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border py-16 px-6 ${className}`}>
    {icon || (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="mb-4 h-12 w-12 text-muted-foreground/40"
        aria-hidden="true"
      >
        <rect x="8" y="16" width="48" height="36" rx="6" className="fill-current" opacity="0.3" />
        <rect x="14" y="24" width="36" height="4" rx="2" className="fill-current" opacity="0.5" />
        <rect x="14" y="32" width="24" height="4" rx="2" className="fill-current" opacity="0.4" />
        <rect x="14" y="40" width="16" height="4" rx="2" className="fill-current" opacity="0.3" />
        <path d="M32 52 L44 64 L20 64 Z" className="fill-current" opacity="0.2" />
      </svg>
    )}
    <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
    {description && <p className="mt-1 text-[13px] text-muted-foreground text-center max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
