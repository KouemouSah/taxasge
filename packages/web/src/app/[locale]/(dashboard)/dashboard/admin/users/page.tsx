'use client';

/**
 * Users Admin Page - Public Accounts Management
 * Display and manage citizen/business/accountant/funcionario users
 *
 * BUSINESS RULES:
 * - Shows ONLY: citizen, business, accountant, funcionario
 * - admin/agent are managed in /admin/agents
 * - NO creation (users self-register)
 * - NO modification (users manage their profiles)
 * - ONLY Activate/Deactivate functionality
 * - View details in read-only mode
 *
 * @module dashboard/admin/users
 * @date 2025-01-14
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  RefreshCw,
  AlertTriangle,
  Search,
  Shield,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
  Building2,
  Briefcase,
  User as UserIcon,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usersApi from '@/modules/users-admin/services/api';
import type { User } from '@/modules/users-admin/types';
import { UserRole } from '@/types/user';
import { useUserLabels } from '@/hooks/use-user-labels';
import { BackendUnavailableAlert } from '@/modules/admin/components';

// Roles managed in this page (NOT admin/agent - those are in /admin/agents)
const PUBLIC_ROLES = [
  UserRole.CITIZEN,
  UserRole.BUSINESS,
  UserRole.ACCOUNTANT,
  UserRole.FUNCIONARIO,
] as const;

type PublicRole = typeof PUBLIC_ROLES[number];

export default function UsersPage() {
  const locale = useLocale();
  const t = useTranslations('admin.users');
  const { toast } = useToast();
  const router = useRouter();
  const { getRoleLabel } = useUserLabels();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | PublicRole>('all');
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

  // Dialog states
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch users - filter to only public roles
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await usersApi.getAll({});
      // Filter to only show public roles (exclude admin and agent)
      const publicUsers = data.filter((user: User) =>
        PUBLIC_ROLES.includes(user.role as PublicRole)
      );
      setUsers(publicUsers);
      setIsBackendUnavailable(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorLoading');
      setError(errorMessage);

      if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed')) {
        setIsBackendUnavailable(true);
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorLoadingUsers'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter users based on search and tab
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === 'all' || user.role === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [users, searchQuery, activeTab]);

  // Statistics by role
  const stats = useMemo(() => {
    const byRole = {
      citizen: users.filter((u) => u.role === UserRole.CITIZEN).length,
      business: users.filter((u) => u.role === UserRole.BUSINESS).length,
      accountant: users.filter((u) => u.role === UserRole.ACCOUNTANT).length,
      funcionario: users.filter((u) => u.role === UserRole.FUNCIONARIO).length,
    };

    return {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      inactive: users.filter((u) => !u.is_active).length,
      byRole,
    };
  }, [users]);

  const getRoleBadge = (role: UserRole) => {
    const roleConfig: Record<string, { className: string; icon: React.ReactNode }> = {
      citizen: { className: 'bg-gray-100 text-gray-700', icon: <UserIcon className="h-3 w-3 mr-1" /> },
      business: { className: 'bg-green-100 text-green-700', icon: <Building2 className="h-3 w-3 mr-1" /> },
      accountant: { className: 'bg-blue-100 text-blue-700', icon: <Briefcase className="h-3 w-3 mr-1" /> },
      funcionario: { className: 'bg-amber-100 text-amber-700', icon: <UserCheck className="h-3 w-3 mr-1" /> },
    };

    const config = roleConfig[role];
    return (
      <Badge variant="outline" className={`flex items-center ${config?.className || 'bg-gray-100 text-gray-700'}`}>
        {config?.icon}
        {getRoleLabel(role)}
      </Badge>
    );
  };

  const handleViewDetails = (user: User) => {
    router.push(`/dashboard/admin/users/${user.id}`);
  };

  const handleActivate = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await usersApi.setActive(selectedUser.id, true);
      toast({
        title: t('successTitle'),
        description: t('userActivated'),
      });
      fetchUsers();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorActivating'),
      });
    } finally {
      setIsProcessing(false);
      setActivateDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await usersApi.setActive(selectedUser.id, false);
      toast({
        title: t('successTitle'),
        description: t('userDeactivated'),
      });
      fetchUsers();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorDeactivating'),
      });
    } finally {
      setIsProcessing(false);
      setDeactivateDialogOpen(false);
      setDeactivateReason('');
      setSelectedUser(null);
    }
  };

  const openActivateDialog = (user: User) => {
    setSelectedUser(user);
    setActivateDialogOpen(true);
  };

  const openDeactivateDialog = (user: User) => {
    setSelectedUser(user);
    setDeactivateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestion des comptes publics (citoyens, entreprises, comptables, fonctionnaires)
        </p>
      </div>

      {/* Backend Unavailable Alert */}
      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsTotal')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">comptes publics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsActive')}</CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">utilisateurs actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsInactive')}</CardTitle>
            <PowerOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">utilisateurs désactivés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.business}</div>
            <p className="text-xs text-muted-foreground">comptes entreprise</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('listTitle')}</CardTitle>
              <CardDescription>
                {t('usersFound', { count: filteredUsers.length })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs for filtering by role */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger value={UserRole.CITIZEN}>
                <UserIcon className="h-4 w-4 mr-1" />
                Citoyens ({stats.byRole.citizen})
              </TabsTrigger>
              <TabsTrigger value={UserRole.BUSINESS}>
                <Building2 className="h-4 w-4 mr-1" />
                Entreprises ({stats.byRole.business})
              </TabsTrigger>
              <TabsTrigger value={UserRole.ACCOUNTANT}>
                <Briefcase className="h-4 w-4 mr-1" />
                Comptables ({stats.byRole.accountant})
              </TabsTrigger>
              <TabsTrigger value={UserRole.FUNCIONARIO}>
                <UserCheck className="h-4 w-4 mr-1" />
                Fonctionnaires ({stats.byRole.funcionario})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('loading')}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('noUsersFound')}</p>
            </div>
          )}

          {!isLoading && !error && filteredUsers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableFullName')}</TableHead>
                  <TableHead>{t('tableEmail')}</TableHead>
                  <TableHead>{t('tableRole')}</TableHead>
                  <TableHead>{t('tableStatus')}</TableHead>
                  <TableHead>{t('table2FA')}</TableHead>
                  <TableHead>{t('tableLastLogin')}</TableHead>
                  <TableHead className="text-right">{t('tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {t('statusActive')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {t('statusInactive')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.two_factor_enabled ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        new Date(user.last_login).toLocaleDateString(locale, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-muted-foreground">{t('never')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_active ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => openDeactivateDialog(user)}
                            >
                              <PowerOff className="h-4 w-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => openActivateDialog(user)}
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}
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

      {/* Activate Dialog */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer l&apos;utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  L&apos;utilisateur <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> ({selectedUser.email})
                  pourra à nouveau accéder à son compte.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              Activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l&apos;utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  L&apos;utilisateur <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> ({selectedUser.email})
                  ne pourra plus accéder à son compte. Cette action est réversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Raison de la désactivation (optionnel)"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4 mr-2" />
              )}
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
