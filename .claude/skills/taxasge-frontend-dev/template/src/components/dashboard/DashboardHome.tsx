import { Star, FileText, Calculator, Clock, Bell, Download, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const DashboardHome = () => {
  const favoriteServices = [
    { id: "T-001", name: "Patente Commerciale", category: "Licences", ministry: "Finances" },
    { id: "T-003", name: "Permis de Construction", category: "Permis", ministry: "Urbanisme" },
    { id: "T-005", name: "Carte d'Identité", category: "Documents", ministry: "Intérieur" },
  ];

  const calculationHistory = [
    { id: 1, service: "Patente Commerciale", amount: "50,000 XAF", date: "2025-09-28", status: "completed" },
    { id: 2, service: "Taxe Foncière", amount: "75,000 XAF", date: "2025-09-25", status: "completed" },
    { id: 3, service: "Impôt sur le Revenu", amount: "120,000 XAF", date: "2025-09-20", status: "completed" },
    { id: 4, service: "Taxe Professionnelle", amount: "45,000 XAF", date: "2025-09-15", status: "pending" },
  ];

  const savedDocuments = [
    { id: 1, name: "Déclaration Impôts 2024.pdf", type: "PDF", size: "2.4 MB", date: "2025-09-28" },
    { id: 2, name: "Reçu Patente Commerciale.pdf", type: "PDF", size: "856 KB", date: "2025-09-25" },
    { id: 3, name: "Certificat Fiscal 2024.pdf", type: "PDF", size: "1.2 MB", date: "2025-09-20" },
    { id: 4, name: "Facture Services Admin.pdf", type: "PDF", size: "512 KB", date: "2025-09-18" },
  ];

  const notifications = [
    { id: 1, title: "Nouvelle échéance fiscale", message: "La déclaration d'impôt sur le revenu est due le 15 octobre 2025", type: "warning", date: "Il y a 2 heures", unread: true },
    { id: 2, title: "Document prêt", message: "Votre certificat fiscal est disponible au téléchargement", type: "success", date: "Hier", unread: true },
    { id: 3, title: "Mise à jour de service", message: "Le service de patente commerciale a été mis à jour", type: "info", date: "Il y a 2 jours", unread: false },
    { id: 4, title: "Paiement confirmé", message: "Votre paiement de 50,000 XAF a été confirmé", type: "success", date: "Il y a 3 jours", unread: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Bienvenue sur votre Dashboard</h2>
        <p className="text-muted-foreground">Gérez vos services fiscaux et administratifs</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex-col">
              <Calculator className="h-6 w-6 mb-2" />
              Nouveau Calcul
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Nouvelle Déclaration
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Star className="h-6 w-6 mb-2" />
              Rechercher Services
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Download className="h-6 w-6 mb-2" />
              Télécharger Formulaires
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{favoriteServices.length}</p>
                <p className="text-sm text-muted-foreground">Services Favoris</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{calculationHistory.length}</p>
                <p className="text-sm text-muted-foreground">Calculs Réalisés</p>
              </div>
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{savedDocuments.length}</p>
                <p className="text-sm text-muted-foreground">Documents Sauvegardés</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => n.unread).length}</p>
                <p className="text-sm text-muted-foreground">Notifications Non Lues</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="favorites" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-2" />
            Favoris
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Mes Services Favoris</CardTitle>
              <CardDescription>Accès rapide à vos services les plus utilisés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {favoriteServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <p className="font-semibold">{service.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">{service.id}</Badge>
                        <Badge variant="outline" className="text-xs">{service.category}</Badge>
                        <Badge variant="outline" className="text-xs">{service.ministry}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculer
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ajouter un service aux favoris
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Calculs</CardTitle>
              <CardDescription>Tous vos calculs de taxes et frais administratifs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calculationHistory.map((calc) => (
                  <div key={calc.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{calc.service}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{calc.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{calc.amount}</p>
                        <Badge variant={calc.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {calc.status === "completed" ? "Complété" : "En attente"}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Voir tout l'historique
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents Sauvegardés</CardTitle>
              <CardDescription>Tous vos documents et reçus administratifs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {doc.size} • {doc.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Gérer tous les documents
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Personnalisées</CardTitle>
              <CardDescription>Restez informé des échéances et mises à jour importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 border rounded-lg hover:bg-accent transition-colors ${
                      notif.unread ? 'bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className={`h-4 w-4 ${
                            notif.type === 'warning' ? 'text-yellow-500' :
                            notif.type === 'success' ? 'text-green-500' :
                            'text-blue-500'
                          }`} />
                          <p className="font-semibold">{notif.title}</p>
                          {notif.unread && (
                            <Badge variant="default" className="text-xs">Nouveau</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">{notif.date}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Marquer toutes comme lues
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
