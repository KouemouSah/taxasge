import { useState } from "react";
import { Search as SearchIcon, Filter, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("all");
  const [selectedSector, setSelectedSector] = useState("all");

  // Mock data - to be replaced with API call
  const mockServices = [
    { id: "T-001", name: "Patente Comercial", ministry: "M-001", sector: "S-001", category: "C-001", type: "License", price: "50,000 XAF" },
    { id: "T-002", name: "Registro Mercantil", ministry: "M-001", sector: "S-002", category: "C-002", type: "Registration", price: "75,000 XAF" },
    { id: "T-003", name: "Permiso de Construcción", ministry: "M-003", sector: "S-005", category: "C-015", type: "Permit", price: "100,000 XAF" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Búsqueda de Servicios Fiscales</h1>
          <p className="text-muted-foreground mb-8">Encuentra información sobre los 547 servicios fiscales disponibles</p>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar servicios, documentos, procedimientos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button size="lg" className="px-8">
                <SearchIcon className="mr-2 h-5 w-5" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avanzados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ministerio</label>
                  <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los ministerios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los ministerios</SelectItem>
                      <SelectItem value="M-001">Ministerio de Economía</SelectItem>
                      <SelectItem value="M-002">Ministerio de Finanzas</SelectItem>
                      <SelectItem value="M-003">Ministerio de Infraestructura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sector</label>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los sectores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los sectores</SelectItem>
                      <SelectItem value="S-001">Comercio</SelectItem>
                      <SelectItem value="S-002">Industria</SelectItem>
                      <SelectItem value="S-003">Construcción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Servicio</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="certificate">Certificado</SelectItem>
                      <SelectItem value="license">Licencia</SelectItem>
                      <SelectItem value="permit">Permiso</SelectItem>
                      <SelectItem value="registration">Registro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">3</span> de <span className="font-semibold text-foreground">547</span> servicios
              </p>
              <Select defaultValue="relevance">
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Más relevante</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                  <SelectItem value="price">Precio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mockServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{service.name}</CardTitle>
                      <CardDescription>Código: {service.id}</CardDescription>
                    </div>
                    <Badge variant="secondary">{service.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge variant="outline">{service.ministry}</Badge>
                      <Badge variant="outline">{service.sector}</Badge>
                      <Badge variant="outline">{service.category}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{service.price}</p>
                      <Button variant="link" className="p-0 h-auto">Ver detalles →</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
