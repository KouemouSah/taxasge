import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, FileText, TrendingUp, Settings, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminDGI = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    { label: "Contribuables actifs", value: "125,847", icon: Users, color: "text-eqGuinea-blue" },
    { label: "Déclarations en cours", value: "3,456", icon: FileText, color: "text-eqGuinea-red" },
    { label: "Revenus collectés", value: "2.4M XAF", icon: TrendingUp, color: "text-eqGuinea-green" },
    { label: "Services disponibles", value: "48", icon: Settings, color: "text-eqGuinea-yellow" },
  ];

  const recentDeclarations = [
    { id: "D001", taxpayer: "Entreprise ABC", type: "TVA", status: "En attente", amount: "450,000 XAF" },
    { id: "D002", taxpayer: "Jean Mbala", type: "Revenu", status: "Approuvé", amount: "120,000 XAF" },
    { id: "D003", taxpayer: "Société XYZ", type: "IS", status: "En révision", amount: "890,000 XAF" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Administration DGI</h1>
          <p className="text-muted-foreground">
            Tableau de bord de gestion de la Direction Générale des Impôts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="declarations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="declarations">Déclarations</TabsTrigger>
            <TabsTrigger value="taxpayers">Contribuables</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="declarations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Déclarations récentes</CardTitle>
                <CardDescription>
                  Gérez et validez les déclarations fiscales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une déclaration..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Contribuable</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDeclarations.map((declaration) => (
                      <TableRow key={declaration.id}>
                        <TableCell className="font-medium">{declaration.id}</TableCell>
                        <TableCell>{declaration.taxpayer}</TableCell>
                        <TableCell>{declaration.type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            declaration.status === "Approuvé" 
                              ? "bg-eqGuinea-green/20 text-eqGuinea-green" 
                              : "bg-eqGuinea-yellow/20 text-eqGuinea-yellow"
                          }`}>
                            {declaration.status}
                          </span>
                        </TableCell>
                        <TableCell>{declaration.amount}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Voir détails</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxpayers">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des contribuables</CardTitle>
                <CardDescription>
                  Base de données des contribuables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu de gestion des contribuables à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Rapports et statistiques</CardTitle>
                <CardDescription>
                  Générez des rapports fiscaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu des rapports à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres système</CardTitle>
                <CardDescription>
                  Configuration de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenu des paramètres à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDGI;
