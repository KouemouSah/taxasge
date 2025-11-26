/**
 * AssignmentForm Component
 * Form for creating/editing assignments
 *
 * @module assignments-admin/components
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentPriority,
  AssignmentStatus,
} from '../types'

interface AssignmentFormProps {
  initialData?: Assignment
  onSubmit: (data: CreateAssignmentRequest | UpdateAssignmentRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEditMode?: boolean
}

const priorities: AssignmentPriority[] = ['low', 'medium', 'high', 'urgent']
const statuses: AssignmentStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

export function AssignmentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditMode = false,
}: AssignmentFormProps) {
  const t = useTranslations('assignments')

  const [formData, setFormData] = useState({
    declaration_id: initialData?.declaration_id || '',
    assignee_id: initialData?.assignee_id || '',
    priority: initialData?.priority || 'medium' as AssignmentPriority,
    status: initialData?.status || 'pending' as AssignmentStatus,
    notes: initialData?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditMode) {
      await onSubmit({
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes,
      })
    } else {
      await onSubmit({
        declaration_id: formData.declaration_id,
        assignee_id: formData.assignee_id,
        priority: formData.priority,
        notes: formData.notes,
      })
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditMode && (
        <>
          <div className="space-y-2">
            <Label htmlFor="declaration_id">{t('form.declarationId')}</Label>
            <Input
              id="declaration_id"
              value={formData.declaration_id}
              onChange={(e) => handleChange('declaration_id', e.target.value)}
              placeholder={t('form.declarationIdPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee_id">{t('form.assigneeId')}</Label>
            <Input
              id="assignee_id"
              value={formData.assignee_id}
              onChange={(e) => handleChange('assignee_id', e.target.value)}
              placeholder={t('form.assigneeIdPlaceholder')}
              required
            />
          </div>
        </>
      )}

      {isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="status">{t('form.status')}</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="priority">{t('form.priority')}</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => handleChange('priority', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {t(`priority.${priority}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('form.notes')}</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder={t('form.notesPlaceholder')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? t('form.update') : t('form.create')}
        </Button>
      </div>
    </form>
  )
}
