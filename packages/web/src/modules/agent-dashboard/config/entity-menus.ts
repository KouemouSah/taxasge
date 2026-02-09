/**
 * Entity Menu Configurations
 * Defines menu structure for each entity's agent dashboard
 *
 * @module agent-dashboard/config
 * @date 2025-01-14
 *
 * Each entity has its own menu configuration based on the workflows they handle.
 * Menu items are filtered by agent permissions at runtime.
 */

import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  CheckCircle,
  Clock,
  History,
  BarChart3,
  Users,
  Settings,
  Calendar,
  Car,
  FileSignature,
  Building2,
  BadgeCheck,
  CreditCard,
  RefreshCw,
  FileSearch,
  TrendingUp,
  Activity,
  ShieldAlert,
  FileSpreadsheet,
  Banknote,
  Wallet,
  FileKey,
  Home,
  Plane,
  Globe,
  Shield,
  FileCheck,
} from 'lucide-react';
import type { EntityDashboardConfig, EntityCode } from '../types';

// =============================================================================
// CNEDOGE - Centro Nacional de Expedición de Documentos (Parent Entity)
// Contains departments: CNEDOGE_PASAPORTE, CNEDOGE_RESIDENCIA
// =============================================================================

export const CNEDOGE_CONFIG: EntityDashboardConfig = {
  entityCode: 'CNEDOGE',
  titleKey: 'agent.entities.cnedoge.title',
  icon: FileKey,
  basePath: '/dashboard/agent/cnedoge',
  workflows: [
    'PASAPORTE_NUEVO',
    'PASAPORTE_RENOVACION',
    'PASAPORTE_PERDIDA',
    'PASAPORTE_ROBO',
    'PASAPORTE_DETERIORO',
    'RESIDENCIA_PRIMERA_VEZ',
    'RESIDENCIA_RENOVACION',
    'RESIDENCIA_DUPLICADO',
    'RESIDENCIA_CAMBIO_DATOS',
    'RESIDENCIA_REAGRUPACION',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/cnedoge',
      icon: LayoutDashboard,
    },
    {
      id: 'pasaportes',
      titleKey: 'agent.nav.passports',
      icon: Plane,
      items: [
        {
          id: 'pasaportes-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/pending',
          icon: Clock,
          permission: 'service_request.view',
          workflows: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION', 'PASAPORTE_PERDIDA', 'PASAPORTE_ROBO', 'PASAPORTE_DETERIORO'],
        },
        {
          id: 'pasaportes-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
          workflows: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION', 'PASAPORTE_PERDIDA', 'PASAPORTE_ROBO', 'PASAPORTE_DETERIORO'],
        },
        {
          id: 'pasaportes-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/appointments',
          icon: Calendar,
          permission: 'service_request.schedule_appointment',
          workflows: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION'],
        },
        {
          id: 'pasaportes-historial',
          titleKey: 'agent.nav.history',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/history',
          icon: History,
          permission: 'service_request.view',
        },
      ],
    },
    {
      id: 'residencias',
      titleKey: 'agent.nav.residences',
      icon: Globe,
      items: [
        {
          id: 'residencias-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/cnedoge-residencia/residencias/pending',
          icon: Clock,
          permission: 'service_request.view',
          workflows: ['RESIDENCIA_PRIMERA_VEZ', 'RESIDENCIA_RENOVACION', 'RESIDENCIA_DUPLICADO', 'RESIDENCIA_CAMBIO_DATOS', 'RESIDENCIA_REAGRUPACION'],
        },
        {
          id: 'residencias-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/cnedoge-residencia/residencias/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
          workflows: ['RESIDENCIA_PRIMERA_VEZ', 'RESIDENCIA_RENOVACION', 'RESIDENCIA_DUPLICADO', 'RESIDENCIA_CAMBIO_DATOS', 'RESIDENCIA_REAGRUPACION'],
        },
        {
          id: 'residencias-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/cnedoge-residencia/residencias/appointments',
          icon: Calendar,
          permission: 'service_request.schedule_appointment',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/cnedoge/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
        {
          id: 'analytics',
          titleKey: 'agent.nav.analytics',
          href: '/dashboard/agent/cnedoge/reports/analytics',
          icon: Activity,
          permission: 'reports.view_performance',
        },
      ],
      permission: 'reports.view',
    },
  ],
};

