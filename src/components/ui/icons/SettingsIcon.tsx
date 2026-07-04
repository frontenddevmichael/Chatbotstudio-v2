import type { IconProps } from './types';

const SettingsIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="3" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.02 4.02l2.12 2.12M17.86 17.86l2.12 2.12M4.02 19.98l2.12-2.12M17.86 6.14l2.12-2.12" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default SettingsIcon;
