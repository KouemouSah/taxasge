'use client'

/**
 * Déclarations Page
 * Manage tax declarations - create, download forms, submit requests, track status
 */

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FilePlus,
  Download,
  Send,
  FileText,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function DeclarationsPage() {
  const [filterStatut, setFilterStatut] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data - À remplacer par de vraies données API
  const declarations = [
    {
      id: 'DECL-2025-001',
      type: 'Impôt sur le Revenu',
      dateCreation: '2025-01-08',
      dateLimite: '2025-03-31',
      statut: 'En cours',
      progression: 60,
      montant: 1250000,
    },
    {
      id: 'DECL-2025-002',
      type: 'TVA Trimestrielle',
      dateCreation: '2025-01-10',
      dateLimite: '2025-02-15',
      statut: 'En attente',
      progression: 30,
      montant: 890000,
    },
    {
      id: 'DECL-2024-089',
      type: 'Taxe Foncière',
      dateCreation: '2024-12-28',
      dateLimite: '2025-01-31',
      statut: 'Validation',
      progression: 85,
      montant: 2360000,
    },
    {
      id: 'DECL-2024-088',
      type: 'Impôt sur les Sociétés',
      dateCreation: '2024-12-15',
      dateLimite: '2025-01-15',
      statut: 'Validée',
      progression: 100,
      montant: 5600000,
    },
    {
      id: 'DECL-2024-087',
      type: 'Cotisations Sociales',
      dateCreation: '2024-12-10',
      dateLimite: '2024-12-31',
      statut: 'Rejetée',
      progression: 100,
      montant: 450000,
    },
  ]

  const getStatutBadge = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'validée':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {statut}
          </Badge>
        )
      case 'validation':
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
            <Clock className="h-3 w-3" />
            {statut}
          </Badge>
        )
      case 'rejetée':
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {statut}
          </Badge>
        )
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  const filteredDeclarations = declarations.filter((decl) => {
    const matchesStatut = filterStatut === 'all' || decl.statut.toLowerCase() === filterStatut
    const matchesSearch =
      decl.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      decl.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatut && matchesSearch
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Déclarations Fiscales</h1>
          <p className="text-muted-foreground mt-2">
            Créez, suivez et gérez vos déclarations fiscales
          </p>
        </div>

        {/* Actions Rapides */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20">
            <Link href="/dashboard/declarations/new">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nouvelle Déclaration</CardTitle>
                <FilePlus className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Créer une nouvelle déclaration fiscale
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Télécharger Formulaire</CardTitle>
              <Download className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Télécharger les formulaires de déclaration
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/support">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Soumettre une Requête</CardTitle>
                <Send className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Contacter le support pour assistance
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Tableau de suivi des déclarations */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Suivi des déclarations</CardTitle>
                <CardDescription>
                  Historique et statut de toutes vos déclarations
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en cours">En cours</SelectItem>
                    <SelectItem value="en attente">En attente</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="validée">Validée</SelectItem>
                    <SelectItem value="rejetée">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Type de déclaration</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Date limite</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeclarations.length > 0 ? (
                    filteredDeclarations.map((decl) => (
                      <TableRow key={decl.id}>
                        <TableCell className="font-medium">{decl.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {decl.type}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(decl.dateCreation).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(decl.dateLimite).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {decl.montant.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>{getStatutBadge(decl.statut)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary rounded-full h-2 max-w-[80px]">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${decl.progression}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[35px]">
                              {decl.progression}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              Voir
                            </Button>
                            {(decl.statut === 'En cours' || decl.statut === 'En attente') && (
                              <Button variant="default" size="sm">
                                Continuer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucune déclaration trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
