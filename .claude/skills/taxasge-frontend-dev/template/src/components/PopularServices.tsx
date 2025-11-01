import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PopularServices = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real API data
  const popularServices = [
    {
      id: "T-001",
      name: "Taxe Professionnelle Unique",
      ministry: "Ministère de l'Économie",
      category: "Taxes Professionnelles",
      type: "Registration",
      baseAmount: "50,000 XAF",
      description: "Enregistrement et paiement de la taxe professionnelle unique pour les entreprises.",
    },
    {
      id: "T-023",
      name: "Patente Commerciale",
      ministry: "Ministère du Commerce",
      category: "Licences Commerciales",
      type: "License",
      baseAmount: "75,000 XAF",
      description: "Obtention de la patente pour exercer une activité commerciale en Guinée.",
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
      baseAmount: "150,000 XAF",
      description: "Autorisation administrative pour la construction de bâtiments.",
    },
    {
      id: "T-089",
      name: "Certificat d'Origine",
      ministry: "Ministère du Commerce",
      category: "Certificats Export",
      type: "Certificate",
      baseAmount: "25,000 XAF",
      description: "Certification de l'origine des marchandises pour l'exportation.",
    },
    {
      id: "T-112",
      name: "Agrément Import-Export",
      ministry: "Ministère du Commerce",
      category: "Agréments Commerciaux",
      type: "License",
      baseAmount: "200,000 XAF",
      description: "Agrément pour exercer des activités d'import-export en Guinée.",
    },
  ];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Registration: "bg-guinea-green/10 text-guinea-green border-guinea-green/20",
      License: "bg-primary/10 text-primary border-primary/20",
      Declaration: "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20",
      Permit: "bg-guinea-red/10 text-guinea-red border-guinea-red/20",
      Certificate: "bg-accent/10 text-accent border-accent/20",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

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
          <Button variant="outline" onClick={() => navigate("/services")}>
            Voir tous les services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularServices.map((service, index) => (
            <Card
              key={service.id}
              className="group cursor-pointer hover:shadow-elegant transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/service/${service.id}`)}
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
  );
};
