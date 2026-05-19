import AvatarPicker from '@/components/chatbot/AvatarPicker';

interface Props {
  name: string;
  setName: (v: string) => void;
  welcomeMessage: string;
  setWelcomeMessage: (v: string) => void;
  avatarEmoji: string;
  setAvatarEmoji: (v: string) => void;
  avatarType: 'icon' | 'initials';
  setAvatarType: (v: 'icon' | 'initials') => void;
  primaryColor: string;
  inputClass: string;
}

const Step1Identity = ({ name, setName, welcomeMessage, setWelcomeMessage, avatarEmoji, setAvatarEmoji, avatarType, setAvatarType, primaryColor, inputClass }: Props) => (
  <div className="space-y-5">
    <div>
      <label htmlFor="bot-name" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Chatbot Name</label>
      <input id="bot-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Support Bot" maxLength={100} autoComplete="off" />
    </div>
    <div>
      <label htmlFor="bot-welcome" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Welcome Message</label>
      <textarea id="bot-welcome" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} maxLength={500} className={inputClass} />
    </div>
    <div>
      <p className="mb-2 text-[13px] font-medium text-muted-foreground">Avatar</p>
      <AvatarPicker value={avatarEmoji} avatarType={avatarType} botName={name} accentColor={primaryColor} onChangeType={setAvatarType} onChangeIcon={setAvatarEmoji} />
    </div>
  </div>
);

export default Step1Identity;
