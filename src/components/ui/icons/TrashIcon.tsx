import type { IconProps } from './types';

const TrashIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 6h16" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6v13a2 2 0 002 2h8a2 2 0 002-2V6" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 10v5M14 10v5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default TrashIcon;
