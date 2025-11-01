import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Analytics = () => {
  const [period, setPeriod] = useState("month");

  const kpis = [
    { 
      label: "Revenus totaux", 
      value: "2.4M XAF", 
      change: "+12.5%",
      trend: "up",
      icon: DollarSign 
    },
    { 
      label: "Déclarations", 
      value: "3,456", 
      change: "+8.2%",
      trend: "up",
      icon: FileText 
    },
    { 
      label: "Nouveaux contribuables", 
      value: "847", 
      change: "-2.1%",
      trend: "down",
      icon: Users 
    },
    { 
      label: "Taux de conformité", 
      value: "94.2%", 
      change: "+3.5%",
      trend: "up",
      icon: TrendingUp 
    },
  ];

  const topServices = [
    { name: "Déclaration TVA", usage: 1234, revenue: "850K XAF" },
    { name: "Impôt sur le revenu", usage: 987, revenue: "650K XAF" },
    { name: "Patente", usage: 654, revenue: "420K XAF" },
    { name: "Impôt foncier", usage: 432, revenue: "280K XAF" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics & Rapports</h1>
            <p className="text-muted-foreground">
              Tableau de bord complet des métriques et KPIs
            </p>
          </div>
          <div className="flex gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <kpi.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold mb-1">{kpi.value}</p>
                <div className="flex items-center gap-1">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-eqGuinea-green" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-eqGuinea-red" />
                  )}
                  <span className={kpi.trend === "up" ? "text-eqGuinea-green text-sm" : "text-eqGuinea-red text-sm"}>
                    {kpi.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Services les plus utilisés</CardTitle>
                  <CardDescription>
                    Classement par nombre d'utilisations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.usage} utilisations</p>
                        </div>
                        <p className="font-bold text-eqGuinea-blue">{service.revenue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendances mensuelles</CardTitle>
                  <CardDescription>
                    Évolution des déclarations et revenus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Graphique à venir (Chart.js ou Recharts)
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Répartition géographique</CardTitle>
                <CardDescription>
                  Distribution des contribuables par région
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Carte à venir
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des revenus</CardTitle>
                <CardDescription>
                  Détails des collectes fiscales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu des revenus à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques utilisateurs</CardTitle>
                <CardDescription>
                  Analyse du comportement des contribuables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu des utilisateurs à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Performance des services</CardTitle>
                <CardDescription>
                  Métriques détaillées par service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu des services à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
