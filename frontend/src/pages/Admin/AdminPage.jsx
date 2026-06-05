import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import {
  useGetDashboardQuery,
  useGetAuditLogsQuery,
  useGetAllUsersQuery,
  useAssignRoleMutation,
  useDeleteUserMutation,
  useBanOrUnbanUserMutation,
} from '@/features/admin/api/adminApi';
import {
  ArrowLeft, LayoutDashboard, Users, ScrollText,
  ShieldAlert, Trash2, Ban, CheckCircle2,
  RefreshCw, Search, AlertTriangle, ChevronDown, Filter, X,
  ChevronLeft, ChevronRight, Edit
} from 'lucide-react';
import AdminEditProfileDialog from './components/AdminEditProfileDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* ── helpers ─────────────────────────────────────────────────── */
const initials = (name = '') => name.slice(0, 2).toUpperCase() || '??';

const actionColors = {
  BAN_USER: 'destructive', UNBAN_USER: 'default',
  DELETE_USER: 'destructive', EDIT_USER: 'secondary',
  ASSIGN_ROLE: 'default', DELETE_POST: 'destructive',
  DELETE_COMMENT: 'destructive', EDIT_POST: 'secondary',
  EDIT_COMMENT: 'secondary',
};

const roleBadgeVariant = { admin: 'default', moderator: 'secondary', user: 'outline' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function PaginationControls({ page, total, limit, hasMore, setPage }) {
  const totalPages = Math.ceil((total || 0) / limit) || 1;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10 shrink-0">
      <div className="text-xs text-muted-foreground font-medium">
        Showing {total === 0 ? 0 : ((page - 1) * limit) + 1} to {Math.min(page * limit, total || 0)} of {total || 0} entries
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page === 1}
          className="h-8 px-2.5 text-xs bg-background"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="text-xs font-semibold px-2">
          Page {page} of {totalPages}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setPage(p => p + 1)} 
          disabled={!hasMore}
          className="h-8 px-2.5 text-xs bg-background"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ── Dashboard tab ───────────────────────────────────────────── */
function DashboardTab() {
  const { data, isLoading, refetch } = useGetDashboardQuery();
  const d = data?.data;

  const stats = [
    { label:'Total Users', value: d?.totalUsers ?? '—', icon: <Users size={18}/>, color:'text-indigo-500', bg:'bg-indigo-500/10' },
    { label:'Total Posts', value: d?.totalPosts ?? '—', icon: <LayoutDashboard size={18}/>, color:'text-amber-500', bg:'bg-amber-500/10' },
    { label:'New Today',   value: d?.newUsersToday ?? '—', icon: <CheckCircle2 size={18}/>, color:'text-emerald-500', bg:'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-widest uppercase text-muted-foreground">Overview</h3>
          <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoading} className="h-9 w-9 hover:text-indigo-500">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <Card key={i} className="hover:border-indigo-500/30 transition-colors">
              <CardContent className="p-3 flex flex-col gap-1">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                  {React.cloneElement(s.icon, { size: 16 })}
                </div>
                <div className="text-3xl font-bold font-mono tracking-tighter mt-1">
                  {isLoading ? '…' : s.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-base font-bold tracking-widest uppercase text-muted-foreground">Quick Info</h3>
        <Card className="overflow-hidden">
          <div className="divide-y">
            {[
              { label:'Admin Panel', sub:'Full administrative access active', color:'bg-indigo-500/10 text-indigo-500' },
              { label:'Audit Logging', sub:'All sensitive actions are logged', color:'bg-emerald-500/10 text-emerald-500' },
              { label:'RBAC Enforced', sub:'Role-based access control on all endpoints', color:'bg-amber-500/10 text-amber-500' },
            ].map((item,i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base">{item.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{item.sub}</div>
                </div>
                <Badge variant="secondary" className={`${item.color} border-transparent font-mono text-xs uppercase font-bold tracking-wider rounded-full px-3 py-1`}>
                  ACTIVE
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


/* ── Users tab ───────────────────────────────────────────────── */
function UsersTab() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [confirm, setConfirm] = useState({ isOpen: false, type: null, userId: null, username: '', action: null });
  const [pendingRoles, setPendingRoles] = useState({});
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryParams = { page, limit };
  if (debouncedSearch) queryParams.search   = debouncedSearch;
  if (roleFilter)      queryParams.role      = roleFilter;
  if (blockedFilter)   queryParams.isBlocked = blockedFilter;
  if (activeFilter)    queryParams.isActive  = activeFilter;

  const hasFilters = roleFilter || blockedFilter || activeFilter;

  const { data, isLoading, isFetching } = useGetAllUsersQuery(queryParams);
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [banOrUnban, { isLoading: isBanning }] = useBanOrUnbanUserMutation();

  const [editProfileModal, setEditProfileModal] = useState({ isOpen: false, userId: null });

  const pagination = data?.data?.pagination;
  const hasMore = pagination?.hasMore ?? false;
  const total = pagination?.total ?? 0;
  const users = data?.data?.users ?? [];

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, blockedFilter, activeFilter]);

  const actionLoading = isAssigning || isDeleting || isBanning;

  const clearPending = (id) =>
    setPendingRoles((prev) => { const next = { ...prev }; delete next[id]; return next; });

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window.__adminSearchTimer);
    window.__adminSearchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const clearFilters = () => {
    setRoleFilter('');
    setBlockedFilter('');
    setActiveFilter('');
  };

  const handleRole = async (id, role) => {
    setPendingRoles((prev) => ({ ...prev, [id]: role }));
    try {
      await assignRole({ id, role }).unwrap();
      toast.success('Role updated successfully');
    } catch (e) {
      console.error(e);
      toast.error(e?.data?.message ?? 'Failed to update role');
      clearPending(id);
    }
  };

  const handleConfirm = async () => {
    try {
      if (confirm.type === 'delete') {
        await deleteUser(confirm.userId).unwrap();
        toast.success(`@${confirm.username}'s account has been deleted`);
      } else if (confirm.action) {
        await banOrUnban({ id: confirm.userId, action: confirm.action }).unwrap();
        toast.success(confirm.action === 'ban' ? `@${confirm.username} has been banned` : `@${confirm.username} has been unbanned`);
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.data?.message ?? 'Action failed');
    } finally {
      setConfirm({ ...confirm, isOpen: false });
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-[500px] sm:min-h-0 sm:h-[calc(100dvh-11rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both">
      <Dialog open={confirm.isOpen} onOpenChange={(isOpen) => setConfirm({ ...confirm, isOpen })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} />
              {confirm.type === 'delete' ? 'Delete User' : confirm.action === 'ban' ? 'Ban User' : 'Unban User'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {confirm.type === 'delete'
                ? `Permanently delete @${confirm.username}'s account? This cannot be undone.`
                : confirm.action === 'ban'
                ? `Ban @${confirm.username}? They will lose access immediately.`
                : `Unban @${confirm.username}? They will regain full access.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirm({ ...confirm, isOpen: false })}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={actionLoading}>
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-card border-border/50 focus-visible:ring-indigo-500/30"
            placeholder="Search users by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-2.5 px-4 py-3 sm:py-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 border-l-2 border-l-indigo-500/60">
        <div className="flex items-center justify-between sm:mr-1">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-400">Filters</span>
          </div>
          <span className="sm:hidden text-xs font-semibold text-indigo-400/80">{pagination?.total ?? 0} users</span>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className={`h-8 w-full sm:w-[115px] text-xs font-semibold rounded-lg transition-all ${roleFilter ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : 'border-indigo-500/30 bg-background text-foreground hover:border-indigo-500/60'}`}>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={blockedFilter} onValueChange={setBlockedFilter}>
            <SelectTrigger className={`h-8 w-full sm:w-[140px] text-xs font-semibold rounded-lg transition-all ${blockedFilter ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : 'border-indigo-500/30 bg-background text-foreground hover:border-indigo-500/60'}`}>
              <SelectValue placeholder="Block status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Banned</SelectItem>
              <SelectItem value="false">Not banned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className={`h-8 w-full sm:w-[140px] text-xs font-semibold rounded-lg transition-all col-span-2 sm:col-span-1 ${activeFilter ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : 'border-indigo-500/30 bg-background text-foreground hover:border-indigo-500/60'}`}>
              <SelectValue placeholder="Active status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between sm:justify-start sm:ml-auto w-full sm:w-auto mt-1 sm:mt-0">
          {hasFilters ? (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              <X size={11} /> Clear Filters
            </button>
          ) : (
            <div className="hidden sm:block"></div>
          )}
          <span className="hidden sm:inline text-xs font-semibold text-indigo-400/80">{pagination?.total ?? 0} users</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <Card className="flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-auto">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          )}
          {isLoading && page === 1 ? (
            <div className="p-10 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-base text-muted-foreground">No users found.</div>
          ) : (
            <>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col">
              {users.map(u => (
                <div className="flex flex-col border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors" key={u._id}>
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedUserId(prev => prev === u._id ? null : u._id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-10 w-10 border border-indigo-500/20 ring-2 ring-indigo-500/10 shrink-0">
                        <AvatarImage src={u.avatarUrl} alt={u.username} />
                        <AvatarFallback className="bg-indigo-500/10 text-indigo-500 font-semibold text-sm">
                          {initials(u.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-base truncate">@{u.username}</div>
                          {u.isBlocked && <Badge variant="destructive" className="h-5 text-[10px] px-2 py-0.5 border-transparent font-bold">BANNED</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground truncate mt-0.5">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <Badge variant={roleBadgeVariant[u.role] || 'outline'} className={`px-2.5 py-0.5 text-xs ${u.role === 'admin' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}`}>
                        {u.role}
                      </Badge>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedUserId === u._id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {expandedUserId === u._id && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm p-4 rounded-lg bg-background/50 border border-border/50 mb-4 shadow-inner">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Account Status</span>
                          <span className={u.isActive ? "text-emerald-500 font-bold" : "text-destructive font-bold"}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Block Status</span>
                          <span className={u.isBlocked ? "text-destructive font-bold" : "text-emerald-500 font-bold"}>
                            {u.isBlocked ? 'Banned' : 'Clean'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:col-span-2">
                          <span className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Recent Activity</span>
                          <span className="font-mono text-xs text-foreground/80 font-medium mt-0.5">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                            {u.lastLoginIP && ` • IP: ${u.lastLoginIP}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                        {u.role !== 'admin' && (
                          <Select value={pendingRoles[u._id] ?? u.role} onValueChange={(val) => handleRole(u._id, val)}>
                            <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm bg-background font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {u.role !== 'admin' && (
                          <Button variant="outline" size="sm" className="h-9 px-4 text-sm font-medium bg-background w-full sm:w-auto"
                            onClick={(e) => { e.stopPropagation(); setConfirm({ isOpen: true, type: 'ban', userId: u._id, username: u.username, action: u.isBlocked ? 'unban' : 'ban' }); }}>
                            {u.isBlocked ? <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> : <Ban className="h-4 w-4 mr-2 text-destructive" />}
                            {u.isBlocked ? 'Unban User' : 'Ban User'}
                          </Button>
                        )}
                        {u.role !== 'admin' && (
                          <Button variant="outline" size="sm" className="h-9 px-4 text-sm font-medium bg-background w-full sm:w-auto"
                            onClick={(e) => { e.stopPropagation(); setEditProfileModal({ isOpen: true, userId: u._id }); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                        {u.role !== 'admin' && (
                          <Button variant="outline" size="sm"
                            className="h-9 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-background w-full sm:w-auto sm:ml-auto"
                            onClick={(e) => { e.stopPropagation(); setConfirm({ isOpen: true, type: 'delete', userId: u._id, username: u.username, action: null }); }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
            <PaginationControls page={page} total={total} limit={limit} hasMore={hasMore} setPage={setPage} />
            </>
          )}
        </Card>
      </div>

      {editProfileModal.isOpen && editProfileModal.userId && (
        <AdminEditProfileDialog
          isOpen={editProfileModal.isOpen}
          userId={editProfileModal.userId}
          onClose={() => setEditProfileModal({ isOpen: false, userId: null })}
        />
      )}
    </div>
  );
}



/* ── Audit Logs tab ──────────────────────────────────────────── */
const AUDIT_ACTIONS = [
  'BAN_USER','UNBAN_USER','DELETE_USER','EDIT_USER',
  'ASSIGN_ROLE','DELETE_POST','EDIT_POST','DELETE_COMMENT','EDIT_COMMENT',
];

function AuditLogsTab() {
  const [actionFilter, setActionFilter] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [debouncedActor, setDebouncedActor] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const queryParams = { page, limit };
  if (actionFilter)    queryParams.action = actionFilter;
  if (debouncedActor) queryParams.search = debouncedActor;

  const hasFilters = actionFilter || debouncedActor;

  const { data, isLoading, isFetching } = useGetAuditLogsQuery(queryParams);
  const pagination = data?.data?.pagination;
  const hasMore = pagination?.hasMore ?? false;
  const total = pagination?.total ?? 0;
  const logs = data?.data?.logs ?? [];

  useEffect(() => {
    setPage(1);
  }, [actionFilter, debouncedActor]);

  const handleActorSearch = (val) => {
    setActorSearch(val);
    clearTimeout(window.__auditActorTimer);
    window.__auditActorTimer = setTimeout(() => setDebouncedActor(val), 400);
  };

  const clearFilters = () => {
    setActionFilter('');
    setActorSearch('');
    setDebouncedActor('');
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-[500px] sm:min-h-0 sm:h-[calc(100dvh-11rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">

      {/* Filters */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-2.5 px-4 py-3 sm:py-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 border-l-2 border-l-indigo-500/60">
        <div className="flex items-center justify-between sm:mr-1">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-400">Filters</span>
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400/80">{pagination?.total ?? 0} entries</span>
            <Button variant="ghost" size="icon" onClick={() => setPage(1)} disabled={isFetching} className="h-7 w-7 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className={`h-8 w-full sm:w-[165px] text-xs font-semibold rounded-lg transition-all ${
              actionFilter
                ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                : 'border-indigo-500/30 bg-background text-foreground hover:border-indigo-500/60'
            }`}>
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_ACTIONS.map(a => (
                <SelectItem key={a} value={a} className="font-mono text-xs">{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-auto">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
              actorSearch ? 'text-white' : 'text-indigo-400'
            }`} />
            <Input
              className={`h-8 pl-8 w-full sm:w-[200px] text-xs font-semibold rounded-lg transition-all ${
                actorSearch
                  ? 'border-indigo-500 bg-indigo-500 text-white placeholder:text-white/60 shadow-sm shadow-indigo-500/30'
                  : 'border-indigo-500/30 bg-background text-foreground hover:border-indigo-500/60 placeholder:text-muted-foreground'
              }`}
              placeholder="Search actor…"
              value={actorSearch}
              onChange={(e) => handleActorSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-start sm:ml-auto w-full sm:w-auto mt-1 sm:mt-0">
          {hasFilters ? (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              <X size={11} /> Clear Filters
            </button>
          ) : (
            <div className="hidden sm:block"></div>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400/80">{pagination?.total ?? 0} entries</span>
            <Button variant="ghost" size="icon" onClick={() => setPage(1)} disabled={isFetching} className="h-7 w-7 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm relative">
        {isFetching && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-auto">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}
        {isLoading && page === 1 ? (
          <div className="p-10 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-base text-muted-foreground">No audit logs found.</div>
        ) : (
          <>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="divide-y">
            {logs.map(log => (
              <div className="flex flex-col gap-2 p-5 hover:bg-accent/50 transition-colors" key={log._id}>
                <div className="flex items-center gap-3">
                  <Badge variant={actionColors[log.action] || 'secondary'} className="font-mono text-xs tracking-wider uppercase px-2.5 py-0.5">
                    {log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono font-medium">{timeAgo(log.createdAt)}</span>
                </div>
                <div className="text-base font-medium text-foreground">{log.details?.log ?? '—'}</div>
                <div className="text-sm text-muted-foreground font-medium mt-1">
                  by @{log.actor?.username ?? 'unknown'} · {log.actor?.email ?? ''}
                </div>
              </div>
            ))}
            </div>
          </div>
          <PaginationControls page={page} total={total} limit={limit} hasMore={hasMore} setPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}


/* ── Root Admin Page ─────────────────────────────────────────── */
export default function AdminPage() {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-full flex flex-col bg-background/50">
      <header className="sticky top-0 z-50 flex items-center gap-3 h-14 px-4 sm:px-6 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-indigo-500/10 hover:text-indigo-500" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <ShieldAlert size={20} className="text-indigo-500 shrink-0" />
        <span className="text-lg font-bold tracking-tight text-foreground truncate">Admin Panel</span>
        <Badge variant="secondary" className="ml-auto bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-mono text-xs font-semibold shrink-0 px-3 py-1">
          @{user?.username}
        </Badge>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-4 sm:pb-6">
        <Tabs defaultValue="dashboard" className="w-full relative">
          <TabsList className="sticky top-14 z-40 flex w-full mb-4 bg-muted/90 backdrop-blur-xl p-1 shadow-sm border border-border/50 rounded-xl">
            <TabsTrigger value="dashboard" className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all py-2 rounded-lg">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline font-medium text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all py-2 rounded-lg">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-medium text-sm">Users</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all py-2 rounded-lg">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline font-medium text-sm">Audit Logs</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-0 outline-none">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="users" className="mt-0 outline-none">
            <UsersTab />
          </TabsContent>
          <TabsContent value="audit" className="mt-0 outline-none">
            <AuditLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
