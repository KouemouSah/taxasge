import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const EmailVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Récupérer le token depuis l'URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          setVerificationStatus("error");
          setErrorMessage("Lien de vérification invalide");
          return;
        }

        // Vérifier la session utilisateur
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          setVerificationStatus("success");
          toast({
            title: "Email vérifié !",
            description: "Votre compte a été vérifié avec succès.",
          });
        } else {
          setVerificationStatus("error");
          setErrorMessage("Session expirée ou invalide");
        }
      } catch (error: any) {
        setVerificationStatus("error");
        setErrorMessage(error.message || "Une erreur est survenue lors de la vérification");
      }
    };

    verifyEmail();
  }, [searchParams, toast]);

  const handleContinue = () => {
    if (verificationStatus === "success") {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              {verificationStatus === "loading" && (
                <>
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  </div>
                  <CardTitle>Vérification en cours...</CardTitle>
                  <CardDescription>
                    Veuillez patienter pendant que nous vérifions votre email
                  </CardDescription>
                </>
              )}

              {verificationStatus === "success" && (
                <>
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <CardTitle className="text-green-600">Email vérifié !</CardTitle>
                  <CardDescription>
                    Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant accéder à tous les services.
                  </CardDescription>
                </>
              )}

              {verificationStatus === "error" && (
                <>
                  <div className="flex justify-center mb-4">
                    <XCircle className="h-16 w-16 text-destructive" />
                  </div>
                  <CardTitle className="text-destructive">Erreur de vérification</CardTitle>
                  <CardDescription>
                    {errorMessage || "Une erreur est survenue lors de la vérification de votre email."}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent>
              {verificationStatus !== "loading" && (
                <div className="space-y-4">
                  <Button 
                    onClick={handleContinue} 
                    className="w-full"
                  >
                    {verificationStatus === "success" ? "Accéder au dashboard" : "Retour à la connexion"}
                  </Button>

                  {verificationStatus === "error" && (
                    <p className="text-sm text-center text-muted-foreground">
                      Besoin d'aide ? Contactez notre support.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmailVerification;