'use client'

/**
 * Create User Dialog Component
 * Dialog for creating new administrative users
 *
 * @module users-admin/components
 * @author Claude Code
 * @date 2025-11-19
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import usersApi from '../services/api'
import type { UserRole, CreateUserRequest } from '../types'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'dgi_agent',
    password: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await usersApi.create(formData)

      toast({
        title: 'Utilisateur créé',
        description: `L'utilisateur ${formData.first_name} ${formData.last_name} a été créé avec succès.`,
      })

      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'dgi_agent',
        password: '',
        is_active: true,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer l\'utilisateur',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créer un compte utilisateur administratif (Agent DGI, Comptable, ou Administrateur)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* First Name */}
            <div className="grid gap-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Jean"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            {/* Last Name */}
            <div className="grid gap-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Dupont"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="dgi_agent">Agent DGI</SelectItem>
                  <SelectItem value="accountant">Comptable</SelectItem>
                  <SelectItem value="supervisor_dgi">Superviseur DGI</SelectItem>
                  <SelectItem value="supervisor_senior">Superviseur Senior</SelectItem>
                  <SelectItem value="supervisor_junior_dgi">Superviseur Junior DGI</SelectItem>
                  <SelectItem value="supervisor_readonly">Superviseur Lecture Seule</SelectItem>
                  <SelectItem value="ministry_agent">Agent Ministère</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Seuls les rôles administratifs peuvent être créés ici
              </p>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-sm text-muted-foreground">
                Minimum 8 caractères
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
