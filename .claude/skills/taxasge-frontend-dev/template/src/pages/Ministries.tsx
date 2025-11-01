import { Building2, ChevronRight, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Ministries = () => {
  const ministries = [
    { id: "M-001", name: "Ministerio de Economía y Planificación", sectors: 8, services: 127, color: "bg-blue-500" },
    { id: "M-002", name: "Ministerio de Hacienda y Presupuestos", sectors: 6, services: 89, color: "bg-green-500" },
    { id: "M-003", name: "Ministerio de Infraestructura", sectors: 4, services: 56, color: "bg-orange-500" },
    { id: "M-004", name: "Ministerio de Industria y Energía", sectors: 5, services: 67, color: "bg-purple-500" },
    { id: "M-005", name: "Ministerio de Comercio y Promoción", sectors: 3, services: 42, color: "bg-red-500" },
    { id: "M-006", name: "Ministerio de Agricultura y Ganadería", sectors: 4, services: 38, color: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold mb-4">Ministerios de Guinea Ecuatorial</h1>
            <p className="text-lg text-muted-foreground">
              Explore los 14 ministerios y sus servicios fiscales disponibles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ministries.map((ministry) => (
              <Card key={ministry.id} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`${ministry.color} p-3 rounded-lg`}>
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                        {ministry.name}
                      </CardTitle>
                      <CardDescription>Código: {ministry.id}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{ministry.sectors} Sectores</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ministry.services} Servicios</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Estadísticas Generales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                  <Building2 className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold mb-2">14</p>
                  <p className="text-muted-foreground">Ministerios</p>
                </div>
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                  <Users className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold mb-2">16</p>
                  <p className="text-muted-foreground">Sectores</p>
                </div>
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                  <Building2 className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold mb-2">547</p>
                  <p className="text-muted-foreground">Servicios Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Ministries;
