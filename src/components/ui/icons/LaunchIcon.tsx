import type { IconProps } from './types';

const LaunchIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 4v13m0 0l-4-4m4 4l4-4" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20h16" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 3.5a.5.5 0 110 1 .5.5 0 010-1z" className="fill-current" />
  </svg>
);

export default LaunchIcon;
