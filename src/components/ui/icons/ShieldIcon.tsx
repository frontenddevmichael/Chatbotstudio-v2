import type { IconProps } from './types';

const ShieldIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 3L4 6v5c0 5.25 3.5 10.25 8 11 4.5-.75 8-5.75 8-11V6l-8-3z" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ShieldIcon;
