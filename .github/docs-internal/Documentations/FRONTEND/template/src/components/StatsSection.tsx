import { Users, FileCheck, Building2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const StatsSection = () => {
  const stats = [
    {
      icon: FileCheck,
      value: "547",
      label: "Services Fiscaux",
      description: "Services disponibles",
      color: "text-primary",
    },
    {
      icon: Building2,
      value: "14",
      label: "Ministères",
      description: "Ministères couverts",
      color: "text-guinea-red",
    },
    {
      icon: Users,
      value: "86",
      label: "Catégories",
      description: "Catégories de services",
      color: "text-guinea-yellow",
    },
    {
      icon: TrendingUp,
      value: "16",
      label: "Secteurs",
      description: "Secteurs d'activité",
      color: "text-guinea-green",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Une plateforme complète</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Accédez à l'ensemble des services fiscaux de la Guinée, organisés de manière claire et accessible
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden group hover:shadow-elegant transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                    <div className="h-12 w-12 rounded-full bg-gradient-card flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="font-semibold text-foreground">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.description}</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-hero transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
