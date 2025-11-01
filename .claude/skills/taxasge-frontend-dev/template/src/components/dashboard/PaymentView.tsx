import { CreditCard, DollarSign, Receipt, Calendar, CheckCircle, Clock, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const PaymentView = () => {
  const payments = [
    { id: 1, service: "Patente Commerciale", amount: "50,000 XAF", status: "completed", date: "2025-09-28", ref: "PAY-2025-001" },
    { id: 2, service: "Taxe Foncière", amount: "75,000 XAF", status: "completed", date: "2025-09-25", ref: "PAY-2025-002" },
    { id: 3, service: "Impôt sur le Revenu", amount: "120,000 XAF", status: "pending", date: "2025-09-20", ref: "PAY-2025-003" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Paiements</h2>
        <p className="text-muted-foreground">Gérez vos paiements fiscaux et administratifs</p>
      </div>

      {/* Nouveau paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Effectuer un Paiement
          </CardTitle>
          <CardDescription>Payez vos taxes et services administratifs en ligne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Service à Payer</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patent">Patente Commerciale</SelectItem>
                <SelectItem value="property">Taxe Foncière</SelectItem>
                <SelectItem value="income">Impôt sur le Revenu</SelectItem>
                <SelectItem value="vat">TVA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Montant (XAF)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" placeholder="0" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Référence de la Déclaration</Label>
            <Input placeholder="DEC-2025-XXX (optionnel)" />
          </div>

          <div className="space-y-3">
            <Label>Méthode de Paiement</Label>
            <RadioGroup defaultValue="card">
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Carte Bancaire</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="mobile" id="mobile" />
                <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                  <DollarSign className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Mobile Money</p>
                    <p className="text-xs text-muted-foreground">Orange Money, MTN Money</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Receipt className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Virement Bancaire</p>
                    <p className="text-xs text-muted-foreground">Transfert direct</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button className="w-full" size="lg">
            <CreditCard className="mr-2 h-5 w-5" />
            Procéder au Paiement
          </Button>
        </CardContent>
      </Card>

      {/* Historique des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Paiements</CardTitle>
          <CardDescription>Tous vos paiements effectués</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {payment.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{payment.service}</p>
                    <p className="text-sm text-muted-foreground">
                      Réf: {payment.ref} • {payment.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{payment.amount}</p>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status === 'completed' ? 'Payé' : 'En attente'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    Voir détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">345,000</p>
                <p className="text-sm text-muted-foreground">Total Payé (XAF)</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Paiements Effectués</p>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">En Attente</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
