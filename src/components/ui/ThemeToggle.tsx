import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const label = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark';

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title={`Theme: ${label}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

export default ThemeToggle;
