import type { IconProps } from './types';

const CopyIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="8" y="8" width="12" height="12" rx="1.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8V5.5C16 4.67 15.33 4 14.5 4h-9C4.67 4 4 4.67 4 5.5v9c0 .83.67 1.5 1.5 1.5H8" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default CopyIcon;
