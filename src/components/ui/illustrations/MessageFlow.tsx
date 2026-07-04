const MessageFlow = ({ className = '' }: { className?: string }) => {
  const paths = [
    'M20,100 C30,60 50,40 80,20',
    'M60,110 C50,70 70,30 100,15',
    'M90,100 C110,60 90,20 40,10',
  ];

  return (
    <div className={`relative h-28 w-28 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" fill="none">
        {paths.map((d, i) => (
          <path key={i} d={d} className="stroke-border/40" strokeWidth="1" strokeDasharray="3 3" />
        ))}
      </svg>
      {paths.map((d, i) => (
        <div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-primary/50"
          style={{
            offsetPath: `path("${d}")`,
            offsetDistance: '0%',
            animation: `msgFlow 2.4s ease-in-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes msgFlow {
          0%   { offset-distance: 0%; opacity: 0; }
          10%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MessageFlow;
