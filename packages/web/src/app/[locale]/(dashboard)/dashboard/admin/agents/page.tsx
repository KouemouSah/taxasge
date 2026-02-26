'use client';

/**
 * Agents & Admins Admin Page
 * Manages agent profiles and admin users with tabbed interface
 *
 * Uses useTranslations('admin.agents') for all UI text.
 *
 * @module dashboard/admin/agents
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, UserCog, Shield, Sparkles, Activity, RefreshCw, Search,
  Plus, MoreVertical, Edit, Trash2, UserCheck, UserX, Eye, Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentProfiles, useAdminUsers, useAlertsDashboard,
  useDeactivateAgent, useReactivateAgent, useActivateUser,
  useDeactivateUser, useDeleteAgentUser,
} from '@/modules/agents-admin/hooks';
import type { AgentProfile, AgentType } from '@/modules/agents-admin/types';
import { WorkloadOverviewTab } from '@/modules/agents-admin/components/WorkloadOverviewTab';
import { AdminAssistantTab } from '@/modules/agents-admin/components/AdminAssistantTab';
import { BackendUnavailableAlert } from '@/modules/admin/components';

export default function AgentsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.agents');
  const tAdmin = useTranslations('admin');
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AgentType>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Queries
  const {
    data: agentsData, isLoading: agentsLoading, error: agentsError, refetch: refetchAgents,
  } = useAgentProfiles({
    agent_type: typeFilter !== 'all' ? typeFilter : undefined,
    is_active: undefined,
    page: 1,
    page_size: 100,
  });

  const {
    data: adminsData, isLoading: adminsLoading, error: adminsError, refetch: refetchAdmins,
  } = useAdminUsers(1, 100);

  const { data: alertsDashboard, isLoading: alertsLoading } = useAlertsDashboard();

  // Mutations
  const deactivateAgentMutation = useDeactivateAgent();
  const reactivateAgentMutation = useReactivateAgent();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const deleteAgentMutation = useDeleteAgentUser();

  const agents = agentsData?.items || [];
  const admins = adminsData?.items || [];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      !searchQuery ||
      agent.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.user_full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      !searchQuery ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const agentStats = {
    total: agents.length,
    active: agents.filter((a) => a.is_active).length,
    supervisors: agents.filter((a) => a.is_supervisor).length,
    ministry: agents.filter((a) => a.agent_type === 'ministry_agent').length,
    entity: agents.filter((a) => a.agent_type === 'entity_agent').length,
  };

  const adminStats = {
    total: admins.length,
    active: admins.filter((a) => a.status === 'active').length,
  };

  const handleCreateAgent = () => router.push(`/${locale}/dashboard/admin/agents/new?type=agent`);
  const handleCreateAdmin = () => router.push(`/${locale}/dashboard/admin/agents/new?type=admin`);
  const handleViewAgent = (agent: AgentProfile) => router.push(`/${locale}/dashboard/admin/agents/${agent.id}`);
  const handleEditAgent = (agent: AgentProfile) => router.push(`/${locale}/dashboard/admin/agents/${agent.id}?mode=edit`);

  const handleToggleAgentStatus = async (agent: AgentProfile) => {
    try {
      if (agent.is_active) {
        await deactivateAgentMutation.mutateAsync({ profileId: agent.id, reason: t('toast.deactivatedByAdmin') });
        toast({ title: t('toast.agentDeactivated') });
      } else {
        await reactivateAgentMutation.mutateAsync(agent.id);
        toast({ title: t('toast.agentReactivated') });
      }
      refetchAgents();
    } catch {
      toast({ variant: 'destructive', title: tAdmin('error'), description: t('toast.errorAgentStatus') });
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedUserId) return;
    try {
      await deleteAgentMutation.mutateAsync(selectedUserId);
      toast({ title: t('toast.agentDeleted') });
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      setSelectedAgent(null);
      refetchAgents();
    } catch {
      toast({ variant: 'destructive', title: tAdmin('error'), description: t('toast.errorDeleteAgent') });
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await deactivateUserMutation.mutateAsync({ userId, reason: t('toast.deactivatedByAdmin') });
        toast({ title: t('toast.adminDeactivated') });
      } else {
        await activateUserMutation.mutateAsync(userId);
        toast({ title: t('toast.adminActivated') });
      }
      refetchAdmins();
    } catch {
      toast({ variant: 'destructive', title: tAdmin('error'), description: t('toast.errorAdminStatus') });
    }
  };

  const getAgentTypeBadge = (type: string) => {
    if (type === 'ministry_agent') return <Badge variant="default">{t('status.ministry')}</Badge>;
    return <Badge variant="secondary">{t('status.entityBadge')}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? <Badge className="bg-green-100 text-green-800">{t('status.active')}</Badge>
      : <Badge variant="destructive">{t('status.inactive')}</Badge>;
  };

  const isBackendUnavailable = !!agentsError || !!adminsError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateAdmin}>
            <Shield className="h-4 w-4 mr-2" />
            {t('createAdmin')}
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createAgent')}
          </Button>
        </div>
      </div>

      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            {t('tabs.agents')} ({agentStats.total})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('tabs.admins')} ({adminStats.total})
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('tabs.overview')}
            {(alertsDashboard?.total_alerts ?? 0) > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
                {alertsDashboard?.total_alerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('tabs.assistant')}
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: t('stats.totalAgents'), value: agentStats.total },
              { label: t('stats.active'), value: agentStats.active, color: 'text-green-600' },
              { label: t('stats.supervisors'), value: agentStats.supervisors, color: 'text-amber-600' },
              { label: t('stats.ministries'), value: agentStats.ministry },
              { label: t('stats.entities'), value: agentStats.entity },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('listAgents')}</CardTitle>
                  <CardDescription>
                    {t('agentsFound', { count: filteredAgents.length })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={tAdmin('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('filters.allTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                      <SelectItem value="ministry_agent">{t('filters.ministryAgent')}</SelectItem>
                      <SelectItem value="entity_agent">{t('filters.entityAgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => refetchAgents()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">{tAdmin('loading')}</span>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" />
                  <p>{t('noAgentsFound')}</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.agent')}</TableHead>
                      <TableHead>{t('table.type')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('table.organization')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('table.tasks')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.user_full_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{agent.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAgentTypeBadge(agent.agent_type)}
                            {agent.is_supervisor && (
                              <Badge variant="outline" className="border-amber-500 text-amber-700">
                                {t('status.supervisor')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{agent.ministry_name || agent.entity_name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(agent.is_active)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {agent.current_assignments !== undefined ? <span>{agent.current_assignments}</span> : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAgent(agent)}>
                                <Eye className="h-4 w-4 mr-2" />{t('viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                <Edit className="h-4 w-4 mr-2" />{t('modify')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleAgentStatus(agent)}>
                                {agent.is_active
                                  ? <><UserX className="h-4 w-4 mr-2" />{t('deactivate')}</>
                                  : <><UserCheck className="h-4 w-4 mr-2" />{t('reactivate')}</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => { setSelectedAgent(agent); setSelectedUserId(agent.user_id); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />{t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('totalAdmins')}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{adminStats.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('stats.active')}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{adminStats.active}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('listAdmins')}</CardTitle>
                  <CardDescription>{t('adminsFound', { count: filteredAdmins.length })}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder={tAdmin('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchAdmins()}><RefreshCw className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">{tAdmin('loading')}</span>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" /><p>{t('noAdminsFound')}</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.administrator')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('table.lastLogin')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('table.createdAt')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{admin.first_name} {admin.last_name}</div>
                            <div className="text-sm text-muted-foreground">{admin.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {admin.status === 'active'
                            ? <Badge className="bg-green-100 text-green-800">{t('status.active')}</Badge>
                            : <Badge variant="destructive">{t('status.inactive')}</Badge>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {admin.last_login
                            ? new Date(admin.last_login).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : t('never')}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(admin.created_at).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleAdminStatus(admin.id, admin.status)}>
                                {admin.status === 'active'
                                  ? <><UserX className="h-4 w-4 mr-2" />{t('deactivate')}</>
                                  : <><UserCheck className="h-4 w-4 mr-2" />{t('activate')}</>}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <WorkloadOverviewTab
            agents={agents}
            agentsLoading={agentsLoading}
            dashboard={alertsDashboard}
            dashboardLoading={alertsLoading}
            onViewAgent={(agentId) => router.push(`/${locale}/dashboard/admin/agents/${agentId}`)}
          />
        </TabsContent>

        {/* Assistant IA Tab */}
        <TabsContent value="assistant">
          <AdminAssistantTab />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteDesc', { name: selectedAgent?.user_full_name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tAdmin('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-red-600 hover:bg-red-700">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
