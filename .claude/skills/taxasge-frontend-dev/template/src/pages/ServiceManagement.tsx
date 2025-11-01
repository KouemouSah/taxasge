import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search } from "lucide-react";

const ServiceManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  const services = [
    { id: 1, name: "Déclaration TVA", category: "Fiscalité", price: "Gratuit", status: "Actif" },
    { id: 2, name: "Immatriculation fiscale", category: "Administration", price: "15,000 XAF", status: "Actif" },
    { id: 3, name: "Certificat de non-redevance", category: "Certificats", price: "5,000 XAF", status: "Actif" },
    { id: 4, name: "Attestation fiscale", category: "Certificats", price: "8,000 XAF", status: "Inactif" },
  ];

  const handleAddService = () => {
    console.log("Adding service:", { serviceName, serviceCategory, servicePrice });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestion des Services</h1>
              <p className="text-muted-foreground">
                Gérez les services fiscaux disponibles sur la plateforme
              </p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau service</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau service fiscal à la plateforme
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Nom du service</Label>
                    <Input
                      id="service-name"
                      placeholder="Ex: Déclaration d'impôt"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-category">Catégorie</Label>
                    <Select value={serviceCategory} onValueChange={setServiceCategory}>
                      <SelectTrigger id="service-category">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiscalite">Fiscalité</SelectItem>
                        <SelectItem value="administration">Administration</SelectItem>
                        <SelectItem value="certificats">Certificats</SelectItem>
                        <SelectItem value="declarations">Déclarations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-price">Prix (XAF)</Label>
                    <Input
                      id="service-price"
                      type="number"
                      placeholder="0"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddService} className="w-full">
                    Créer le service
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des services</CardTitle>
            <CardDescription>
              Tous les services fiscaux disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un service..."
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.id}</TableCell>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{service.price}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.status === "Actif" 
                          ? "bg-eqGuinea-green/20 text-eqGuinea-green" 
                          : "bg-red-500/20 text-red-500"
                      }`}>
                        {service.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceManagement;
