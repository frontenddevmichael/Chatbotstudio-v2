import type { IconProps } from './types';

const CheckIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 13l4 4 10-10" className="stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default CheckIcon;
