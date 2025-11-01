import { useState } from "react";
import { Calculator as CalcIcon, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CalculatorView = () => {
  const [selectedService, setSelectedService] = useState("");
  const [operationType, setOperationType] = useState("expedition");
  const [quantity, setQuantity] = useState(1);

  const mockServices = [
    { id: "T-001", name: "Patente Commerciale", expeditionFee: 50000, renewalFee: 30000 },
    { id: "T-002", name: "Registro Mercantil", expeditionFee: 75000, renewalFee: 45000 },
    { id: "T-003", name: "Permis de Construction", expeditionFee: 100000, renewalFee: 60000 },
  ];

  const selectedServiceData = mockServices.find(s => s.id === selectedService);
  const calculatedTotal = selectedServiceData 
    ? (operationType === "expedition" ? selectedServiceData.expeditionFee : selectedServiceData.renewalFee) * quantity
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Calculatrice de Taxes Fiscales</h2>
        <p className="text-muted-foreground">Calculez le coût exact des services fiscaux avant d'initier votre démarche</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="h-6 w-6" />
              Configuration du Calcul
            </CardTitle>
            <CardDescription>Sélectionnez le service et les paramètres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Service Fiscal</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un service" />
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
              <Label>Type d'Opération</Label>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expedition">Expédition (Première fois)</SelectItem>
                  <SelectItem value="renewal">Renouvellement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input 
                type="number" 
                min="1" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de services ou unités à calculer
              </p>
            </div>

            {selectedServiceData && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taux unitaire:</span>
                  <span className="font-semibold">
                    {(operationType === "expedition" 
                      ? selectedServiceData.expeditionFee 
                      : selectedServiceData.renewalFee
                    ).toLocaleString()} XAF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantité:</span>
                  <span className="font-semibold">× {quantity}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultat du Calcul</CardTitle>
            <CardDescription>Détail des taxes</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedService ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez un service pour voir le calcul
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-primary/10 p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Total à payer</p>
                  <p className="text-4xl font-bold text-primary mb-4">
                    {calculatedTotal.toLocaleString()} XAF
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedServiceData?.name} - {operationType === "expedition" ? "Expédition" : "Renouvellement"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Information importante</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Ce calcul est une estimation basée sur les tarifs officiels</li>
                      <li>• Les taxes peuvent varier selon les circonstances spécifiques</li>
                      <li>• Consultez les documents requis avant d'initier la démarche</li>
                    </ul>
                  </div>

                  <Button className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Télécharger devis en PDF
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
