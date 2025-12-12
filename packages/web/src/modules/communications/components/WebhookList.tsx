'use client'

/**
 * WebhookList Component
 * Displays list of webhook configurations with actions
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  Edit,
  Trash2,
  TestTube,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  useWebhooks,
  useDeleteWebhook,
  useToggleWebhook,
} from '../hooks/useWebhooks'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WebhookResponse } from '../types'

interface WebhookListProps {
  locale: string
}

export function WebhookList({ locale }: WebhookListProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading, error } = useWebhooks({ page, pageSize: 20 })
  const deleteMutation = useDeleteWebhook()
  const { toggle, isLoading: isToggling } = useToggleWebhook()

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleToggle = (id: number, currentStatus: boolean) => {
    toggle(id, currentStatus)
  }

  const getStatusBadge = (webhook: WebhookResponse) => {
    if (!webhook.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }

    if (!webhook.lastTriggeredAt) {
      return <Badge variant="outline">Never Triggered</Badge>
    }

    if (webhook.lastStatus === 'success') {
      return <Badge variant="default">Active</Badge>
    }

    return <Badge variant="destructive">Error</Badge>
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      custom: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }

    return (
      <Badge className={colors[type] || ''} variant="outline">
        {type}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading webhooks: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Webhook Configurations</h2>
          <p className="text-muted-foreground">
            Manage webhook integrations for external systems
          </p>
        </div>
        <Link href={`/${locale}/dashboard/admin/communications/webhooks/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Webhook
          </Button>
        </Link>
      </div>

      {data && (
        <div className="text-sm text-muted-foreground">
          Showing {data.webhooks.length} of {data.total} webhooks
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[300px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No webhooks found. Create your first webhook to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell>{getTypeBadge(webhook.webhookType)}</TableCell>
                    <TableCell className="max-w-md truncate font-mono text-sm">
                      {webhook.endpointUrl}
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook)}</TableCell>
                    <TableCell>
                      {webhook.lastTriggeredAt
                        ? format(new Date(webhook.lastTriggeredAt), 'MMM d, yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/${locale}/dashboard/admin/communications/webhooks/${webhook.id}/edit`
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/${locale}/dashboard/admin/communications/webhooks/${webhook.id}/test`
                              )
                            }
                          >
                            <TestTube className="mr-2 h-4 w-4" />
                            Test Webhook
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/${locale}/dashboard/admin/communications/webhooks/${webhook.id}/logs`
                              )
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggle(webhook.id, webhook.isActive)}
                            disabled={isToggling}
                          >
                            {webhook.isActive ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(webhook.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone
              and all execution logs will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
