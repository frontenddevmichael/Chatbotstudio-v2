import type { IconProps } from './types';

const FAQIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 4.5C5 3.67 5.67 3 6.5 3h7.59c.4 0 .78.16 1.06.44l3.41 3.41c.28.28.44.66.44 1.06V19.5c0 .83-.67 1.5-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.5v-15z" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 3v3.5c0 .83.67 1.5 1.5 1.5H19" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="12" r="1" className="fill-current" />
    <path d="M12.5 15c0 .83-1.12 1.5-2.5 1.5S7.5 15.83 7.5 15" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default FAQIcon;
