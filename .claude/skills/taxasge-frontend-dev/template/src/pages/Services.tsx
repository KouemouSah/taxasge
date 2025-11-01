import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data - to be replaced with API call
  const services = [
    {
      id: "T-001",
      name: "Patente Comercial",
      category: "Licencias Comerciales",
      ministry: "Ministerio de Economía y Planificación",
      sector: "Comercio y Servicios",
      type: "License",
      expeditionFee: 50000,
      processingTime: "5-7 días",
    },
    {
      id: "T-002",
      name: "Permiso de Construcción",
      category: "Permisos de Construcción",
      ministry: "Ministerio de Obras Públicas",
      sector: "Construcción",
      type: "Permit",
      expeditionFee: 150000,
      processingTime: "15-20 días",
    },
    {
      id: "T-003",
      name: "Licencia de Exportación",
      category: "Comercio Exterior",
      ministry: "Ministerio de Comercio",
      sector: "Exportación",
      type: "License",
      expeditionFee: 75000,
      processingTime: "10-12 días",
    },
    {
      id: "T-004",
      name: "Registro Sanitario",
      category: "Salud y Seguridad",
      ministry: "Ministerio de Salud",
      sector: "Salud",
      type: "Certificate",
      expeditionFee: 40000,
      processingTime: "7-10 días",
    },
    {
      id: "T-005",
      name: "Permiso de Operación Turística",
      category: "Turismo",
      ministry: "Ministerio de Turismo",
      sector: "Turismo",
      type: "Permit",
      expeditionFee: 100000,
      processingTime: "10-15 días",
    },
    {
      id: "T-006",
      name: "Licencia Ambiental",
      category: "Medio Ambiente",
      ministry: "Ministerio de Medio Ambiente",
      sector: "Medio Ambiente",
      type: "License",
      expeditionFee: 120000,
      processingTime: "20-30 días",
    },
  ];

  const categories = ["all", "Licencias Comerciales", "Permisos de Construcción", "Comercio Exterior", "Salud y Seguridad", "Turismo", "Medio Ambiente"];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.ministry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold mb-4">Services Fiscaux</h1>
            <p className="text-lg text-muted-foreground">
              Découvrez tous les services fiscaux disponibles en Guinée Équatoriale
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un service..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">{filteredServices.length}</p>
                <p className="text-sm text-muted-foreground">Services disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">{categories.length - 1}</p>
                <p className="text-sm text-muted-foreground">Catégories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">6</p>
                <p className="text-sm text-muted-foreground">Ministères</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">En ligne</p>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{service.type}</Badge>
                    <span className="text-sm text-muted-foreground">{service.id}</span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service.ministry}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secteur:</span>
                      <span className="font-medium">{service.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catégorie:</span>
                      <span className="font-medium">{service.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasa:</span>
                      <span className="font-bold text-primary">{service.expeditionFee.toLocaleString()} XAF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée:</span>
                      <span className="font-medium">{service.processingTime}</span>
                    </div>
                  </div>
                  <Link to={`/service/${service.id}`}>
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Voir les détails
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Aucun service trouvé</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
