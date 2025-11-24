'use client'

/**
 * Support Page
 * Contact ministry agents for assistance and track support requests
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  HelpCircle,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLocale, useTranslations } from 'next-intl'

export default function SupportPage() {
  const locale = useLocale()
  const t = useTranslations('support')
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: '',
    message: '',
  })

  // Mock data - À remplacer par de vraies données API
  const supportRequests = [
    {
      id: 'SUP-2025-012',
      sujet: 'Question sur déclaration TVA',
      categorie: t('categoryDeclaration'),
      priorite: t('priorityMedium'),
      statut: t('statusInProgress'),
      dateCreation: '2025-01-11',
      agent: 'Jean Dupont',
      derniereReponse: '2025-01-11',
    },
    {
      id: 'SUP-2025-011',
      sujet: 'Problème de paiement',
      categorie: t('categoryPayment'),
      priorite: t('priorityHigh'),
      statut: t('statusPending'),
      dateCreation: '2025-01-10',
      agent: 'Marie Martin',
      derniereReponse: '2025-01-10',
    },
    {
      id: 'SUP-2025-010',
      sujet: 'Demande de rectification',
      categorie: t('categoryRectification'),
      priorite: t('priorityLow'),
      statut: t('statusResolved'),
      dateCreation: '2025-01-08',
      agent: 'Pierre Dubois',
      derniereReponse: '2025-01-09',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject || !formData.category || !formData.priority || !formData.message) {
      toast({
        title: t('errorRequired'),
        description: t('errorRequiredMessage'),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simuler l'envoi de la requête
    setTimeout(() => {
      toast({
        title: t('requestSent'),
        description: t('requestSentMessage'),
      })

      // Réinitialiser le formulaire
      setFormData({
        subject: '',
        category: '',
        priority: '',
        message: '',
      })

      setIsSubmitting(false)
    }, 1500)
  }

  const getStatutBadge = (statut: string) => {
    const statusLower = statut.toLowerCase()
    if (statusLower === t('statusResolved').toLowerCase()) {
      return (
        <Badge className="bg-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {statut}
        </Badge>
      )
    } else if (statusLower === t('statusInProgress').toLowerCase()) {
      return (
        <Badge className="bg-blue-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {statut}
        </Badge>
      )
    } else if (statusLower === t('statusPending').toLowerCase()) {
      return (
        <Badge className="bg-yellow-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {statut}
        </Badge>
      )
    }
    return <Badge variant="outline">{statut}</Badge>
  }

  const getPrioriteBadge = (priorite: string) => {
    const priorityLower = priorite.toLowerCase()
    if (priorityLower === t('priorityHigh').toLowerCase()) {
      return <Badge variant="destructive">{priorite}</Badge>
    } else if (priorityLower === t('priorityMedium').toLowerCase()) {
      return <Badge variant="default">{priorite}</Badge>
    } else if (priorityLower === t('priorityLow').toLowerCase()) {
      return <Badge variant="outline">{priorite}</Badge>
    }
    return <Badge variant="outline">{priorite}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('pageSubtitle')}
        </p>
      </div>

      {/* Nouvelle Requête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t('newRequestTitle')}
          </CardTitle>
          <CardDescription>
            {t('newRequestDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {t('subjectRequired')}
                </Label>
                <Input
                  id="subject"
                  placeholder={t('subjectPlaceholder')}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  {t('categoryRequired')}
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t('categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="declaration">{t('categoryDeclaration')}</SelectItem>
                    <SelectItem value="paiement">{t('categoryPayment')}</SelectItem>
                    <SelectItem value="rectification">{t('categoryRectification')}</SelectItem>
                    <SelectItem value="information">{t('categoryInformation')}</SelectItem>
                    <SelectItem value="technique">{t('categoryTechnical')}</SelectItem>
                    <SelectItem value="autre">{t('categoryOther')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">
                  {t('priorityRequired')}
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder={t('priorityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">{t('priorityLow')}</SelectItem>
                    <SelectItem value="moyenne">{t('priorityMedium')}</SelectItem>
                    <SelectItem value="haute">{t('priorityHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('reference')}</Label>
                <Input
                  placeholder={t('referencePlaceholder')}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('referenceHint')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {t('messageRequired')}
              </Label>
              <Textarea
                id="message"
                placeholder={t('messagePlaceholder')}
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('messageHint')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                    {t('submittingButton')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('submitButton')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({ subject: '', category: '', priority: '', message: '' })
                }
              >
                {t('resetButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Historique des Requêtes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('myRequestsTitle')}
          </CardTitle>
          <CardDescription>
            {t('myRequestsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableReference')}</TableHead>
                  <TableHead>{t('tableSubject')}</TableHead>
                  <TableHead>{t('tableCategory')}</TableHead>
                  <TableHead>{t('tablePriority')}</TableHead>
                  <TableHead>{t('tableAgent')}</TableHead>
                  <TableHead>{t('tableStatus')}</TableHead>
                  <TableHead>{t('tableCreationDate')}</TableHead>
                  <TableHead className="text-right">{t('tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supportRequests.length > 0 ? (
                  supportRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {request.sujet}
                        </div>
                      </TableCell>
                      <TableCell>{request.categorie}</TableCell>
                      <TableCell>{getPrioriteBadge(request.priorite)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {request.agent}
                        </div>
                      </TableCell>
                      <TableCell>{getStatutBadge(request.statut)}</TableCell>
                      <TableCell>
                        {new Date(request.dateCreation).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          {t('viewConversation')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t('noRequests')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ / Aide Rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('faqTitle')}
          </CardTitle>
          <CardDescription>
            {t('faqDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">{t('faqQuestion1')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('faqAnswer1')}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">{t('faqQuestion2')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('faqAnswer2')}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">{t('faqQuestion3')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('faqAnswer3')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
