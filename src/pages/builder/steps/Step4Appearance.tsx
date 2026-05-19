import BotAvatar from '@/components/chatbot/BotAvatar';
import ColorPicker from '@/components/chatbot/ColorPicker';

interface Props {
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  name: string;
  welcomeMessage: string;
  avatarEmoji: string;
  avatarType: 'icon' | 'initials';
}

const Step4Appearance = ({ primaryColor, setPrimaryColor, name, welcomeMessage, avatarEmoji, avatarType }: Props) => (
  <div className="space-y-5">
    <div>
      <p className="mb-2 text-[13px] font-medium text-muted-foreground">Primary Color</p>
      <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
    </div>
    <div className="rounded-[14px] border border-border bg-card p-5">
      <p className="mb-3 text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">Preview</p>
      <div className="mx-auto w-64 rounded-[14px] border border-border overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: `${primaryColor}0F`, borderBottom: `1px solid ${primaryColor}1A` }}>
          <BotAvatar avatarEmoji={avatarType === 'initials' ? 'initials' : avatarEmoji} botName={name} accentColor={primaryColor} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-semibold text-foreground truncate block">{name || 'Your Bot'}</span>
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full" style={{ background: primaryColor }} />
              <span className="text-[9px] text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <div className="p-2.5 space-y-1.5">
          <div className="rounded-[8px] bg-[hsl(var(--color-surface-2))] p-2 text-[11px] text-foreground">{welcomeMessage || 'Hello!'}</div>
          <div className="flex justify-end">
            <div className="rounded-[8px] px-2 py-1.5 text-[11px] text-white" style={{ background: primaryColor }}>How does it work?</div>
          </div>
        </div>
        <div className="px-2.5 pb-2.5">
          <div className="flex gap-1.5">
            <div className="flex-1 rounded-full border border-border bg-[hsl(var(--color-surface-3))] px-2.5 py-1 text-[10px] text-muted-foreground" style={{ borderColor: `${primaryColor}30` }}>Message...</div>
            <button type="button" className="rounded-full px-2.5 py-1 text-[10px] font-medium text-white" style={{ backgroundColor: primaryColor }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Step4Appearance;
