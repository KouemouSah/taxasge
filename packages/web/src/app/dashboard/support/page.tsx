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
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useToast } from '@/hooks/use-toast'

export default function SupportPage() {
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
      categorie: 'Déclaration',
      priorite: 'Moyenne',
      statut: 'En cours',
      dateCreation: '2025-01-11',
      agent: 'Jean Dupont',
      derniereReponse: '2025-01-11',
    },
    {
      id: 'SUP-2025-011',
      sujet: 'Problème de paiement',
      categorie: 'Paiement',
      priorite: 'Haute',
      statut: 'En attente',
      dateCreation: '2025-01-10',
      agent: 'Marie Martin',
      derniereReponse: '2025-01-10',
    },
    {
      id: 'SUP-2025-010',
      sujet: 'Demande de rectification',
      categorie: 'Rectification',
      priorite: 'Basse',
      statut: 'Résolue',
      dateCreation: '2025-01-08',
      agent: 'Pierre Dubois',
      derniereReponse: '2025-01-09',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject || !formData.category || !formData.priority || !formData.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simuler l'envoi de la requête
    setTimeout(() => {
      toast({
        title: "Requête envoyée",
        description: "Votre demande a été transmise à nos agents. Vous recevrez une réponse sous 24-48h.",
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
    switch (statut.toLowerCase()) {
      case 'résolue':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {statut}
          </Badge>
        )
      case 'en cours':
        return (
          <Badge className="bg-blue-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {statut}
          </Badge>
        )
      case 'en attente':
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {statut}
          </Badge>
        )
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite.toLowerCase()) {
      case 'haute':
        return <Badge variant="destructive">{priorite}</Badge>
      case 'moyenne':
        return <Badge variant="default">{priorite}</Badge>
      case 'basse':
        return <Badge variant="outline">{priorite}</Badge>
      default:
        return <Badge variant="outline">{priorite}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support & Assistance</h1>
          <p className="text-muted-foreground mt-2">
            Contactez nos agents ministériels pour toute question ou assistance
          </p>
        </div>

        {/* Nouvelle Requête */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nouvelle Requête
            </CardTitle>
            <CardDescription>
              Soumettez votre demande d&apos;assistance aux agents ministériels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Sujet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Question sur ma déclaration TVA"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Catégorie <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="declaration">Déclaration</SelectItem>
                      <SelectItem value="paiement">Paiement</SelectItem>
                      <SelectItem value="rectification">Rectification</SelectItem>
                      <SelectItem value="information">Information générale</SelectItem>
                      <SelectItem value="technique">Problème technique</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priorité <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    required
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Sélectionner la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basse">Basse</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Référence (optionnel)</Label>
                  <Input
                    placeholder="Ex: DECL-2025-001"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Référence de déclaration ou paiement si applicable
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez votre demande en détail..."
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Soyez aussi précis que possible pour obtenir une réponse rapide
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer la requête
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
                  Réinitialiser
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
              Mes Requêtes
            </CardTitle>
            <CardDescription>
              Suivi de vos demandes d&apos;assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Agent assigné</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          {new Date(request.dateCreation).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Voir conversation
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucune requête trouvée
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
              Questions Fréquentes
            </CardTitle>
            <CardDescription>
              Trouvez rapidement des réponses aux questions courantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Comment créer une nouvelle déclaration ?</h4>
              <p className="text-sm text-muted-foreground">
                Accédez au menu &quot;Déclarations&quot; puis cliquez sur &quot;Nouvelle Déclaration&quot;. Suivez les étapes pour compléter votre déclaration.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Quels sont les délais de réponse du support ?</h4>
              <p className="text-sm text-muted-foreground">
                Nos agents traitent les requêtes sous 24-48h ouvrables. Les requêtes haute priorité sont traitées en premier.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Comment modifier une déclaration déjà soumise ?</h4>
              <p className="text-sm text-muted-foreground">
                Contactez le support via ce formulaire avec la référence de votre déclaration. Un agent vous assistera pour la rectification.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
