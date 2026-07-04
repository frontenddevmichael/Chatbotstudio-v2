import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { Building2, Users, Shield, Activity, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string | null;
  user_email?: string;
  user_name?: string;
}

interface AuditLog {
  id: string;
  agency_id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
}

interface EnterpriseSettings {
  id: string;
  agency_id: string;
  sso_enabled: boolean;
  sso_provider: string | null;
  sso_config: Record<string, unknown> | null;
  audit_log_enabled: boolean;
  data_residency_region: string;
  fine_tuning_enabled: boolean;
  fine_tuning_model: string | null;
}

const AgencyPage = () => {
  const { agency, agencyRole, isAgencyOwner, isAgencyAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('settings');
  const [inviteEmail, setInviteEmail] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const debouncedAuditSearch = useDebounce(auditSearch, 300);

  const canManage = isAgencyOwner || isAgencyAdmin;

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['agency-members', agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_members')
        .select('*')
        .eq('agency_id', agency!.id);
      if (error) throw error;
      const rows = data as Member[];
      const enriched = await Promise.all(
        rows.map(async (m) => {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', m.user_id)
            .maybeSingle();
          const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id);
          return {
            ...m,
            user_name: prof?.full_name || undefined,
            user_email: (authUser?.user?.email) || m.user_id.slice(0, 8),
          };
        })
      );
      return enriched as (Member & { user_email: string; user_name?: string })[];
    },
    enabled: !!agency,
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs', agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('agency_id', agency!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!agency,
  });

  const { data: enterpriseSettings } = useQuery({
    queryKey: ['enterprise-settings', agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enterprise_settings')
        .select('*')
        .eq('agency_id', agency!.id)
        .maybeSingle();
      if (error) throw error;
      return data as EnterpriseSettings | null;
    },
    enabled: !!agency,
  });

  const updateAgency = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from('agencies')
        .update(updates)
        .eq('id', agency!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      toast.success('Agency updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update agency'),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('agency_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-members'] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove member'),
  });

  const inviteMember = useMutation({
    mutationFn: async (email: string) => {
      const { data: invitedUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', email)
        .maybeSingle();

      if (!invitedUser) {
        throw new Error('User not found. They must have an account first.');
      }

      const { error } = await supabase
        .from('agency_members')
        .insert({ agency_id: agency!.id, user_id: invitedUser.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-members'] });
      setInviteEmail('');
      toast.success('Member invited');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to invite member'),
  });

  const updateEnterprise = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (enterpriseSettings) {
        const { error } = await supabase
          .from('enterprise_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', enterpriseSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('enterprise_settings')
          .insert({ agency_id: agency!.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-settings'] });
      toast.success('Enterprise settings updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update enterprise settings'),
  });

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    if (!debouncedAuditSearch) return auditLogs;
    const q = debouncedAuditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.resource_type || '').toLowerCase().includes(q) ||
        (l.resource_id || '').toLowerCase().includes(q)
    );
  }, [auditLogs, debouncedAuditSearch]);

  const [name, setName] = useState(agency?.name || '');
  const [slug, setSlug] = useState(agency?.slug || '');
  const [customDomain, setCustomDomain] = useState(agency?.custom_domain || '');
  const [brandColor, setBrandColor] = useState(agency?.brand_color || '#3b82f6');
  const [logoUrl, setLogoUrl] = useState(agency?.logo_url || '');

  useEffect(() => {
    if (agency) {
      setName(agency.name);
      setSlug(agency.slug);
      setCustomDomain(agency.custom_domain || '');
      setBrandColor(agency.brand_color);
      setLogoUrl(agency.logo_url || '');
    }
  }, [agency?.id]);

  const handleSaveSettings = () => {
    updateAgency.mutate({ name, slug, custom_domain: customDomain || null, brand_color: brandColor, logo_url: logoUrl || null });
  };

  if (!agency) {
    return (
      <PageWrapper>
        <SEO title="Agency" noIndex />
        <div className="rounded-[14px] border border-border bg-card p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-[14px] font-medium text-foreground">No Agency</p>
          <p className="mt-1 text-[13px] text-muted-foreground">You are not part of an agency yet.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <SEO title="Agency Settings" noIndex />
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-foreground">{agency.name}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Manage your agency and enterprise settings.</p>
          </div>
          <Badge variant="secondary" className="text-[11px] capitalize">{agencyRole}</Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="settings" className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Settings</TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Members</TabsTrigger>
            <TabsTrigger value="enterprise" className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Enterprise</TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="rounded-[14px] border border-border bg-card p-5 space-y-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Slug</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Custom Domain</label>
                  <input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="chat.example.com"
                    className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-9 rounded-[6px] border border-border cursor-pointer"
                    />
                    <input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="flex-1 rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-foreground mb-1">Logo URL</label>
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 w-10 rounded-[6px] border border-border object-contain" />
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveSettings} disabled={updateAgency.isPending}>Save Changes</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              {canManage && (
                <div className="mb-4 flex items-center gap-3">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter user email to invite..."
                    className="flex-1 rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onKeyDown={(e) => { if (e.key === 'Enter') inviteMember.mutate(inviteEmail); }}
                  />
                  <Button onClick={() => inviteMember.mutate(inviteEmail)} disabled={!inviteEmail.trim() || inviteMember.isPending}>
                    <PlusIcon className="h-3.5 w-3.5" /> Invite
                  </Button>
                </div>
              )}
              {membersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-[8px] bg-muted" />
                  ))}
                </div>
              ) : members?.length ? (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
                          {(m.user_name || m.user_email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{m.user_name || 'Unnamed'}</p>
                          <p className="text-[11px] text-muted-foreground">{m.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.role === 'owner' ? 'default' : m.role === 'admin' ? 'secondary' : 'outline'} className="text-[10px] capitalize">{m.role}</Badge>
                        {canManage && m.role !== 'owner' && (
                          <button
                            onClick={() => removeMember.mutate(m.id)}
                            className="rounded-[6px] p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground text-center py-4">No members yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="enterprise">
            <div className="rounded-[14px] border border-border bg-card p-5 space-y-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-foreground">SSO Enabled</p>
                  <p className="text-[11px] text-muted-foreground">Single sign-on for your agency</p>
                </div>
                <Switch
                  checked={enterpriseSettings?.sso_enabled ?? false}
                  onCheckedChange={(checked) => updateEnterprise.mutate({ sso_enabled: checked })}
                />
              </div>

              {enterpriseSettings?.sso_enabled && (
                <div className="space-y-3 pl-0">
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1">SSO Provider</label>
                    <Select
                      value={enterpriseSettings?.sso_provider || ''}
                      onValueChange={(val) => updateEnterprise.mutate({ sso_provider: val })}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saml">SAML</SelectItem>
                        <SelectItem value="oidc">OIDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {enterpriseSettings?.sso_provider && (
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-1">SSO Config (JSON)</label>
                      <textarea
                        rows={4}
                        value={JSON.stringify(enterpriseSettings.sso_config || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateEnterprise.mutate({ sso_config: parsed });
                          } catch {}
                        }}
                        className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[12px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-foreground">Audit Log</p>
                    <p className="text-[11px] text-muted-foreground">Record all agency activity</p>
                  </div>
                  <Switch
                    checked={enterpriseSettings?.audit_log_enabled ?? true}
                    onCheckedChange={(checked) => updateEnterprise.mutate({ audit_log_enabled: checked })}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Data Residency</label>
                  <Select
                    value={enterpriseSettings?.data_residency_region || 'us'}
                    onValueChange={(val) => updateEnterprise.mutate({ data_residency_region: val })}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="ap">Asia Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-foreground">Fine-Tuning</p>
                    <p className="text-[11px] text-muted-foreground">Enable model fine-tuning for your agency</p>
                  </div>
                  <Switch
                    checked={enterpriseSettings?.fine_tuning_enabled ?? false}
                    onCheckedChange={(checked) => updateEnterprise.mutate({ fine_tuning_enabled: checked })}
                  />
                </div>
                {enterpriseSettings?.fine_tuning_enabled && (
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1">Fine-Tuning Model</label>
                    <input
                      value={enterpriseSettings?.fine_tuning_model || ''}
                      onChange={(e) => updateEnterprise.mutate({ fine_tuning_model: e.target.value || null })}
                      placeholder="gpt-4o-mini"
                      className="w-full rounded-[8px] border border-border bg-[hsl(var(--color-surface-1))] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit log..."
                  className="w-full rounded-md border border-border bg-[hsl(var(--color-surface-1))] pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {auditLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-[8px] bg-muted" />
                  ))}
                </div>
              ) : filteredLogs.length ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Resource</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {log.resource_type ? `${log.resource_type}${log.resource_id ? ` / ${log.resource_id.slice(0, 8)}` : ''}` : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{log.user_id?.slice(0, 8) || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{log.ip_address || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground text-center py-4">No audit log entries found.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
};

export default AgencyPage;
