import type { IconProps } from './types';

const BotIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="5" width="16" height="13" rx="4.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9.5" cy="11" r="1.5" className="fill-current" />
    <circle cx="14.5" cy="11" r="1.5" className="fill-current" />
    <path d="M8 16c1 .7 2.5 1 4 1s3-.3 4-1" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 5V3" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 3h6" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default BotIcon;
