import { FileText, Upload, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const DeclarationView = () => {
  const declarations = [
    { id: 1, type: "Impôt sur le Revenu", status: "completed", date: "2025-09-15", amount: "120,000 XAF" },
    { id: 2, type: "TVA Trimestrielle", status: "pending", date: "2025-09-28", amount: "85,000 XAF" },
    { id: 3, type: "Taxe Professionnelle", status: "in-progress", date: "2025-09-20", amount: "95,000 XAF" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Déclarations Fiscales</h2>
        <p className="text-muted-foreground">Gérez vos déclarations fiscales et soumettez de nouvelles déclarations</p>
      </div>

      {/* Nouvelle déclaration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Nouvelle Déclaration
          </CardTitle>
          <CardDescription>Remplissez le formulaire pour soumettre une nouvelle déclaration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Type de Déclaration</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Impôt sur le Revenu</SelectItem>
                  <SelectItem value="vat">TVA</SelectItem>
                  <SelectItem value="professional">Taxe Professionnelle</SelectItem>
                  <SelectItem value="property">Taxe Foncière</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Période Fiscale</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" className="pl-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Montant Déclaré (XAF)</Label>
            <Input type="number" placeholder="0" />
          </div>

          <div className="space-y-2">
            <Label>Notes et Observations</Label>
            <Textarea placeholder="Ajoutez des notes sur cette déclaration..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Documents Justificatifs</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Cliquez pour télécharger ou glissez-déposez vos documents
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX jusqu'à 10MB
              </p>
            </div>
          </div>

          <Button className="w-full" size="lg">
            <FileText className="mr-2 h-5 w-5" />
            Soumettre la Déclaration
          </Button>
        </CardContent>
      </Card>

      {/* Historique des déclarations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Déclarations</CardTitle>
          <CardDescription>Toutes vos déclarations fiscales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {declarations.map((decl) => (
              <div key={decl.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-full ${
                    decl.status === 'completed' ? 'bg-green-100 text-green-600' :
                    decl.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {decl.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                     decl.status === 'pending' ? <AlertCircle className="h-5 w-5" /> :
                     <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{decl.type}</p>
                    <p className="text-sm text-muted-foreground">{decl.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{decl.amount}</p>
                    <Badge variant={
                      decl.status === 'completed' ? 'default' :
                      decl.status === 'pending' ? 'secondary' :
                      'outline'
                    }>
                      {decl.status === 'completed' ? 'Complété' :
                       decl.status === 'pending' ? 'En attente' :
                       'En cours'}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="ml-4">
                  Voir détails
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