// =============================================================================
// CNEDOGE_PASAPORTE - Passport Department (child of CNEDOGE)
// Handles: Only passport-related workflows
// =============================================================================

export const CNEDOGE_PASAPORTE_CONFIG: EntityDashboardConfig = {
  entityCode: 'CNEDOGE_PASAPORTE',
  titleKey: 'agent.entities.cnedogePasaporte.title',
  icon: Plane,
  basePath: '/dashboard/agent/cnedoge-pasaporte',
  workflows: [
    'PASAPORTE_NUEVO',
    'PASAPORTE_RENOVACION',
    'PASAPORTE_PERDIDA',
    'PASAPORTE_ROBO',
    'PASAPORTE_DETERIORO',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/cnedoge-pasaporte',
      icon: LayoutDashboard,
    },
    {
      id: 'pasaportes',
      titleKey: 'agent.nav.passports',
      icon: Plane,
      items: [
        {
          id: 'pasaportes-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'pasaportes-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
        },
        {
          id: 'pasaportes-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/appointments',
          icon: Calendar,
          permission: 'service_request.schedule_appointment',
        },
        {
          id: 'pasaportes-historial',
          titleKey: 'agent.nav.history',
          href: '/dashboard/agent/cnedoge-pasaporte/pasaportes/history',
          icon: History,
          permission: 'service_request.view',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/cnedoge-pasaporte/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
      permission: 'reports.view',
    },
  ],
};

// =============================================================================
// CNEDOGE_RESIDENCIA - Residence Permit Department (child of CNEDOGE)
// Handles: Only residence-related workflows
// =============================================================================

export const CNEDOGE_RESIDENCIA_CONFIG: EntityDashboardConfig = {
  entityCode: 'CNEDOGE_RESIDENCIA',
  titleKey: 'agent.entities.cnedogeResidencia.title',
  icon: Globe,
  basePath: '/dashboard/agent/cnedoge-residencia',
  workflows: [
    'RESIDENCIA_PRIMERA_VEZ',
    'RESIDENCIA_RENOVACION',
    'RESIDENCIA_DUPLICADO',
    'RESIDENCIA_CAMBIO_DATOS',
    'RESIDENCIA_REAGRUPACION',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/cnedoge-residencia',
      icon: LayoutDashboard,
    },
    {
      id: 'residencias',
      titleKey: 'agent.nav.residences',
      icon: Globe,
      items: [
        {
          id: 'residencias-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/cnedoge-residencia/residencias/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'residencias-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/cnedoge-residencia/residencias/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
        },
        {
          id: 'residencias-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/cnedoge-residencia/residencias/appointments',
          icon: Calendar,
          permission: 'service_request.schedule_appointment',
        },
        {
          id: 'residencias-historial',
          titleKey: 'agent.nav.history',
          href: '/dashboard/agent/cnedoge-residencia/residencias/history',
          icon: History,
          permission: 'service_request.view',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/cnedoge-residencia/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
      permission: 'reports.view',
    },
  ],
};

// =============================================================================
// DGT - Dirección General de Tráfico
// Handles: Driver licenses, Vehicle transfers
// =============================================================================

export const DGT_CONFIG: EntityDashboardConfig = {
  entityCode: 'DGT',
  titleKey: 'agent.entities.dgt.title',
  icon: Car,
  basePath: '/dashboard/agent/dgt',
  workflows: [
    'CONDUCIR_NUEVO',
    'CONDUCIR_CANJE',
    'CONDUCIR_RENOVACION',
    'CONDUCIR_DUPLICADO',
    'CONDUCIR_EXTENSION',
    'VEHICULO_PRIMERA_MATRICULACION',
    'VEHICULO_TRANSFERENCIA',
    'VEHICULO_DUPLICADO_PERMISO',
    'VEHICULO_CAMBIO_CARACTERISTICAS',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/dgt',
      icon: LayoutDashboard,
    },
    {
      id: 'permisos-conducir',
      titleKey: 'agent.nav.driverLicenses',
      icon: FileText,
      items: [
        {
          id: 'permisos-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/dgt/licencias/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'permisos-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/dgt/licencias/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
        },
        {
          id: 'permisos-examenes',
          titleKey: 'agent.nav.exams',
          href: '/dashboard/agent/dgt/licencias/exams',
          icon: ClipboardList,
          permission: 'exams.manage',
        },
      ],
    },
    {
      id: 'vehiculos',
      titleKey: 'agent.nav.vehicles',
      icon: Car,
      items: [
        {
          id: 'vehiculos-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/dgt/vehiculos/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'vehiculos-matriculacion',
          titleKey: 'agent.nav.registration',
          href: '/dashboard/agent/dgt/vehiculos/registration',
          icon: FileSignature,
          permission: 'service_request.approve',
        },
        {
          id: 'vehiculos-transferencias',
          titleKey: 'agent.nav.transfers',
          href: '/dashboard/agent/dgt/vehiculos/transfers',
          icon: RefreshCw,
          permission: 'service_request.approve',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/dgt/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
    },
  ],
};

// =============================================================================
// ONRC - Oficina Nacional de Registro de Contratos
// Handles: Contract registration
// =============================================================================

export const ONRC_CONFIG: EntityDashboardConfig = {
  entityCode: 'ONRC',
  titleKey: 'agent.entities.onrc.title',
  icon: FileSignature,
  basePath: '/dashboard/agent/onrc',
  workflows: [
    'CONTRATO_OBRA',
    'CONTRATO_SERVICIO',
    'CONTRATO_SUMINISTRO',
    'CONTRATO_CONCESION',
    'CONTRATO_JOINT_VENTURE',
    'CONTRATO_ARRENDAMIENTO',
    'CONTRATO_OTRO',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/onrc',
      icon: LayoutDashboard,
    },
    {
      id: 'contratos',
      titleKey: 'agent.nav.contracts',
      icon: FileSignature,
      items: [
        {
          id: 'contratos-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/onrc/contratos/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'contratos-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/onrc/contratos/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
        },
        {
          id: 'contratos-registro',
          titleKey: 'agent.nav.registered',
          href: '/dashboard/agent/onrc/contratos/registered',
          icon: FileText,
          permission: 'service_request.view',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/onrc/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
    },
  ],
};

// =============================================================================
// MINFP - Ministerio de Función Pública
// Handles: Civil servant verification, IDs, certificates
// =============================================================================

export const MINFP_CONFIG: EntityDashboardConfig = {
  entityCode: 'MINFP',
  titleKey: 'agent.entities.minfp.title',
  icon: BadgeCheck,
  basePath: '/dashboard/agent/minfp',
  workflows: [
    'FP_VERIFICACION_FUNCIONARIO',
    'FP_CARNET_FUNCIONARIO',
    'FP_PROMOCION_ADMINISTRATIVA',
    'FP_PERMISO_EXTRAORDINARIO',
    'FP_CERTIFICADO_ADMINISTRATIVO',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/minfp',
      icon: LayoutDashboard,
    },
    {
      id: 'funcionarios',
      titleKey: 'agent.nav.civilServants',
      icon: Users,
      items: [
        {
          id: 'verificacion-pendientes',
          titleKey: 'agent.nav.verificationPending',
          href: '/dashboard/agent/minfp/verificacion/pending',
          icon: Clock,
          permission: 'service_request.view',
          workflows: ['FP_VERIFICACION_FUNCIONARIO'],
        },
        {
          id: 'verificacion-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/minfp/verificacion/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
        },
        {
          id: 'carnets',
          titleKey: 'agent.nav.idCards',
          href: '/dashboard/agent/minfp/carnets',
          icon: BadgeCheck,
          permission: 'service_request.view',
          workflows: ['FP_CARNET_FUNCIONARIO'],
        },
      ],
    },
    {
      id: 'certificados',
      titleKey: 'agent.nav.certificates',
      icon: FileText,
      items: [
        {
          id: 'certificados-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/minfp/certificados/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'certificados-emitidos',
          titleKey: 'agent.nav.issued',
          href: '/dashboard/agent/minfp/certificados/issued',
          icon: CheckCircle,
          permission: 'service_request.view',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/minfp/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
    },
  ],
};

// =============================================================================
// TESORO - Treasury (Agent de Trésorerie)
// Handles: Payment validation, reconciliation
// Module-based entity (no workflows, uses treasury module directly)
// =============================================================================

export const TESORO_CONFIG: EntityDashboardConfig = {
  entityCode: 'TESORO',
  titleKey: 'agent.entities.tesoro.title',
  icon: Wallet,
  basePath: '/dashboard/agent/treasury',
  workflows: [],  // Treasury handles all payment validation, not specific workflows

  // Module-based configuration
  menuSource: 'module',
  modulePermissionPrefix: 'treasury',
  dataSource: 'service_payments',

  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/treasury',
      icon: LayoutDashboard,
    },
    {
      id: 'payments',
      titleKey: 'agent.nav.payments',
      icon: CreditCard,
      items: [
        {
          id: 'validation',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/treasury/validation',
          icon: CheckCircle,
          permission: 'treasury.validate_payment',  // Aligned with backend
        },
        {
          id: 'reconciliation',
          titleKey: 'agent.nav.reconciliation',
          href: '/dashboard/agent/treasury/reconciliation',
          icon: RefreshCw,
          permission: 'treasury.reconcile',  // Aligned with backend
        },
        {
          id: 'transactions',
          titleKey: 'agent.nav.transactions',
          href: '/dashboard/agent/treasury/transactions',
          icon: History,
          permission: 'treasury.view_payment',  // Aligned with backend
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/treasury/stats',
          icon: TrendingUp,
          permission: 'treasury_stat.view',  // Aligned with backend
        },
        {
          id: 'analytics',
          titleKey: 'agent.nav.analytics',
          href: '/dashboard/agent/treasury/analytics',
          icon: Activity,
          permission: 'treasury_stat.view',  // Aligned with backend
        },
        {
          id: 'audit',
          titleKey: 'agent.nav.audit',
          href: '/dashboard/agent/treasury/audit',
          icon: FileSearch,
          permission: 'treasury_audit.view',  // Aligned with backend
        },
        {
          id: 'sla',
          titleKey: 'agent.nav.slaStats',
          href: '/dashboard/agent/treasury/stats/sla',
          icon: BarChart3,
          permission: 'treasury_stat.view',  // Aligned with backend
        },
        {
          id: 'anomalies',
          titleKey: 'agent.nav.anomalies',
          href: '/dashboard/agent/treasury/anomalies',
          icon: ShieldAlert,
          permission: 'treasury_anomaly.view',  // Aligned with backend
        },
        {
          id: 'exports',
          titleKey: 'agent.nav.exports',
          href: '/dashboard/agent/treasury/exports',
          icon: FileSpreadsheet,
          permission: 'treasury_export.view',  // Aligned with backend
        },
      ],
    },
    {
      id: 'settings',
      titleKey: 'agent.nav.settings',
      icon: Settings,
      items: [
        {
          id: 'banks',
          titleKey: 'agent.nav.banks',
          href: '/dashboard/agent/treasury/settings/banks',
          icon: Building2,
          permission: 'treasury.manage_settings',  // New permission - supervisor only
        },
        {
          id: 'payment-methods',
          titleKey: 'agent.nav.paymentMethods',
          href: '/dashboard/agent/treasury/settings/payment-methods',
          icon: Banknote,
          permission: 'treasury.manage_settings',  // New permission - supervisor only
        },
      ],
      permission: 'treasury.manage_settings',  // Group-level permission
    },
  ],
};

// =============================================================================
// OFIVE - Oficina de Vehículos (CUVE documents)
// =============================================================================

export const OFIVE_CONFIG: EntityDashboardConfig = {
  entityCode: 'OFIVE',
  titleKey: 'agent.entities.ofive.title',
  icon: Car,
  basePath: '/dashboard/agent/ofive',
  workflows: [
    'VEHICULO_RENOVACION_CUVE',
    'VEHICULO_DUPLICADO_CUVE',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/ofive',
      icon: LayoutDashboard,
    },
    {
      id: 'cuve',
      titleKey: 'agent.nav.cuveDocuments',
      icon: FileText,
      items: [
        {
          id: 'cuve-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/ofive/cuve/pending',
          icon: Clock,
          permission: 'service_request.view',
        },
        {
          id: 'cuve-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/ofive/cuve/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
        },
        {
          id: 'cuve-emitidos',
          titleKey: 'agent.nav.issued',
          href: '/dashboard/agent/ofive/cuve/issued',
          icon: FileText,
          permission: 'service_request.view',
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/ofive/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
    },
  ],
};

// =============================================================================
// EXTRANJERIA - Service des Étrangers
// =============================================================================

export const EXTRANJERIA_CONFIG: EntityDashboardConfig = {
  entityCode: 'EXTRANJERIA',
  titleKey: 'agent.entities.extranjeria.title',
  icon: Globe,
  basePath: '/dashboard/agent/extranjeria',
  workflows: [
    'RESIDENCIA_PRIMERA_VEZ',
    'RESIDENCIA_RENOVACION',
    'RESIDENCIA_DUPLICADO',
    'RESIDENCIA_CAMBIO_DATOS',
    'RESIDENCIA_REAGRUPACION',
    'PRORROGA_VISADO',
    'VISADO_ALTERNATIVO',
    'PERMANENCIA_EXTRANJERIA',
    'SALIDA_VISADO_VENCIDO',
  ],
  menuItems: [
    {
      id: 'dashboard',
      titleKey: 'agent.nav.dashboard',
      href: '/dashboard/agent/extranjeria',
      icon: LayoutDashboard,
    },
    {
      id: 'residencias',
      titleKey: 'agent.nav.residences',
      icon: Home,
      items: [
        {
          id: 'residencias-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/extranjeria/residencias/pending',
          icon: Clock,
          permission: 'service_request.view',
          workflows: ['RESIDENCIA_PRIMERA_VEZ', 'RESIDENCIA_RENOVACION', 'RESIDENCIA_DUPLICADO', 'RESIDENCIA_CAMBIO_DATOS', 'RESIDENCIA_REAGRUPACION'],
        },
        {
          id: 'residencias-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/extranjeria/residencias/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
          workflows: ['RESIDENCIA_PRIMERA_VEZ', 'RESIDENCIA_RENOVACION', 'RESIDENCIA_DUPLICADO', 'RESIDENCIA_CAMBIO_DATOS', 'RESIDENCIA_REAGRUPACION'],
        },
        {
          id: 'residencias-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/extranjeria/residencias/appointments',
          icon: Calendar,
          permission: 'service_request.schedule_appointment',
        },
      ],
    },
    {
      id: 'visados',
      titleKey: 'agent.nav.visas',
      icon: Globe,
      items: [
        {
          id: 'visados-pendientes',
          titleKey: 'agent.nav.pending',
          href: '/dashboard/agent/extranjeria/visados/pending',
          icon: Clock,
          permission: 'service_request.view',
          workflows: ['PRORROGA_VISADO', 'VISADO_ALTERNATIVO', 'PERMANENCIA_EXTRANJERIA', 'SALIDA_VISADO_VENCIDO'],
        },
        {
          id: 'visados-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/extranjeria/visados/validation',
          icon: CheckCircle,
          permission: 'service_request.approve',
          workflows: ['PRORROGA_VISADO', 'VISADO_ALTERNATIVO', 'PERMANENCIA_EXTRANJERIA', 'SALIDA_VISADO_VENCIDO'],
        },
      ],
    },
    {
      id: 'reports',
      titleKey: 'agent.nav.reports',
      icon: BarChart3,
      items: [
        {
          id: 'stats',
          titleKey: 'agent.nav.stats',
          href: '/dashboard/agent/extranjeria/reports/stats',
          icon: TrendingUp,
          permission: 'reports.view',
        },
      ],
    },
  ],
};

// =============================================================================
// ALL ENTITY CONFIGS REGISTRY
// =============================================================================

export const ENTITY_CONFIGS: Record<EntityCode, EntityDashboardConfig> = {
  CNEDOGE: CNEDOGE_CONFIG,
  CNEDOGE_PASAPORTE: CNEDOGE_PASAPORTE_CONFIG,
  CNEDOGE_RESIDENCIA: CNEDOGE_RESIDENCIA_CONFIG,
  DGT: DGT_CONFIG,
  ONRC: ONRC_CONFIG,
  MINFP: MINFP_CONFIG,
  TESORO: TESORO_CONFIG,
  OFIVE: OFIVE_CONFIG,
  EXTRANJERIA: EXTRANJERIA_CONFIG,
  ITVE: {
    entityCode: 'ITVE',
    titleKey: 'agent.entities.itve.title',
    icon: Car,
    basePath: '/dashboard/agent/itve',
    workflows: ['VEHICULO_RENOVACION_ITV'],
    menuItems: [
      {
        id: 'dashboard',
        titleKey: 'agent.nav.dashboard',
        href: '/dashboard/agent/itve',
        icon: LayoutDashboard,
      },
    ],
  },
  DGI: {
    entityCode: 'DGI',
    titleKey: 'agent.entities.dgi.title',
    icon: Building2,
    basePath: '/dashboard/agent/dgi',
    workflows: [],  // DGI handles tax declarations, different workflow
    menuItems: [
      {
        id: 'dashboard',
        titleKey: 'agent.nav.dashboard',
        href: '/dashboard/agent/dgi',
        icon: LayoutDashboard,
      },
    ],
  },
  POLICIA: {
    entityCode: 'POLICIA',
    titleKey: 'agent.entities.policia.title',
    icon: Shield,
    basePath: '/dashboard/agent/policia',
    workflows: [],  // Will be populated when POLICIA workflows are defined
    menuItems: [
      {
        id: 'dashboard',
        titleKey: 'agent.nav.dashboard',
        href: '/dashboard/agent/policia',
        icon: LayoutDashboard,
      },
      {
        id: 'certificados',
        titleKey: 'agent.nav.certificates',
        icon: FileCheck,
        items: [
          { id: 'pending', titleKey: 'agent.nav.pending', href: '/dashboard/agent/policia/certificados/pending', icon: Clock, permission: 'service_request.view_queue' },
          { id: 'validation', titleKey: 'agent.nav.validation', href: '/dashboard/agent/policia/certificados/validation', icon: CheckCircle, permission: 'service_request.process' },
          { id: 'history', titleKey: 'agent.nav.history', href: '/dashboard/agent/policia/certificados/history', icon: History, permission: 'service_request.view' },
        ],
      },
      {
        id: 'appointments',
        titleKey: 'agent.nav.appointments',
        href: '/dashboard/agent/policia/appointments',
        icon: Calendar,
        permission: 'service_request.view_appointments',
      },
    ],
  },
  GENERAL: {
    entityCode: 'GENERAL',
    titleKey: 'agent.entities.general.title',
    icon: LayoutDashboard,
    basePath: '/dashboard/agent',
    workflows: [],
    menuItems: [
      {
        id: 'dashboard',
        titleKey: 'agent.nav.dashboard',
        href: '/dashboard/agent',
        icon: LayoutDashboard,
      },
    ],
  },
};

/**
 * Get entity configuration by code
 */
export function getEntityConfig(entityCode: EntityCode): EntityDashboardConfig {
  return ENTITY_CONFIGS[entityCode] || ENTITY_CONFIGS.GENERAL;
}

/**
 * Get entity code from entity name (for backward compatibility)
 */
export function getEntityCodeFromName(entityName: string): EntityCode {
  const normalizedName = entityName.toUpperCase().trim();

  // Direct match
  if (normalizedName in ENTITY_CONFIGS) {
    return normalizedName as EntityCode;
  }

  // Partial matches
  if (normalizedName.includes('TESORO') || normalizedName.includes('TREASURY')) {
    return 'TESORO';
  }
  if (normalizedName.includes('TRAFICO') || normalizedName.includes('DGT')) {
    return 'DGT';
  }
  if (normalizedName.includes('CNEDOGE') || normalizedName.includes('PASAPORTE')) {
    return 'CNEDOGE';
  }
  if (normalizedName.includes('CONTRATO') || normalizedName.includes('ONRC')) {
    return 'ONRC';
  }
  if (normalizedName.includes('FUNCION') || normalizedName.includes('MINFP')) {
    return 'MINFP';
  }
  if (normalizedName.includes('EXTRANJERIA') || normalizedName.includes('ETRANGER')) {
    return 'EXTRANJERIA';
  }
  if (normalizedName.includes('OFIVE') || normalizedName.includes('CUVE')) {
    return 'OFIVE';
  }
  if (normalizedName.includes('IMPUESTO') || normalizedName.includes('DGI')) {
    return 'DGI';
  }

  return 'GENERAL';
}
