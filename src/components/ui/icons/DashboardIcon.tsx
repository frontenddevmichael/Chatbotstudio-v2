import type { IconProps } from './types';

const DashboardIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="3" width="8" height="4" rx="1.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="9" width="8" height="4" rx="1.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="15" width="8" height="6" rx="1.5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default DashboardIcon;
