/**
 * Admin Dashboard Index Page
 * Main dashboard with statistics and overview
 *
 * @module dashboard/admin
 * @author Claude Code
 * @date 2025-11-18
 */

import React from 'react';
import StatsCards from '@/components/admin/StatsCards';
import RecentActivity from '@/components/admin/RecentActivity';
import QuickActions from '@/components/admin/QuickActions';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <p className="text-gray-600 mt-2">
          Vue d&apos;ensemble du système et des activités
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity />

        {/* System Health or other widget */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">État du Système</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Backend</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Opérationnel
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base de données</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Opérationnel
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Stockage Fichiers</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Opérationnel
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Email</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                Dégradé
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
