/**
 * USSD Configurations List Page
 * Admin page for managing USSD configurations for mobile operators
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useUssdConfigs,
  useDeleteUssdConfig,
} from '@/modules/communications/hooks/useUssdConfigs'
import type { UssdConfigResponse } from '@/modules/communications/types'

export default function UssdConfigsPage() {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { data, isLoading } = useUssdConfigs()
  const deleteMutation = useDeleteUssdConfig()

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const getOperatorName = (operator: string) => {
    const names: Record<string, string> = {
      getesa: 'Getesa',
      muni: 'Muni',
      other_api_sms: 'Other API SMS',
    }
    return names[operator] || operator
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">USSD Configurations</h1>
          <p className="text-muted-foreground">
            Manage USSD menu configurations for mobile operators
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/communications/ussd/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>USSD Configurations</CardTitle>
          <CardDescription>
            {data?.total || 0} configuration(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !data?.configs.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No USSD configurations found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Operator Code</TableHead>
                  <TableHead>Menus</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.configs.map((config: UssdConfigResponse) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {getOperatorName(config.operatorName)}
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded">{config.shortCode}</code>
                    </TableCell>
                    <TableCell>{config.operatorCode}</TableCell>
                    <TableCell>{config.menuStructure.length} menus</TableCell>
                    <TableCell>{config.sessionTimeoutSeconds}s</TableCell>
                    <TableCell>
                      {config.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <Power className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <PowerOff className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/admin/communications/ussd/${config.id}/edit`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(config.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this USSD configuration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
