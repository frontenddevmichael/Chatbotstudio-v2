const ServerError500 = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Server rack */}
    <rect x="60" y="25" width="120" height="130" rx="12" className="fill-muted" />
    {/* Server lines */}
    <rect x="76" y="40" width="88" height="18" rx="4" className="fill-background" />
    <rect x="76" y="66" width="88" height="18" rx="4" className="fill-background" />
    <rect x="76" y="92" width="88" height="18" rx="4" className="fill-background" />
    {/* Error dot */}
    <circle cx="92" cy="49" r="4" className="fill-error" />
    <circle cx="92" cy="75" r="4" className="fill-error" />
    <circle cx="92" cy="101" r="4" className="fill-error" />
    {/* 500 */}
    <text
      x="120"
      y="172"
      textAnchor="middle"
      className="fill-muted-foreground/40 font-bold tracking-widest"
      style={{ fontSize: 14, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >
      SERVER ERROR
    </text>
  </svg>
);

export default ServerError500;
