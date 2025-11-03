import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Bell, Shield, Save, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ProfileView = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    nifOrRc: "",
    city: "",
    phone: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileData) {
      setProfile({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
      });
    }

    // Load user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData) {
      setUserRole(roleData.role);

      // If entreprise, load company info
      if (roleData.role === "entreprise") {
        const { data: companyData } = await supabase
          .from("company_info")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (companyData) {
          setCompanyInfo({
            companyName: companyData.company_name || "",
            nifOrRc: companyData.nif_or_rc || "",
            city: companyData.city || "",
            phone: companyData.phone || "",
          });
        }
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        address: profile.address,
      })
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Profil mis à jour avec succès",
    });
  };

  const handleSaveCompanyInfo = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("company_info")
      .upsert({
        user_id: user.id,
        company_name: companyInfo.companyName,
        nif_or_rc: companyInfo.nifOrRc,
        city: companyInfo.city,
        phone: companyInfo.phone,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les informations de l'entreprise",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Informations de l'entreprise mises à jour",
    });
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mon Profil</h2>
        <p className="text-muted-foreground">Gérez vos informations personnelles et préférences</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">
            <User className="mr-2 h-4 w-4" />
            Information Personnelle
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Information Personnelle</CardTitle>
              <CardDescription>Mettez à jour vos données personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Jean"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Dupont"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="jean.dupont@example.com" 
                    className="pl-10"
                    value={profile.email}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+240 XXX XXX XXX" 
                    className="pl-10"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="address" 
                    placeholder="Malabo, Guinée Équatoriale" 
                    className="pl-10"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
              </div>

              {userRole === "entreprise" && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Informations Entreprise
                    </CardTitle>
                    <CardDescription>Informations légales de votre entreprise</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                      <Input 
                        id="companyName" 
                        placeholder="Nom de votre entreprise"
                        value={companyInfo.companyName}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nifOrRc">NIF ou RC *</Label>
                      <Input 
                        id="nifOrRc" 
                        placeholder="Numéro d'identification fiscale ou registre de commerce"
                        value={companyInfo.nifOrRc}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, nifOrRc: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyCity">Ville *</Label>
                      <Input 
                        id="companyCity" 
                        placeholder="Ville"
                        value={companyInfo.city}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Téléphone entreprise *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="companyPhone" 
                          type="tel" 
                          placeholder="+240 XXX XXX XXX" 
                          className="pl-10"
                          value={companyInfo.phone}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleSaveCompanyInfo}
                      disabled={loading}
                    >
                      <Save className="mr-2 h-5 w-5" />
                      {loading ? "Sauvegarde..." : "Sauvegarder les informations entreprise"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                <Save className="mr-2 h-5 w-5" />
                {loading ? "Sauvegarde..." : "Sauvegarder les changements"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notification</CardTitle>
              <CardDescription>Configurez comment vous souhaitez recevoir les notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Notifications par Email</p>
                  <p className="text-sm text-muted-foreground">Recevez des mises à jour par email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Notifications Push</p>
                  <p className="text-sm text-muted-foreground">Notifications en temps réel dans votre navigateur</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Mises à jour de Services</p>
                  <p className="text-sm text-muted-foreground">Changements dans les services fiscaux</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Rappels d'Échéance</p>
                  <p className="text-sm text-muted-foreground">Alertes de renouvellement de licences</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="w-full" size="lg">
                <Save className="mr-2 h-5 w-5" />
                Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du Compte</CardTitle>
              <CardDescription>Gérez la sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input id="currentPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input id="confirmPassword" type="password" />
              </div>

              <Button className="w-full" size="lg">
                <Shield className="mr-2 h-5 w-5" />
                Mettre à jour le mot de passe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TaxasGE. Tous droits réservés.</p>
      </footer>
    </div>
  );
};
