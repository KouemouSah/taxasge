import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Eye, Ban } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const UsersManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const users = [
    { 
      id: "U001", 
      name: "Jean Mbala", 
      email: "jean.mbala@example.com", 
      role: "Contribuable",
      status: "Actif",
      verified: true,
      declarations: 5,
      lastActivity: "Il y a 2h"
    },
    { 
      id: "U002", 
      name: "Marie Ondo", 
      email: "marie.ondo@example.com", 
      role: "Entreprise",
      status: "Actif",
      verified: true,
      declarations: 12,
      lastActivity: "Il y a 1j"
    },
    { 
      id: "U003", 
      name: "Paul Nguema", 
      email: "paul.nguema@example.com", 
      role: "Contribuable",
      status: "En attente",
      verified: false,
      declarations: 0,
      lastActivity: "Il y a 3j"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs et validez les documents
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total utilisateurs</p>
                <p className="text-3xl font-bold">125,847</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Actifs ce mois</p>
                <p className="text-3xl font-bold text-eqGuinea-green">98,234</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">En attente</p>
                <p className="text-3xl font-bold text-eqGuinea-yellow">1,456</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Bloqués</p>
                <p className="text-3xl font-bold text-eqGuinea-red">234</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              Gérez et vérifiez les comptes utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Vérifié</TableHead>
                  <TableHead>Déclarations</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === "Actif" 
                          ? "bg-eqGuinea-green/20 text-eqGuinea-green" 
                          : "bg-eqGuinea-yellow/20 text-eqGuinea-yellow"
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.verified ? (
                        <CheckCircle className="h-5 w-5 text-eqGuinea-green" />
                      ) : (
                        <XCircle className="h-5 w-5 text-eqGuinea-red" />
                      )}
                    </TableCell>
                    <TableCell>{user.declarations}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastActivity}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Ban className="h-4 w-4" />
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

export default UsersManagement;
