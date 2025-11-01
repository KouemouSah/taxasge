import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, FileText, Clock, CheckCircle2, Building2 } from "lucide-react";

const Guide = () => {
  const [selectedMinistry, setSelectedMinistry] = useState("justice");

  const ministries = [
    { id: "justice", name: "Ministère de la Justice", icon: Building2 },
    { id: "interior", name: "Ministère de l'Intérieur", icon: Building2 },
    { id: "finance", name: "Ministère des Finances", icon: Building2 },
    { id: "health", name: "Ministère de la Santé", icon: Building2 },
  ];

  const procedures = {
    justice: [
      { step: "Dépôt de la demande", duration: "1 jour", status: "completed" },
      { step: "Vérification des documents", duration: "3-5 jours", status: "completed" },
      { step: "Traitement administratif", duration: "7-10 jours", status: "in-progress" },
      { step: "Émission du document", duration: "2-3 jours", status: "pending" },
      { step: "Notification et retrait", duration: "1 jour", status: "pending" },
    ],
    interior: [
      { step: "Prise de rendez-vous", duration: "1 jour", status: "completed" },
      { step: "Vérification d'identité", duration: "1 jour", status: "completed" },
      { step: "Collecte des données biométriques", duration: "1 jour", status: "in-progress" },
      { step: "Production du document", duration: "5-7 jours", status: "pending" },
      { step: "Notification et retrait", duration: "1 jour", status: "pending" },
    ],
    finance: [
      { step: "Soumission de la déclaration", duration: "1 jour", status: "completed" },
      { step: "Vérification fiscale", duration: "10-15 jours", status: "in-progress" },
      { step: "Calcul des taxes", duration: "3-5 jours", status: "pending" },
      { step: "Émission de l'avis", duration: "2 jours", status: "pending" },
    ],
    health: [
      { step: "Demande d'autorisation", duration: "1 jour", status: "completed" },
      { step: "Examen médical", duration: "1-2 jours", status: "in-progress" },
      { step: "Analyse des résultats", duration: "3-5 jours", status: "pending" },
      { step: "Délivrance du certificat", duration: "1 jour", status: "pending" },
    ],
  };

  const faqs = [
    {
      question: "Quels documents sont nécessaires pour une demande de passeport ?",
      answer: "Pour une demande de passeport, vous aurez besoin d'une carte d'identité nationale valide, deux photos d'identité récentes, un acte de naissance, et un justificatif de domicile de moins de 3 mois.",
    },
    {
      question: "Combien de temps faut-il pour obtenir un extrait de casier judiciaire ?",
      answer: "Le délai standard pour obtenir un extrait de casier judiciaire est de 5 à 7 jours ouvrables après le dépôt de la demande complète.",
    },
    {
      question: "Comment puis-je payer mes taxes en ligne ?",
      answer: "Les paiements en ligne peuvent être effectués via le portail DGI en utilisant une carte bancaire ou un compte mobile money. Vous recevrez un reçu électronique immédiatement après le paiement.",
    },
    {
      question: "Puis-je suivre l'avancement de ma demande en ligne ?",
      answer: "Oui, toutes les demandes peuvent être suivies en ligne via votre espace personnel en utilisant le numéro de référence fourni lors du dépôt.",
    },
    {
      question: "Que faire si mon document contient une erreur ?",
      answer: "Si vous constatez une erreur sur votre document, vous devez contacter immédiatement le service concerné avec votre numéro de référence. Une procédure de correction sera initiée gratuitement.",
    },
  ];

  const downloads = [
    { name: "Formulaire de demande de passeport", type: "PDF", size: "245 KB" },
    { name: "Guide des procédures fiscales", type: "PDF", size: "1.2 MB" },
    { name: "Liste des documents requis", type: "PDF", size: "156 KB" },
    { name: "Tarifs des services administratifs", type: "PDF", size: "89 KB" },
    { name: "Modèle de déclaration d'impôt", type: "XLSX", size: "42 KB" },
    { name: "Guide d'utilisation du portail", type: "PDF", size: "3.4 MB" },
  ];

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === "in-progress") return <Clock className="h-5 w-5 text-blue-500" />;
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Guide Complet des Services</h1>
          <p className="text-muted-foreground">
            Découvrez les procédures détaillées pour chaque ministère et accédez aux ressources utiles
          </p>
        </div>

        <Tabs defaultValue="procedures" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="procedures">
              <BookOpen className="h-4 w-4 mr-2" />
              Procédures
            </TabsTrigger>
            <TabsTrigger value="ministries">
              <Building2 className="h-4 w-4 mr-2" />
              Ministères
            </TabsTrigger>
            <TabsTrigger value="faq">
              <FileText className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Download className="h-4 w-4 mr-2" />
              Téléchargements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="procedures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Procédures Complètes avec Timeline</CardTitle>
                <CardDescription>
                  Suivez étape par étape le processus de traitement de votre demande
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Sélectionnez un ministère</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    {ministries.map((ministry) => (
                      <Button
                        key={ministry.id}
                        variant={selectedMinistry === ministry.id ? "default" : "outline"}
                        onClick={() => setSelectedMinistry(ministry.id)}
                        className="w-full"
                      >
                        <ministry.icon className="h-4 w-4 mr-2" />
                        {ministry.name.split(" ")[2]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {procedures[selectedMinistry as keyof typeof procedures].map((step, index) => (
                    <div key={index} className="flex gap-4 mb-6 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(step.status)}
                        </div>
                        {index < procedures[selectedMinistry as keyof typeof procedures].length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{step.step}</h3>
                          <span className="text-sm text-muted-foreground">{step.duration}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            step.status === "completed" ? "bg-green-500/10 text-green-500" :
                            step.status === "in-progress" ? "bg-blue-500/10 text-blue-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {step.status === "completed" ? "Complété" :
                             step.status === "in-progress" ? "En cours" :
                             "En attente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ministries" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {ministries.map((ministry) => (
                <Card key={ministry.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ministry.icon className="h-5 w-5" />
                      {ministry.name}
                    </CardTitle>
                    <CardDescription>
                      Guide complet des services et procédures
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        <span>Documents requis détaillés</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        <span>Processus étape par étape</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        <span>Délais de traitement estimés</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        <span>Coûts et modes de paiement</span>
                      </li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      Voir le guide complet
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Questions Fréquemment Posées</CardTitle>
                <CardDescription>
                  Trouvez rapidement des réponses aux questions les plus courantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle>Téléchargements Utiles</CardTitle>
                <CardDescription>
                  Formulaires, guides et documents de référence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {downloads.map((download, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{download.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {download.type} • {download.size}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Guide;
