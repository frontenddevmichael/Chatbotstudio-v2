interface HealthScoreProps {
  score: number; // 0-100
  size?: number;
}

const HealthScore = ({ score, size = 40 }: HealthScoreProps) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? 'hsl(var(--success))' :
    score >= 50 ? 'hsl(var(--warning))' :
    'hsl(var(--destructive))';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={3}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-foreground">{score}</span>
    </div>
  );
};

export function calculateHealthScore(bot: {
  welcome_message?: string | null;
  tone?: string | null;
  avatar_emoji?: string | null;
  is_active?: boolean | null;
  total_conversations?: number | null;
}, faqCount: number): number {
  let score = 0;
  if (bot.welcome_message) score += 20;
  if (bot.tone) score += 10;
  if (bot.avatar_emoji && bot.avatar_emoji !== 'bot') score += 10;
  if (bot.is_active) score += 10;
  if (faqCount >= 1) score += 15;
  if (faqCount >= 5) score += 15;
  if (faqCount >= 10) score += 10;
  if ((bot.total_conversations ?? 0) > 0) score += 10;
  return Math.min(100, score);
}

export default HealthScore;
