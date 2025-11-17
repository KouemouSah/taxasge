/**
 * Recent Activity Component
 * Display recent audit log entries
 *
 * @module components/admin
 * @author Claude Code
 * @date 2025-11-18
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with actual data from API
const activities = [
  {
    id: 1,
    user: 'Admin System',
    action: 'Créé un nouveau rôle',
    target: 'ADMIN',
    time: 'Il y a 5 minutes',
    type: 'create',
  },
  {
    id: 2,
    user: 'Jean Dupont',
    action: 'Modifié les permissions',
    target: 'USER',
    time: 'Il y a 12 minutes',
    type: 'update',
  },
  {
    id: 3,
    user: 'Marie Martin',
    action: 'Supprimé un utilisateur',
    target: 'user@example.com',
    time: 'Il y a 1 heure',
    type: 'delete',
  },
  {
    id: 4,
    user: 'Admin System',
    action: 'Accordé permission temporaire',
    target: 'declarations:submit',
    time: 'Il y a 2 heures',
    type: 'grant',
  },
  {
    id: 5,
    user: 'Pierre Durand',
    action: 'Connexion réussie',
    target: 'Dashboard',
    time: 'Il y a 3 heures',
    type: 'login',
  },
];

const getActionColor = (type: string) => {
  switch (type) {
    case 'create':
      return 'bg-green-100 text-green-800';
    case 'update':
      return 'bg-blue-100 text-blue-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'grant':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activity.user
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activity.user}</span>
                  <Badge variant="outline" className={getActionColor(activity.type)}>
                    {activity.action}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Cible: <span className="font-mono">{activity.target}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
