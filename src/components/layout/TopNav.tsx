import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TopNav = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="flex h-14 items-center justify-end border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{profile?.full_name || user?.email}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default TopNav;
