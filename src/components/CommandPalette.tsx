import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbots } from '@/hooks/useChatbot';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Bot, Plus, CreditCard, Settings, BarChart3, Rocket, FileQuestion,
} from 'lucide-react';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: chatbots } = useChatbots();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate('/builder/new');
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [navigate]);

  const go = (path: string) => { navigate(path); setOpen(false); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, chatbots..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/builder/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Chatbot
          </CommandItem>
          <CommandItem onSelect={() => go('/billing')}>
            <CreditCard className="mr-2 h-4 w-4" /> Billing
          </CommandItem>
          <CommandItem onSelect={() => go('/settings')}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        {chatbots?.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your Chatbots">
              {chatbots.map((bot) => (
                <CommandItem key={bot.id} onSelect={() => go(`/chatbot/${bot.id}`)}>
                  <Bot className="mr-2 h-4 w-4" /> {bot.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
