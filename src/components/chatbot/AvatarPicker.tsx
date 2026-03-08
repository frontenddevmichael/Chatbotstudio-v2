import { useState } from 'react';
import {
  Bot, MessageSquare, Headphones, Shield, Zap, Heart, Star, Globe,
  Briefcase, BookOpen, ShoppingCart, Building2, Stethoscope, GraduationCap,
  Palette, Rocket, Target, Coffee, Leaf, Music,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'bot', icon: Bot },
  { name: 'message', icon: MessageSquare },
  { name: 'headphones', icon: Headphones },
  { name: 'shield', icon: Shield },
  { name: 'zap', icon: Zap },
  { name: 'heart', icon: Heart },
  { name: 'star', icon: Star },
  { name: 'globe', icon: Globe },
  { name: 'briefcase', icon: Briefcase },
  { name: 'book', icon: BookOpen },
  { name: 'cart', icon: ShoppingCart },
  { name: 'building', icon: Building2 },
  { name: 'health', icon: Stethoscope },
  { name: 'education', icon: GraduationCap },
  { name: 'palette', icon: Palette },
  { name: 'rocket', icon: Rocket },
  { name: 'target', icon: Target },
  { name: 'coffee', icon: Coffee },
  { name: 'leaf', icon: Leaf },
  { name: 'music', icon: Music },
];

type AvatarType = 'icon' | 'initials';

interface AvatarPickerProps {
  value: string; // icon name or 'initials'
  avatarType: AvatarType;
  botName: string;
  accentColor: string;
  onChangeType: (type: AvatarType) => void;
  onChangeIcon: (iconName: string) => void;
}

export const getAvatarIcon = (name: string): LucideIcon | null => {
  return ICON_OPTIONS.find((o) => o.name === name)?.icon || null;
};

const AvatarPicker = ({ value, avatarType, botName, accentColor, onChangeType, onChangeIcon }: AvatarPickerProps) => {
  const initials = (botName || 'B').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChangeType('icon')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            avatarType === 'icon' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Icon
        </button>
        <button
          type="button"
          onClick={() => onChangeType('initials')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            avatarType === 'initials' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Initials
        </button>
      </div>

      {avatarType === 'icon' ? (
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => onChangeIcon(name)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                value === name ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
              }`}
            >
              <Icon className={`h-5 w-5 ${value === name ? 'text-primary' : 'text-muted-foreground'}`} />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {initials}
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-generated from bot name
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarPicker;
