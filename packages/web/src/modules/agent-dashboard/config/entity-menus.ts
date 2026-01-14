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
  AlertTriangle,
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
  UserCheck,
  FileKey,
  Home,
  Plane,
  Globe,
} from 'lucide-react';
import type { EntityDashboardConfig, EntityCode } from '../types';

// =============================================================================
// CNEDOGE - Centro Nacional de Expedición de Documentos
// Handles: Passports, DIP, Residences for foreigners
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
          href: '/dashboard/agent/cnedoge/pasaportes/pending',
          icon: Clock,
          permission: 'service_requests.read',
          workflows: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION', 'PASAPORTE_PERDIDA', 'PASAPORTE_ROBO', 'PASAPORTE_DETERIORO'],
        },
        {
          id: 'pasaportes-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/cnedoge/pasaportes/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
          workflows: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION', 'PASAPORTE_PERDIDA', 'PASAPORTE_ROBO', 'PASAPORTE_DETERIORO'],
        },
        {
          id: 'pasaportes-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/cnedoge/pasaportes/appointments',
          icon: Calendar,
          permission: 'appointments.manage',
          workflows: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION'],
        },
        {
          id: 'pasaportes-historial',
          titleKey: 'agent.nav.history',
          href: '/dashboard/agent/cnedoge/pasaportes/history',
          icon: History,
          permission: 'service_requests.read',
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
          href: '/dashboard/agent/cnedoge/residencias/pending',
          icon: Clock,
          permission: 'service_requests.read',
          workflows: ['RESIDENCIA_PRIMERA_VEZ', 'RESIDENCIA_RENOVACION', 'RESIDENCIA_DUPLICADO'],
        },
        {
          id: 'residencias-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/cnedoge/residencias/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
        },
        {
          id: 'residencias-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/cnedoge/residencias/appointments',
          icon: Calendar,
          permission: 'appointments.manage',
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
          permission: 'reports.read',
        },
        {
          id: 'analytics',
          titleKey: 'agent.nav.analytics',
          href: '/dashboard/agent/cnedoge/reports/analytics',
          icon: Activity,
          permission: 'reports.read',
        },
      ],
      permission: 'reports.read',
    },
    {
      id: 'settings',
      titleKey: 'agent.nav.settings',
      href: '/dashboard/agent/cnedoge/settings',
      icon: Settings,
      permission: 'settings.read',
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
          permission: 'service_requests.read',
        },
        {
          id: 'permisos-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/dgt/licencias/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
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
          permission: 'service_requests.read',
        },
        {
          id: 'vehiculos-matriculacion',
          titleKey: 'agent.nav.registration',
          href: '/dashboard/agent/dgt/vehiculos/registration',
          icon: FileSignature,
          permission: 'service_requests.validate',
        },
        {
          id: 'vehiculos-transferencias',
          titleKey: 'agent.nav.transfers',
          href: '/dashboard/agent/dgt/vehiculos/transfers',
          icon: RefreshCw,
          permission: 'service_requests.validate',
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
          permission: 'reports.read',
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
          permission: 'service_requests.read',
        },
        {
          id: 'contratos-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/onrc/contratos/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
        },
        {
          id: 'contratos-registro',
          titleKey: 'agent.nav.registered',
          href: '/dashboard/agent/onrc/contratos/registered',
          icon: FileText,
          permission: 'service_requests.read',
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
          permission: 'reports.read',
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
          permission: 'service_requests.read',
          workflows: ['FP_VERIFICACION_FUNCIONARIO'],
        },
        {
          id: 'verificacion-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/minfp/verificacion/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
        },
        {
          id: 'carnets',
          titleKey: 'agent.nav.idCards',
          href: '/dashboard/agent/minfp/carnets',
          icon: BadgeCheck,
          permission: 'service_requests.read',
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
          permission: 'service_requests.read',
        },
        {
          id: 'certificados-emitidos',
          titleKey: 'agent.nav.issued',
          href: '/dashboard/agent/minfp/certificados/issued',
          icon: CheckCircle,
          permission: 'service_requests.read',
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
          permission: 'reports.read',
        },
      ],
    },
  ],
};

// =============================================================================
// TESORO - Treasury (Agent de Trésorerie)
// Handles: Payment validation, reconciliation
// =============================================================================

export const TESORO_CONFIG: EntityDashboardConfig = {
  entityCode: 'TESORO',
  titleKey: 'agent.entities.tesoro.title',
  icon: Wallet,
  basePath: '/dashboard/agent/treasury',
  workflows: [],  // Treasury handles all payment validation, not specific workflows
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
          permission: 'payments.validate',
        },
        {
          id: 'reconciliation',
          titleKey: 'agent.nav.reconciliation',
          href: '/dashboard/agent/treasury/reconciliation',
          icon: RefreshCw,
          permission: 'payments.reconcile',
        },
        {
          id: 'transactions',
          titleKey: 'agent.nav.transactions',
          href: '/dashboard/agent/treasury/transactions',
          icon: History,
          permission: 'payments.read',
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
          permission: 'reports.read',
        },
        {
          id: 'analytics',
          titleKey: 'agent.nav.analytics',
          href: '/dashboard/agent/treasury/analytics',
          icon: Activity,
          permission: 'reports.read',
        },
        {
          id: 'audit',
          titleKey: 'agent.nav.audit',
          href: '/dashboard/agent/treasury/audit',
          icon: FileSearch,
          permission: 'audit.read',
        },
        {
          id: 'sla',
          titleKey: 'agent.nav.slaStats',
          href: '/dashboard/agent/treasury/stats/sla',
          icon: BarChart3,
          permission: 'reports.read',
        },
        {
          id: 'anomalies',
          titleKey: 'agent.nav.anomalies',
          href: '/dashboard/agent/treasury/anomalies',
          icon: ShieldAlert,
          permission: 'anomalies.read',
        },
        {
          id: 'exports',
          titleKey: 'agent.nav.exports',
          href: '/dashboard/agent/treasury/exports',
          icon: FileSpreadsheet,
          permission: 'exports.create',
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
          permission: 'banks.manage',
        },
        {
          id: 'payment-methods',
          titleKey: 'agent.nav.paymentMethods',
          href: '/dashboard/agent/treasury/settings/payment-methods',
          icon: Banknote,
          permission: 'payment_methods.manage',
        },
      ],
      permission: 'settings.manage',
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
          permission: 'service_requests.read',
        },
        {
          id: 'cuve-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/ofive/cuve/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
        },
        {
          id: 'cuve-emitidos',
          titleKey: 'agent.nav.issued',
          href: '/dashboard/agent/ofive/cuve/issued',
          icon: FileText,
          permission: 'service_requests.read',
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
          permission: 'reports.read',
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
          permission: 'service_requests.read',
        },
        {
          id: 'residencias-validacion',
          titleKey: 'agent.nav.validation',
          href: '/dashboard/agent/extranjeria/residencias/validation',
          icon: CheckCircle,
          permission: 'service_requests.validate',
        },
        {
          id: 'residencias-citas',
          titleKey: 'agent.nav.appointments',
          href: '/dashboard/agent/extranjeria/residencias/appointments',
          icon: Calendar,
          permission: 'appointments.manage',
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
          permission: 'reports.read',
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
