const NotFound404 = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Chat bubble */}
    <rect x="50" y="30" width="140" height="100" rx="20" className="fill-muted" />
    <path d="M90 130 L110 158 L130 130" className="fill-muted" />
    {/* Question mark */}
    <circle cx="120" cy="68" r="22" className="fill-background" />
    <text
      x="120"
      y="76"
      textAnchor="middle"
      className="fill-foreground font-bold"
      style={{ fontSize: 28, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >
      ?
    </text>
    {/* 404 */}
    <text
      x="120"
      y="172"
      textAnchor="middle"
      className="fill-muted-foreground/40 font-bold tracking-widest"
      style={{ fontSize: 14, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >
      PAGE NOT FOUND
    </text>
  </svg>
);

export default NotFound404;
