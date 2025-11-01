import { useParams, Link } from "react-router-dom";
import { Calculator, FileText, Clock, ArrowRight, Download } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ServiceDetail = () => {
  const { id } = useParams();

  // Mock data - to be replaced with API call
  const service = {
    id: "T-001",
    name: "Patente Comercial",
    ministry: "Ministerio de Economía y Planificación",
    sector: "Comercio y Servicios",
    category: "Licencias Comerciales",
    type: "License",
    description: "Autorización para ejercer actividades comerciales en el territorio de Guinea Ecuatorial",
    expeditionFee: 50000,
    renewalFee: 30000,
    processingTime: "5-7 días hábiles",
    validityPeriod: "1 año",
    calculationMethod: "Fixed",
  };

  const similarServices = [
    {
      id: "T-007",
      name: "Licencia de Importación",
      category: "Comercio Exterior",
      ministry: "Ministerio de Comercio",
      type: "License",
      expeditionFee: 60000,
      processingTime: "7-10 días",
    },
    {
      id: "T-008",
      name: "Registro de Empresa",
      category: "Licencias Comerciales",
      ministry: "Ministerio de Economía",
      type: "Registration",
      expeditionFee: 45000,
      processingTime: "3-5 días",
    },
    {
      id: "T-009",
      name: "Certificado de Operación",
      category: "Licencias Comerciales",
      ministry: "Ministerio de Economía",
      type: "Certificate",
      expeditionFee: 35000,
      processingTime: "5-7 días",
    },
  ];

  const documents = [
    { id: "RD-00001", name: "Cédula de identidad o pasaporte", required: true },
    { id: "RD-00002", name: "Certificado de residencia", required: true },
    { id: "RD-00003", name: "Prueba de domicilio comercial", required: true },
    { id: "RD-00004", name: "Plan de negocio", required: false },
  ];

  const procedures = [
    { step: 1, title: "Preparación de documentos", description: "Reúna todos los documentos requeridos", duration: "1 día" },
    { step: 2, title: "Presentación de solicitud", description: "Presente la solicitud en la oficina correspondiente", duration: "1 día" },
    { step: 3, title: "Revisión y verificación", description: "Las autoridades revisan la documentación", duration: "3-5 días" },
    { step: 4, title: "Pago de tasas", description: "Realice el pago de las tasas correspondientes", duration: "1 día" },
    { step: 5, title: "Emisión de patente", description: "Reciba su patente comercial", duration: "1 día" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-foreground">Inicio</a> / 
            <a href="/search" className="hover:text-foreground"> Búsqueda</a> / 
            <span className="text-foreground"> {service.name}</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-display font-bold mb-2">{service.name}</h1>
                <p className="text-muted-foreground">Código: {service.id}</p>
              </div>
              <Badge className="text-lg px-4 py-2">{service.type}</Badge>
            </div>
            <p className="text-lg">{service.description}</p>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Ministerio</p>
                <p className="font-semibold">{service.ministry}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Sector</p>
                <p className="font-semibold">{service.sector}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Tiempo de procesamiento</p>
                <p className="font-semibold">{service.processingTime}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Validez</p>
                <p className="font-semibold">{service.validityPeriod}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="calculator" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator">
                <Calculator className="mr-2 h-4 w-4" />
                Calculadora
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="mr-2 h-4 w-4" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="procedures">
                <Clock className="mr-2 h-4 w-4" />
                Procedimientos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator">
              <Card>
                <CardHeader>
                  <CardTitle>Calculadora de Tasas</CardTitle>
                  <CardDescription>Calcule el costo total de su servicio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tipo de operación</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="expedition">Expedición</option>
                        <option value="renewal">Renovación</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número de unidades</Label>
                      <Input type="number" defaultValue="1" min="1" />
                    </div>
                  </div>

                  <div className="bg-primary/10 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg">Tasa de expedición:</span>
                      <span className="text-2xl font-bold">{service.expeditionFee.toLocaleString()} XAF</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg">Tasa de renovación:</span>
                      <span className="text-2xl font-bold">{service.renewalFee.toLocaleString()} XAF</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold">Total:</span>
                        <span className="text-3xl font-bold text-primary">{service.expeditionFee.toLocaleString()} XAF</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Descargar cotización PDF
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Requeridos</CardTitle>
                  <CardDescription>Lista completa de documentos necesarios para este servicio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{doc.name}</h3>
                            {doc.required && (
                              <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Código: {doc.id}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver plantilla
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="procedures">
              <Card>
                <CardHeader>
                  <CardTitle>Procedimiento Paso a Paso</CardTitle>
                  <CardDescription>Guía completa del proceso de solicitud</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {procedures.map((proc, index) => (
                      <div key={proc.step} className="relative">
                        {index < procedures.length - 1 && (
                          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {proc.step}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg">{proc.title}</h3>
                              <Badge variant="outline">{proc.duration}</Badge>
                            </div>
                            <p className="text-muted-foreground">{proc.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full mt-6" size="lg">
                    Iniciar solicitud
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Similar Services Section */}
          <div className="mt-12">
            <div className="border-t pt-8">
              <h2 className="text-2xl font-display font-bold mb-6">Services Similaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similarServices.map((similarService) => (
                  <Card key={similarService.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{similarService.type}</Badge>
                        <span className="text-sm text-muted-foreground">{similarService.id}</span>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors text-lg">
                        {similarService.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {similarService.ministry}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Catégorie:</span>
                          <span className="font-medium">{similarService.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tasa:</span>
                          <span className="font-bold text-primary">{similarService.expeditionFee.toLocaleString()} XAF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Durée:</span>
                          <span className="font-medium">{similarService.processingTime}</span>
                        </div>
                      </div>
                      <Link to={`/service/${similarService.id}`}>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Voir les détails
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
