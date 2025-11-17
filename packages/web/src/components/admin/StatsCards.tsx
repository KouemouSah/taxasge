/**
 * Stats Cards Component
 * Display key metrics for admin dashboard
 *
 * @module components/admin
 * @author Claude Code
 * @date 2025-11-18
 */

'use client';

import React from 'react';
import { Users, Shield, Key, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  {
    name: 'Utilisateurs Totaux',
    value: '1,234',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
    description: 'vs. mois dernier',
  },
  {
    name: 'Rôles Actifs',
    value: '8',
    change: '+2',
    changeType: 'positive' as const,
    icon: Shield,
    description: '3 système, 5 custom',
  },
  {
    name: 'Permissions',
    value: '52',
    change: '0',
    changeType: 'neutral' as const,
    icon: Key,
    description: 'Catalogue complet',
  },
  {
    name: 'Activité (24h)',
    value: '342',
    change: '-8%',
    changeType: 'negative' as const,
    icon: Activity,
    description: 'Actions enregistrées',
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs font-medium ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : stat.changeType === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">{stat.description}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
