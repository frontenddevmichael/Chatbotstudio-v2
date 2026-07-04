import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ToolGuide from '@/components/ui/ToolGuide';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import EmptyState from '@/components/ui/illustrations/EmptyState';
import {
  MessageSquare,
  Users,
  ShoppingCart,
  Globe,
  Calendar,
  MessageCircle,
  Plug,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface Integration {
  id: string;
  chatbot_id: string;
  provider: string;
  config: Record<string, string>;
  is_enabled: boolean;
  last_synced_at: string | null;
  created_at: string | null;
}

const PROVIDERS = [
  { id: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-[#4A154B]', bgColor: 'bg-[#4A154B]/10' },
  { id: 'hubspot', label: 'HubSpot', icon: Users, color: 'text-[#FF7A59]', bgColor: 'bg-[#FF7A59]/10' },
  { id: 'shopify', label: 'Shopify', icon: ShoppingCart, color: 'text-[#96BF48]', bgColor: 'bg-[#96BF48]/10' },
  { id: 'wordpress', label: 'WordPress', icon: Globe, color: 'text-[#21759B]', bgColor: 'bg-[#21759B]/10' },
  { id: 'calendly', label: 'Calendly', icon: Calendar, color: 'text-[#006BFF]', bgColor: 'bg-[#006BFF]/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-[#25D366]', bgColor: 'bg-[#25D366]/10' },
];

const PROVIDER_CONFIG_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  slack: [
    { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
    { key: 'channel', label: 'Channel', placeholder: '#general' },
  ],
  hubspot: [
    { key: 'api_key', label: 'API Key', placeholder: 'Your HubSpot API key' },
    { key: 'portal_id', label: 'Portal ID', placeholder: 'Your HubSpot portal ID' },
  ],
  shopify: [
    { key: 'shop_domain', label: 'Shop Domain', placeholder: 'mystore.myshopify.com' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Your Shopify access token' },
  ],
  wordpress: [
    { key: 'site_url', label: 'Site URL', placeholder: 'https://yoursite.com' },
    { key: 'api_key', label: 'API Key', placeholder: 'Your WordPress API key' },
  ],
  calendly: [
    { key: 'api_key', label: 'API Key', placeholder: 'Your Calendly API key' },
    { key: 'event_type_url', label: 'Event Type URL', placeholder: 'https://calendly.com/...' },
  ],
  whatsapp: [
    { key: 'phone_number_id', label: 'Phone Number ID', placeholder: 'Your Twilio phone number ID' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Your Twilio access token' },
  ],
};

const useIntegrations = (chatbotId: string) => {
  return useQuery({
    queryKey: ['integrations', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('chatbot_id', chatbotId);
      if (error) throw error;
      return data as Integration[];
    },
    enabled: !!chatbotId,
  });
};

const IntegrationsPage = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: integrations, isLoading } = useIntegrations(chatbotId!);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const getIntegration = (providerId: string) =>
    integrations?.find((i) => i.provider === providerId);

  const connectMutation = useMutation({
    mutationFn: async ({ provider, config }: { provider: string; config: Record<string, string> }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/integrations/${chatbotId}/${provider}/connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ config }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Connection failed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', chatbotId] });
      toast.success('Integration connected');
      setExpandedProvider(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Connection failed'),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/integrations/${chatbotId}/${provider}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Disconnect failed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', chatbotId] });
      toast.success('Integration disconnected');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Disconnect failed'),
  });

  const syncMutation = useMutation({
    mutationFn: async (provider: string) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/integrations/${chatbotId}/${provider}/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Sync failed');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', chatbotId] });
      toast.success(data.message || 'Sync completed');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Sync failed'),
  });

  const handleConnect = (providerId: string) => {
    const fields = PROVIDER_CONFIG_FIELDS[providerId];
    const config: Record<string, string> = {};
    for (const field of fields) {
      if (!configValues[field.key]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
      config[field.key] = configValues[field.key].trim();
    }
    connectMutation.mutate({ provider: providerId, config });
  };

  const handleDisconnect = (providerId: string) => {
    if (!confirm(`Disconnect ${providerId}?`)) return;
    disconnectMutation.mutate(providerId);
  };

  const handleSync = (providerId: string) => {
    syncMutation.mutate(providerId);
  };

  const handleCardClick = (providerId: string) => {
    const integration = getIntegration(providerId);
    if (expandedProvider === providerId) {
      setExpandedProvider(null);
      return;
    }
    setExpandedProvider(providerId);
    if (integration) {
      setConfigValues(integration.config);
    } else {
      setConfigValues({});
    }
  };

  return (
    <PageWrapper>
      <SEO title="Integrations" noIndex />
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-foreground">Integrations</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Connect your chatbot to your favorite tools.
          </p>
        </div>

        <ToolGuide
          storageKey="walkthrough-integrations"
          title="How Integrations works"
          description="Connect your chatbot to external platforms like Slack, HubSpot, Shopify, WordPress, Calendly, and WhatsApp. Each integration enables different capabilities — from receiving notifications to syncing data."
          steps={[
            'Browse available integrations and click "Connect" on the one you want to set up.',
            'Follow the platform\'s authentication flow — you\'ll be redirected to authorize the connection.',
            'Once connected, configure the integration settings (e.g., which channel to post to, which events to sync).',
            'Use the toggle to enable/disable an integration. Disconnect any integration at any time.',
          ]}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {PROVIDERS.map((provider, i) => {
                const integration = getIntegration(provider.id);
                const isExpanded = expandedProvider === provider.id;
                const isPending =
                  connectMutation.isPending || disconnectMutation.isPending || syncMutation.isPending;

                return (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                  >
                    <div
                      className={`rounded-[14px] border border-border bg-card transition-all hover:border-border/80 ${
                        isExpanded ? 'border-primary/40' : ''
                      }`}
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <button
                        onClick={() => handleCardClick(provider.id)}
                        className="w-full flex items-center gap-3 p-5 text-left"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${provider.bgColor}`}>
                          <provider.icon className={`h-5 w-5 ${provider.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-foreground">{provider.label}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {integration?.is_enabled ? (
                              <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Not connected
                              </Badge>
                            )}
                          </p>
                        </div>
                        <Plug className={`h-4 w-4 ${integration?.is_enabled ? 'text-success' : 'text-muted-foreground'}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                          {PROVIDER_CONFIG_FIELDS[provider.id].map((field) => (
                            <div key={field.key}>
                              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">
                                {field.label}
                              </label>
                              <input
                                type="text"
                                value={configValues[field.key] || ''}
                                onChange={(e) =>
                                  setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                placeholder={field.placeholder}
                                className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                disabled={isPending}
                              />
                            </div>
                          ))}

                          <div className="flex items-center gap-2 pt-1">
                            {integration?.is_enabled ? (
                              <>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDisconnect(provider.id)}
                                  disabled={isPending}
                                >
                                  <X className="h-3.5 w-3.5" /> Disconnect
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSync(provider.id)}
                                  disabled={isPending}
                                >
                                  <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleConnect(provider.id)}
                                disabled={isPending}
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Connect
                              </Button>
                            )}
                          </div>

                          {integration?.last_synced_at && (
                            <p className="text-[10px] text-muted-foreground">
                              Last synced: {new Date(integration.last_synced_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {!integrations?.length && (
              <EmptyState
                icon={<Plug className="h-8 w-8 text-muted-foreground/40" />}
                title="No integrations connected"
                description="Connect your chatbot to your favorite tools to extend its capabilities."
              />
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default IntegrationsPage;
