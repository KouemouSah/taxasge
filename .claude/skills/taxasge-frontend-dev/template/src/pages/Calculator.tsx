import { useState } from "react";
import { Calculator as CalcIcon, Download, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Calculator = () => {
  const [selectedService, setSelectedService] = useState("");
  const [operationType, setOperationType] = useState("expedition");
  const [quantity, setQuantity] = useState(1);

  const mockServices = [
    { id: "T-001", name: "Patente Comercial", expeditionFee: 50000, renewalFee: 30000 },
    { id: "T-002", name: "Registro Mercantil", expeditionFee: 75000, renewalFee: 45000 },
    { id: "T-003", name: "Permiso de Construcción", expeditionFee: 100000, renewalFee: 60000 },
  ];

  const selectedServiceData = mockServices.find(s => s.id === selectedService);
  const calculatedTotal = selectedServiceData 
    ? (operationType === "expedition" ? selectedServiceData.expeditionFee : selectedServiceData.renewalFee) * quantity
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold mb-4">Calculadora de Tasas Fiscales</h1>
            <p className="text-lg text-muted-foreground">
              Calcule el costo exacto de los servicios fiscales antes de iniciar su trámite
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalcIcon className="h-6 w-6" />
                  Configuración del Cálculo
                </CardTitle>
                <CardDescription>Seleccione el servicio y los parámetros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Servicio Fiscal</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Operación</Label>
                  <Select value={operationType} onValueChange={setOperationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expedition">Expedición (Primera vez)</SelectItem>
                      <SelectItem value="renewal">Renovación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de servicios o unidades a calcular
                  </p>
                </div>

                {selectedServiceData && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasa unitaria:</span>
                      <span className="font-semibold">
                        {(operationType === "expedition" 
                          ? selectedServiceData.expeditionFee 
                          : selectedServiceData.renewalFee
                        ).toLocaleString()} XAF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cantidad:</span>
                      <span className="font-semibold">× {quantity}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Resultado del Cálculo</CardTitle>
                <CardDescription>Desglose detallado de las tasas</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedService ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Seleccione un servicio para ver el cálculo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-primary/10 p-6 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Total a pagar</p>
                      <p className="text-4xl font-bold text-primary mb-4">
                        {calculatedTotal.toLocaleString()} XAF
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedServiceData?.name} - {operationType === "expedition" ? "Expedición" : "Renovación"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Información importante</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Este cálculo es una estimación basada en las tarifas oficiales</li>
                          <li>• Las tasas pueden variar según circunstancias específicas</li>
                          <li>• Consulte los documentos requeridos antes de iniciar el trámite</li>
                        </ul>
                      </div>

                      <Button className="w-full" size="lg">
                        <Download className="mr-2 h-5 w-5" />
                        Descargar cotización en PDF
                      </Button>

                      <Button variant="outline" className="w-full" size="lg">
                        Ver detalles del servicio
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Historial de Cálculos</CardTitle>
              <CardDescription>Sus cálculos recientes guardados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No hay cálculos guardados aún. Los cálculos realizados aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Calculator;
