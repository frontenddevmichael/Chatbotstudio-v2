import type { IconProps } from './types';

const SuperchargeIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M13 3L7 13h4l-1 8 7-11h-4l1-7z" className="stroke-current fill-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default SuperchargeIcon;
