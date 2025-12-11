/**
 * useUserLabels Hook
 *
 * Centralized hook for translating user roles and statuses
 * Uses hybrid approach: API for roles (real-time), static for statuses
 *
 * @module hooks
 * @author Claude Code
 * @date 2025-12-11
 */

import { useTranslations } from 'next-intl'
import { UserRole, UserStatus } from '@/types/user'
import { useEnumLabels } from './use-enum-labels'

export function useUserLabels() {
  const t = useTranslations('admin')
  const { getLabel: getEnumLabel, isLoading: isLoadingEnums } = useEnumLabels()

  /**
   * Get translated label for user role
   * Uses hybrid approach: API first (real-time), then static fallback
   */
  const getRoleLabel = (role: UserRole | string): string => {
    // Use the hybrid enum labels hook (API + fallback)
    return getEnumLabel('user_role_enum', role as string)
  }

  /**
   * Get translated label for user status
   */
  const getStatusLabel = (status: UserStatus | string): string => {
    const statusMap: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: t('users.statusActive'),
      [UserStatus.INACTIVE]: t('users.statusInactive'),
      [UserStatus.PENDING]: t('users.statusPending'),
      [UserStatus.SUSPENDED]: t('users.statusSuspended'),
    }

    return statusMap[status as UserStatus] || status
  }

  /**
   * Get all role options for filters/selects
   * Uses hybrid approach for labels (API + fallback)
   */
  const getRoleOptions = (includeAll = true) => {
    const options = [
      { value: UserRole.CITIZEN, label: getRoleLabel(UserRole.CITIZEN) },
      { value: UserRole.BUSINESS, label: getRoleLabel(UserRole.BUSINESS) },
      { value: UserRole.ACCOUNTANT, label: getRoleLabel(UserRole.ACCOUNTANT) },
      { value: UserRole.ADMIN, label: getRoleLabel(UserRole.ADMIN) },
      { value: UserRole.DGI_AGENT, label: getRoleLabel(UserRole.DGI_AGENT) },
      {
        value: UserRole.SUPERVISOR_JUNIOR_DGI,
        label: getRoleLabel(UserRole.SUPERVISOR_JUNIOR_DGI),
      },
      {
        value: UserRole.SUPERVISOR_READONLY,
        label: getRoleLabel(UserRole.SUPERVISOR_READONLY),
      },
      {
        value: UserRole.SUPERVISOR_SENIOR,
        label: getRoleLabel(UserRole.SUPERVISOR_SENIOR),
      },
      {
        value: UserRole.MINISTRY_AGENT,
        label: getRoleLabel(UserRole.MINISTRY_AGENT),
      },
      {
        value: UserRole.SUPERVISOR_DGI,
        label: getRoleLabel(UserRole.SUPERVISOR_DGI),
      },
    ]

    if (includeAll) {
      return [{ value: 'all', label: t('users.allRoles') }, ...options]
    }
    return options
  }

  /**
   * Get all status options for filters/selects
   */
  const getStatusOptions = () => {
    return [
      { value: 'all', label: t('users.allStatuses') },
      { value: UserStatus.ACTIVE, label: getStatusLabel(UserStatus.ACTIVE) },
      { value: UserStatus.INACTIVE, label: getStatusLabel(UserStatus.INACTIVE) },
      { value: UserStatus.PENDING, label: getStatusLabel(UserStatus.PENDING) },
      { value: UserStatus.SUSPENDED, label: getStatusLabel(UserStatus.SUSPENDED) },
    ]
  }

  /**
   * Get role options grouped by category
   */
  const getRoleOptionsGrouped = () => {
    return {
      citizens: [
        { value: UserRole.CITIZEN, label: getRoleLabel(UserRole.CITIZEN) },
        { value: UserRole.BUSINESS, label: getRoleLabel(UserRole.BUSINESS) },
      ],
      professionals: [
        { value: UserRole.ACCOUNTANT, label: getRoleLabel(UserRole.ACCOUNTANT) },
        { value: UserRole.DGI_AGENT, label: getRoleLabel(UserRole.DGI_AGENT) },
        {
          value: UserRole.SUPERVISOR_JUNIOR_DGI,
          label: getRoleLabel(UserRole.SUPERVISOR_JUNIOR_DGI),
        },
        {
          value: UserRole.SUPERVISOR_READONLY,
          label: getRoleLabel(UserRole.SUPERVISOR_READONLY),
        },
        {
          value: UserRole.SUPERVISOR_SENIOR,
          label: getRoleLabel(UserRole.SUPERVISOR_SENIOR),
        },
        {
          value: UserRole.MINISTRY_AGENT,
          label: getRoleLabel(UserRole.MINISTRY_AGENT),
        },
        {
          value: UserRole.SUPERVISOR_DGI,
          label: getRoleLabel(UserRole.SUPERVISOR_DGI),
        },
      ],
      admins: [{ value: UserRole.ADMIN, label: getRoleLabel(UserRole.ADMIN) }],
    }
  }

  /**
   * Get role category label
   */
  const getRoleCategoryLabel = (
    category: 'citizens' | 'professionals' | 'admins'
  ): string => {
    const categoryMap = {
      citizens: t('users.roleCategoryCitizens'),
      professionals: t('users.roleCategoryProfessionals'),
      admins: t('users.roleCategoryAdmins'),
    }

    return categoryMap[category]
  }

  return {
    getRoleLabel,
    getStatusLabel,
    getRoleOptions,
    getStatusOptions,
    getRoleOptionsGrouped,
    getRoleCategoryLabel,
    isLoadingRoles: isLoadingEnums,
  }
}
