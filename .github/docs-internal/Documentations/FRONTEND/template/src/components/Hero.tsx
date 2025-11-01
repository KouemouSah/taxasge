import { Search, Calculator, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickLinks = [
    {
      icon: Calculator,
      title: "Calculateur",
      description: "Calculez vos taxes",
      href: "/calculator",
      color: "text-white",
    },
    {
      icon: FileText,
      title: "547 Services",
      description: "Services fiscaux",
      href: "/services",
      color: "text-white",
    },
    {
      icon: BookOpen,
      title: "Guide Complet",
      description: "Procédures détaillées",
      href: "/guide",
      color: "text-white",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-secondary py-20 lg:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm animate-fade-in">
            <span className="mr-2">🇬🇶</span>
            <span>Services Fiscaux de la Guinée Équatoriale</span>
          </div>

          {/* Main Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl animate-slide-up">
            Simplifiez vos démarches{" "}
            <span className="text-guinea-yellow">fiscales</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg text-white/90 sm:text-xl animate-slide-up [animation-delay:100ms]">
            Accédez à tous les services fiscaux guinéens en un seul endroit.
            Calculez vos taxes, consultez les procédures et téléchargez vos documents.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-12 animate-slide-up [animation-delay:200ms]">
            <div className="mx-auto max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un service fiscal, un ministère, une catégorie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-10 bg-white border-white/20 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 bg-white text-primary hover:bg-white/90">
                  Rechercher
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-3 animate-slide-up [animation-delay:300ms]">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card
                  key={link.title}
                  className="group cursor-pointer border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-elegant"
                  onClick={() => navigate(link.href)}
                >
                  <div className="p-6">
                    <Icon className={`mb-3 h-8 w-8 ${link.color}`} />
                    <h3 className="mb-1 font-semibold text-white">{link.title}</h3>
                    <p className="text-sm text-white/80">{link.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
};
