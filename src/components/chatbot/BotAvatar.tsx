import { getAvatarIcon } from './AvatarPicker';

interface BotAvatarProps {
  avatarEmoji: string | null;
  botName: string;
  accentColor: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 'h-7 w-7', icon: 'h-3.5 w-3.5', text: 'text-xs' },
  md: { container: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-sm' },
  lg: { container: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-lg' },
};

/** Renders either a Lucide icon avatar or initials avatar for a chatbot.
 *  Old emoji values (starting with a non-ASCII char) fall back to initials.
 */
const BotAvatar = ({ avatarEmoji, botName, accentColor, size = 'md', className = '' }: BotAvatarProps) => {
  const s = sizeMap[size];
  const iconName = avatarEmoji || '';
  const Icon = getAvatarIcon(iconName);

  // If it's a known icon name, render the icon
  if (Icon) {
    return (
      <div
        className={`flex ${s.container} items-center justify-center rounded-xl ${className}`}
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <Icon className={s.icon} style={{ color: accentColor }} />
      </div>
    );
  }

  // Initials fallback
  const initials = (botName || 'B').slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex ${s.container} items-center justify-center rounded-xl font-bold text-white ${s.text} ${className}`}
      style={{ backgroundColor: accentColor }}
    >
      {initials}
    </div>
  );
};

export default BotAvatar;
