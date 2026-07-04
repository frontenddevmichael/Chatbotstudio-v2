import type { IconProps } from './types';

const AnalyticsIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="16" width="4" height="4" rx="1" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10" y="11" width="4" height="9" rx="1" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="16" y="6" width="4" height="14" rx="1" className="stroke-current fill-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    <path d="M4 4l3 4 4-3 4 4 4-4" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default AnalyticsIcon;
