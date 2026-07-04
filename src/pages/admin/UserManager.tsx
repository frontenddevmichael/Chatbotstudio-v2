import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search, ShieldCheck, ShieldOff, Download, Trash2, RotateCcw, ChevronUp, ChevronDown, CheckSquare, Square, UserPlus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { AdminUser, OrphanUser } from '@/types/admin';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const PAGE_SIZE = 25;

type SortKey = 'full_name' | 'created_at' | 'monthly_message_count' | 'bots';
type SortDir = 'asc' | 'desc';
type Tab = 'users' | 'orphans';

const UserManager = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 300);
  const [roleConfirm, setRoleConfirm] = useState<{ id: string; name: string; isAdmin: boolean } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminFetch<AdminUser[]>('get-users'), enabled: tab === 'users' });
  const { data: orphans, isLoading: orphansLoading } = useQuery({ queryKey: ['admin-orphans'], queryFn: () => adminFetch<OrphanUser[]>('get-orphan-users'), enabled: tab === 'orphans' });
  const { data: adminRolesList } = useQuery({ queryKey: ['admin-roles'], queryFn: () => adminFetch<string[]>('get-roles') });
  const adminRoles = useMemo(() => new Set(adminRolesList ?? []), [adminRolesList]);
  const { data: botCounts } = useQuery({ queryKey: ['admin-bot-counts'], queryFn: () => adminFetch<Record<string, number>>('get-bot-counts') });

  const filtered = useMemo<AdminUser[]>(() => {
    let result: AdminUser[] = users ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((u) => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.id?.includes(q));
    }
    if (planFilter !== 'all') result = result.filter((u) => u.plan === planFilter);
    if (roleFilter === 'admin') result = result.filter((u) => adminRoles.has(u.id));
    if (roleFilter === 'user') result = result.filter((u) => !adminRoles.has(u.id));

    result = [...result].sort((a, b) => {
      let aVal: string | number = '', bVal: string | number = '';
      if (sortKey === 'bots') { aVal = botCounts?.[a.id] ?? 0; bVal = botCounts?.[b.id] ?? 0; }
      else if (sortKey === 'created_at') { aVal = a.created_at ?? ''; bVal = b.created_at ?? ''; }
      else if (sortKey === 'monthly_message_count') { aVal = a.monthly_message_count ?? 0; bVal = b.monthly_message_count ?? 0; }
      else { aVal = (a.full_name || '').toLowerCase(); bVal = (b.full_name || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, debouncedSearch, planFilter, roleFilter, adminRoles, sortKey, sortDir, botCounts]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((u) => u.id)));
  };

  const togglePlan = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) => adminFetch('toggle-plan', { id, plan }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Plan updated'); },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update plan'),
  });

  const bulkTogglePlan = useMutation({
    mutationFn: (targetPlan: string) => adminFetch('bulk-toggle-plan', { ids: [...selected], targetPlan }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setSelected(new Set()); toast.success('Bulk plan update done'); },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Bulk plan update failed'),
  });

  const toggleAdmin = useMutation({
    mutationFn: ({ id, isAdmin }: { id: string; isAdmin: boolean }) => adminFetch('toggle-admin-role', { id, isAdmin }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); toast.success('Admin role updated'); setRoleConfirm(null); },
    onError: (err) => { toast.error(err instanceof Error ? err.message : 'Failed to update role'); setRoleConfirm(null); },
  });

  const resetMessages = useMutation({
    mutationFn: (id: string) => adminFetch('reset-user-messages', { id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Message count reset'); },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to reset messages'),
  });

  const deleteUser = useMutation({
    mutationFn: ({ id }: { id: string }) => adminFetch('delete-user', { id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted'); setDeleteConfirm(null); },
    onError: (err) => { toast.error(err instanceof Error ? err.message : 'Failed to delete user'); setDeleteConfirm(null); },
  });

  const restoreOrphan = useMutation({
    mutationFn: (id: string) => adminFetch('restore-orphan-user', { id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-orphans'] }); toast.success('Profile restored'); },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to restore profile'),
  });

  const sanitizeCSV = (val: string): string => /^[=+\-@]/.test(val) ? `'${val}` : val;

  const exportCSV = () => {
    const rows = filtered.map((u) => ({
      Name: sanitizeCSV(u.full_name || 'Unnamed'), Email: sanitizeCSV(u.email || ''), ID: sanitizeCSV(u.id), Plan: sanitizeCSV(u.plan || 'free'),
      Messages: `${u.monthly_message_count ?? 0}/${u.message_limit ?? 500}`, Chatbots: botCounts?.[u.id] ?? 0,
      Admin: adminRoles?.has(u.id) ? 'Yes' : 'No', Joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users-export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <AdminLayout>
      <SEO title="User Management" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        {tab === 'users' && (
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          onClick={() => { setTab('users'); setPage(0); setSearch(''); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'users' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Registered Users
          {users && <span className="ml-1.5 text-xs text-muted-foreground">({users.length})</span>}
        </button>
        <button
          onClick={() => { setTab('orphans'); setPage(0); setSearch(''); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'orphans' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Orphan Accounts
          {orphans && <span className="ml-1.5 text-xs text-muted-foreground">({orphans.length})</span>}
        </button>
      </div>

      {tab === 'users' && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search by name, email, or ID..." className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
            </div>
            <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </div>

          {selected.size > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
              <span className="font-medium text-foreground">{selected.size} selected</span>
              <button onClick={() => bulkTogglePlan.mutate('premium')} className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">Upgrade All</button>
              <button onClick={() => bulkTogglePlan.mutate('free')} className="rounded border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted">Downgrade All</button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Clear</button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-card" />)}</div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="px-3 py-3 w-8">
                        <button onClick={toggleSelectAll} aria-label="Select all users" className="text-muted-foreground hover:text-foreground">
                          {selected.size === paged.length && paged.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('full_name')}>Name <SortIcon col="full_name" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('bots')}>Bots <SortIcon col="bots" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('monthly_message_count')}>Messages <SortIcon col="monthly_message_count" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('created_at')}>Joined <SortIcon col="created_at" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((u) => {
                      const isUserAdmin = adminRoles?.has(u.id) ?? false;
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setDetailUser(u)}>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleSelect(u.id)} aria-label="Select user" className="text-muted-foreground hover:text-foreground">
                              {selected.has(u.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-foreground font-medium">{u.full_name || 'Unnamed'}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{u.id}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[180px]">{u.email || '-'}</td>
                          <td className="px-4 py-3">
                            {isUserAdmin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"><ShieldCheck className="h-3 w-3" /> Admin</span>
                            ) : (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">User</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.plan === 'premium' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.plan}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{botCounts?.[u.id] ?? 0}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.monthly_message_count ?? 0} / {u.message_limit ?? 500}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button onClick={() => togglePlan.mutate({ id: u.id, plan: u.plan })} className="text-xs font-medium text-primary hover:underline">{u.plan === 'premium' ? 'Downgrade' : 'Upgrade'}</button>
                              <button onClick={() => resetMessages.mutate(u.id)} aria-label="Reset message count" className="text-muted-foreground hover:text-foreground" title="Reset messages"><RotateCcw className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setRoleConfirm({ id: u.id, name: u.full_name || 'Unnamed', isAdmin: isUserAdmin })} className={`inline-flex items-center gap-1 text-xs font-medium hover:underline ${isUserAdmin ? 'text-destructive' : 'text-foreground'}`}>
                                {isUserAdmin ? <><ShieldOff className="h-3 w-3" /> Revoke</> : <><ShieldCheck className="h-3 w-3" /> Admin</>}
                              </button>
                              <button onClick={() => setDeleteConfirm({ id: u.id, name: u.full_name || 'Unnamed' })} aria-label="Delete user" className="text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!paged.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40">Previous</button>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'orphans' && (
        <div className="rounded-lg border border-border">
          <div className="p-4 border-b border-border bg-muted/50">
            <p className="text-sm text-muted-foreground">
              These users exist in <code className="text-xs bg-muted px-1 py-0.5 rounded">auth.users</code> but have no profile row. Click <strong>Restore</strong> to create one.
            </p>
          </div>
          {orphansLoading ? (
            <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-card" />)}</div>
          ) : orphans && orphans.length > 0 ? (
            <div className="divide-y divide-border">
              {orphans.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{o.email || 'No email'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{o.id}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-muted-foreground">{o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Unknown'}</span>
                    <button
                      onClick={() => restoreOrphan.mutate(o.id)}
                      disabled={restoreOrphan.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No orphan accounts found.</p>
            </div>
          )}
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailUser?.full_name || 'Unnamed'}</DialogTitle>
            <DialogDescription className="text-xs">{detailUser?.email || 'No email'}</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Plan</p><p className="font-medium text-foreground capitalize">{detailUser.plan || 'free'}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Messages</p><p className="font-medium text-foreground">{detailUser.monthly_message_count ?? 0} / {detailUser.message_limit ?? 500}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Chatbots</p><p className="font-medium text-foreground">{botCounts?.[detailUser.id] ?? 0}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Role</p><p className="font-medium text-foreground">{adminRoles.has(detailUser.id) ? 'Admin' : 'User'}</p></div>
              </div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Joined</p><p className="font-medium text-foreground">{detailUser.created_at ? new Date(detailUser.created_at).toLocaleString() : '-'}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">User ID</p><p className="font-mono text-xs text-foreground break-all">{detailUser.id}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!roleConfirm} onOpenChange={(open) => !open && setRoleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{roleConfirm?.isAdmin ? 'Revoke Admin Access' : 'Grant Admin Access'}</AlertDialogTitle>
            <AlertDialogDescription>{roleConfirm?.isAdmin ? `Remove admin privileges from ${roleConfirm.name}?` : `Make ${roleConfirm?.name} an admin?`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => roleConfirm && toggleAdmin.mutate({ id: roleConfirm.id, isAdmin: roleConfirm.isAdmin })}>{roleConfirm?.isAdmin ? 'Revoke' : 'Grant Admin'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete {deleteConfirm?.name}? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteUser.mutate({ id: deleteConfirm.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default UserManager;
