import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";

const TaxDeclaration = () => {
  const [declarationType, setDeclarationType] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [income, setIncome] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Declaration submitted:", { declarationType, fiscalYear, income });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Déclaration Fiscale</h1>
            <p className="text-muted-foreground">
              Remplissez votre déclaration d'impôts en ligne
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de déclaration</CardTitle>
                <CardDescription>
                  Sélectionnez le type de déclaration et l'année fiscale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="declaration-type">Type de déclaration</Label>
                      <Select value={declarationType} onValueChange={setDeclarationType}>
                        <SelectTrigger id="declaration-type">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Impôt sur le revenu</SelectItem>
                          <SelectItem value="business">Impôt sur les sociétés</SelectItem>
                          <SelectItem value="vat">TVA</SelectItem>
                          <SelectItem value="property">Taxe foncière</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fiscal-year">Année fiscale</Label>
                      <Select value={fiscalYear} onValueChange={setFiscalYear}>
                        <SelectTrigger id="fiscal-year">
                          <SelectValue placeholder="Sélectionnez l'année" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="income">Revenu imposable (XAF)</Label>
                    <Input
                      id="income"
                      type="number"
                      placeholder="0"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="details">Détails additionnels</Label>
                    <Textarea
                      id="details"
                      placeholder="Ajoutez des informations supplémentaires..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Documents justificatifs</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez-déposez vos documents ou cliquez pour sélectionner
                      </p>
                      <Button type="button" variant="outline" size="sm">
                        Sélectionner des fichiers
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Soumettre la déclaration
                    </Button>
                    <Button type="button" variant="outline">
                      Sauvegarder le brouillon
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TaxDeclaration;
