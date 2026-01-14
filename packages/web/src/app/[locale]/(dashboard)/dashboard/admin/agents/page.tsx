'use client';

/**
 * Agents & Admins Admin Page
 * Manages agent profiles and admin users with tabbed interface
 *
 * BUSINESS RULES:
 * - Tab "Agents": CRUD for users with role='agent' (user + agent_profile)
 * - Tab "Admins": CRUD for users with role='admin' (user only, no profile)
 * - Tab "Charge de Travail": View workload stats for all agents
 * - Tab "Performance": View performance stats for all agents
 *
 * @module dashboard/admin/agents
 * @date 2025-01-14
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  UserCog,
  Shield,
  BarChart3,
  Activity,
  RefreshCw,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentProfiles,
  useAdminUsers,
  useDeactivateAgent,
  useReactivateAgent,
  useActivateUser,
  useDeactivateUser,
  useDeleteAgentUser,
} from '@/modules/agents-admin/hooks';
import type { AgentProfile, AgentType } from '@/modules/agents-admin/types';
import { BackendUnavailableAlert } from '@/modules/admin/components';

export default function AgentsPage() {
  const router = useRouter();
  const t = useTranslations('admin.agents');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AgentType>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Queries
  const {
    data: agentsData,
    isLoading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents,
  } = useAgentProfiles({
    agent_type: typeFilter !== 'all' ? typeFilter : undefined,
    is_active: undefined, // Show all
    page: 1,
    page_size: 100,
  });

  const {
    data: adminsData,
    isLoading: adminsLoading,
    error: adminsError,
    refetch: refetchAdmins,
  } = useAdminUsers(1, 100);

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

  // Stats
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

  const handleCreateAgent = () => {
    router.push('/dashboard/admin/agents/new?type=agent');
  };

  const handleCreateAdmin = () => {
    router.push('/dashboard/admin/agents/new?type=admin');
  };

  const handleViewAgent = (agent: AgentProfile) => {
    router.push(`/dashboard/admin/agents/${agent.id}`);
  };

  const handleEditAgent = (agent: AgentProfile) => {
    router.push(`/dashboard/admin/agents/${agent.id}/edit`);
  };

  const handleToggleAgentStatus = async (agent: AgentProfile) => {
    try {
      if (agent.is_active) {
        await deactivateAgentMutation.mutateAsync({
          profileId: agent.id,
          reason: 'Désactivé par administrateur',
        });
        toast({ title: 'Agent désactivé' });
      } else {
        await reactivateAgentMutation.mutateAsync(agent.id);
        toast({ title: 'Agent réactivé' });
      }
      refetchAgents();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de modifier le statut de l'agent",
      });
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedUserId) return;

    try {
      await deleteAgentMutation.mutateAsync(selectedUserId);
      toast({ title: 'Agent supprimé' });
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      setSelectedAgent(null);
      refetchAgents();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de supprimer l'agent",
      });
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await deactivateUserMutation.mutateAsync({
          userId,
          reason: 'Désactivé par administrateur',
        });
        toast({ title: 'Administrateur désactivé' });
      } else {
        await activateUserMutation.mutateAsync(userId);
        toast({ title: 'Administrateur activé' });
      }
      refetchAdmins();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de modifier le statut de l'administrateur",
      });
    }
  };

  const getAgentTypeBadge = (type: string) => {
    if (type === 'ministry_agent') {
      return <Badge variant="default">Ministère</Badge>;
    }
    return <Badge variant="secondary">Entité</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Actif</Badge>
    ) : (
      <Badge variant="destructive">Inactif</Badge>
    );
  };

  const isBackendUnavailable = !!agentsError || !!adminsError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title') || 'Agents & Administrateurs'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle') || 'Gérer les profils agents et les administrateurs système'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateAdmin}>
            <Shield className="h-4 w-4 mr-2" />
            Créer Admin
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Créer Agent
          </Button>
        </div>
      </div>

      {/* Backend Unavailable Alert */}
      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Agents ({agentStats.total})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administrateurs ({adminStats.total})
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Charge de Travail
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{agentStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Superviseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{agentStats.supervisors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ministères</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentStats.ministry}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentStats.entity}</div>
              </CardContent>
            </Card>
          </div>

          {/* Agents Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des Agents</CardTitle>
                  <CardDescription>
                    {filteredAgents.length} agent(s) trouvé(s)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type d'agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="ministry_agent">Ministère</SelectItem>
                      <SelectItem value="entity_agent">Entité</SelectItem>
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
                  <span className="ml-2 text-muted-foreground">Chargement...</span>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun agent trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Tâches</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.user_full_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              {agent.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAgentTypeBadge(agent.agent_type)}
                            {agent.is_supervisor && (
                              <Badge variant="outline" className="border-amber-500 text-amber-700">
                                Superviseur
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{agent.ministry_name || agent.entity_name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{agent.agent_role || 'validator'}</TableCell>
                        <TableCell>{getStatusBadge(agent.is_active)}</TableCell>
                        <TableCell>
                          {agent.current_assignments !== undefined ? (
                            <span>{agent.current_assignments}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAgent(agent)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleAgentStatus(agent)}>
                                {agent.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Réactiver
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedAgent(agent);
                                  setSelectedUserId(agent.user_id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Administrateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{adminStats.active}</div>
              </CardContent>
            </Card>
          </div>

          {/* Admins Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des Administrateurs</CardTitle>
                  <CardDescription>
                    {filteredAdmins.length} administrateur(s) trouvé(s)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchAdmins()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Chargement...</span>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun administrateur trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrateur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {admin.first_name} {admin.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{admin.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {admin.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800">Actif</Badge>
                          ) : (
                            <Badge variant="destructive">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {admin.last_login
                            ? new Date(admin.last_login).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Jamais'}
                        </TableCell>
                        <TableCell>
                          {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleAdminStatus(admin.id, admin.status)}
                              >
                                {admin.status === 'active' ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle>Charge de Travail des Agents</CardTitle>
              <CardDescription>
                Vue d&apos;ensemble de la charge de travail par agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 opacity-50" />
                <p>Sélectionnez un agent pour voir sa charge de travail</p>
                <p className="text-sm">
                  Ou accédez aux détails depuis la liste des agents
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Agents</CardTitle>
              <CardDescription>
                Statistiques de performance par agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p>Sélectionnez un agent pour voir ses performances</p>
                <p className="text-sm">
                  Ou accédez aux détails depuis la liste des agents
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;agent{' '}
              <strong>{selectedAgent?.user_full_name}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
