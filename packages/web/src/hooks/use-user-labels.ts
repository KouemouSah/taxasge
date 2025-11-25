/**
 * useUserLabels Hook
 *
 * Centralized hook for translating user roles and statuses
 * Aligned with backend UserRole and UserStatus enums
 *
 * @module hooks
 * @author Claude Code
 * @date 2025-11-24
 */

import { useTranslations } from 'next-intl'
import { UserRole, UserStatus } from '@/types/user'

export function useUserLabels() {
  const t = useTranslations('admin')

  /**
   * Get translated label for user role
   */
  const getRoleLabel = (role: UserRole | string): string => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.CITIZEN]: t('userRoles.citizen'),
      [UserRole.BUSINESS]: t('userRoles.business'),
      [UserRole.ACCOUNTANT]: t('userRoles.accountant'),
      [UserRole.ADMIN]: t('userRoles.admin'),
      [UserRole.DGI_AGENT]: t('userRoles.dgiAgent'),
      [UserRole.SUPERVISOR_JUNIOR_DGI]: t('userRoles.supervisorJuniorDgi'),
      [UserRole.SUPERVISOR_READONLY]: t('userRoles.supervisorReadonly'),
      [UserRole.SUPERVISOR_SENIOR]: t('userRoles.supervisorSenior'),
      [UserRole.MINISTRY_AGENT]: t('userRoles.ministryAgent'),
      [UserRole.SUPERVISOR_DGI]: t('userRoles.supervisorDgi'),
    }

    return roleMap[role as UserRole] || role
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
   */
  const getRoleOptions = () => {
    return [
      { value: 'all', label: t('users.allRoles') },
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
  }
}
