'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Building, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

export const PopularServices = () => {
  const router = useRouter()

  // Mock data - will be replaced with real API data
  const popularServices = [
    {
      id: "T-001",
      name: "Taxe Professionnelle Unique",
      ministry: "Ministère de l'Économie",
      category: "Taxes Professionnelles",
      type: "Registration",
      baseAmount: "50,000 FCFA",
      description: "Enregistrement et paiement de la taxe professionnelle unique pour les entreprises.",
    },
    {
      id: "T-023",
      name: "Patente Commerciale",
      ministry: "Ministère du Commerce",
      category: "Licences Commerciales",
      type: "License",
      baseAmount: "75,000 FCFA",
      description: "Obtention de la patente pour exercer une activité commerciale en Guinée Équatoriale.",
    },
    {
      id: "T-045",
      name: "Déclaration TVA",
      ministry: "Direction Générale des Impôts",
      category: "Déclarations Fiscales",
      type: "Declaration",
      baseAmount: "Variable",
      description: "Déclaration mensuelle de la Taxe sur la Valeur Ajoutée (TVA).",
    },
    {
      id: "T-067",
      name: "Permis de Construire",
      ministry: "Ministère de l'Urbanisme",
      category: "Permis et Autorisations",
      type: "Permit",
      baseAmount: "150,000 FCFA",
      description: "Autorisation administrative pour la construction de bâtiments.",
    },
    {
      id: "T-089",
      name: "Certificat d'Origine",
      ministry: "Ministère du Commerce",
      category: "Certificats Export",
      type: "Certificate",
      baseAmount: "25,000 FCFA",
      description: "Certification de l'origine des marchandises pour l'exportation.",
    },
    {
      id: "T-112",
      name: "Agrément Import-Export",
      ministry: "Ministère du Commerce",
      category: "Agréments Commerciaux",
      type: "License",
      baseAmount: "200,000 FCFA",
      description: "Agrément pour exercer des activités d'import-export en Guinée Équatoriale.",
    },
  ]

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Registration: "bg-green-50 text-green-700 border-green-200",
      License: "bg-blue-50 text-blue-700 border-blue-200",
      Declaration: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Permit: "bg-red-50 text-red-700 border-red-200",
      Certificate: "bg-purple-50 text-purple-700 border-purple-200",
    }
    return colors[type] || "bg-muted text-muted-foreground"
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Services populaires</h2>
            <p className="text-muted-foreground">
              Les services fiscaux les plus consultés et utilisés
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/services")}>
            Voir tous les services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularServices.map((service) => (
            <Card
              key={service.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => router.push(`/service/${service.id}`)}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={getTypeColor(service.type)}>
                    {service.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{service.id}</span>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{service.ministry}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{service.category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-primary">
                    {service.baseAmount}
                  </span>
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                    Détails
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PopularServices
