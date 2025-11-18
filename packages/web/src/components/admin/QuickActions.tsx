/**
 * Quick Actions Component
 * Quick access buttons for common admin tasks
 *
 * @module components/admin
 * @author Claude Code
 * @date 2025-11-18
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, ShieldPlus, KeyRound, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const quickActions = [
  {
    title: 'Nouvel Utilisateur',
    description: 'Créer un compte utilisateur',
    icon: UserPlus,
    href: '/dashboard/admin/users/new',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Nouveau Rôle',
    description: 'Créer un rôle personnalisé',
    icon: ShieldPlus,
    href: '/dashboard/admin/roles',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Gérer Permissions',
    description: 'Voir toutes les permissions',
    icon: KeyRound,
    href: '/dashboard/admin/permissions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Logs d\'Audit',
    description: 'Consulter l\'historique',
    icon: FileText,
    href: '/dashboard/admin/audit-logs',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <div className="group cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <div className={`inline-flex p-2 rounded-lg ${action.bgColor} mb-3`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
