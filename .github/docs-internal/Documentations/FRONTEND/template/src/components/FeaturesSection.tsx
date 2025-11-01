import { Calculator, FileSearch, Download, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export const FeaturesSection = () => {
  const features = [
    {
      icon: FileSearch,
      title: "Recherche Intelligente",
      description: "Trouvez rapidement le service fiscal dont vous avez besoin grâce à notre moteur de recherche avancé avec filtres par ministère, secteur et catégorie.",
    },
    {
      icon: Calculator,
      title: "Calculateur de Taxes",
      description: "Calculez automatiquement le montant de vos taxes et frais administratifs pour chaque service. Support des formules complexes d'expedition et de renewal.",
    },
    {
      icon: Download,
      title: "Documents & Procédures",
      description: "Consultez la liste complète des documents requis et téléchargez les formulaires nécessaires. Suivez les procédures étape par étape.",
    },
    {
      icon: Clock,
      title: "Informations à Jour",
      description: "Base de données mise à jour régulièrement avec les derniers tarifs et procédures. Plus de 19,000 enregistrements validés et vérifiés.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Fonctionnalités principales</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des outils puissants pour simplifier toutes vos démarches administratives et fiscales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group hover:shadow-elegant transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
