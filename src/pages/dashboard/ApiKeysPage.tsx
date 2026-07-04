import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon, CopyIcon } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  scopes: string[];
  last_used_at: string | null;
  is_active: boolean;
  created_at: string | null;
}

const useApiKeys = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user,
  });
};

const maskKey = (key: string) => {
  if (key.length <= 8) return key;
  return `****${key.slice(-8)}`;
};

const ApiKeysPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: apiKeys, isLoading } = useApiKeys();
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .rpc('create_api_key', { p_user_id: user!.id, p_name: name, p_scopes: [] });
      if (error) throw error;
      return { id: '', name, key: data as string } as ApiKey;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(data.key);
      setNewKeyName('');
      toast.success('API key created');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create API key'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete API key'),
  });

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the key');
      return;
    }
    createMutation.mutate(newKeyName.trim());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key).then(
      () => toast.success('Key copied to clipboard'),
      () => toast.error('Failed to copy key'),
    );
  };

  return (
    <PageWrapper>
      <SEO title="API Keys" noIndex />
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-foreground">API Keys</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Manage API keys for programmatic access to your chatbots.
            </p>
          </div>
          <Button onClick={() => { setShowCreate(true); setCreatedKey(null); }}>
            <PlusIcon className="h-3.5 w-3.5" /> Create Key
          </Button>
        </div>

        {showCreate && (
          <div className="mb-6 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
            {createdKey ? (
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-foreground">Key created successfully!</p>
                <div className="flex items-center gap-2 rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2">
                  <code className="flex-1 text-[13px] font-mono break-all">{createdKey}</code>
                  <button onClick={() => handleCopy(createdKey)} className="shrink-0 rounded-[6px] p-1.5 text-muted-foreground hover:bg-[hsl(var(--color-surface-3))] hover:text-foreground transition-colors">
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[11px] text-warning">Make sure to copy your key now. You won't be able to see it again.</p>
                <Button variant="outline" onClick={() => { setShowCreate(false); setCreatedKey(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production, Staging)"
                  className="flex-1 rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  Generate
                </Button>
                <Button variant="outline" onClick={() => { setShowCreate(false); setNewKeyName(''); }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="mt-2 h-3 w-48 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : apiKeys?.length ? (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="rounded-[14px] border border-border bg-card p-5 transition-all hover:border-border/80"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-foreground">{apiKey.name}</h3>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${apiKey.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                    </div>
                    <p className="mt-1 font-mono text-[13px] text-muted-foreground">{maskKey(apiKey.key)}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {apiKey.scopes?.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-[10px]">{scope}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Created {apiKey.created_at ? new Date(apiKey.created_at).toLocaleDateString() : 'Unknown'}
                      {apiKey.last_used_at && ` · Last used ${new Date(apiKey.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(apiKey.id)}
                    className="shrink-0 rounded-[6px] p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[14px] border border-border bg-card p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-[14px] font-medium text-foreground">No API keys yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Create your first API key to get started.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ApiKeysPage;
