import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import taxageLogo from "@/assets/taxage_logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={taxageLogo} alt="TaxasGE Logo" className="h-12 w-12" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-foreground">TaxasGE</span>
              <p className="text-xs text-muted-foreground">Services Fiscaux Guinée Équatoriale</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/services" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Services
            </Link>
            <Link to="/ministries" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Ministères
            </Link>
            <Link to="/calculator" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Calculateur
            </Link>
            <Link to="/guide" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Guide
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden lg:inline-flex">
              <Search className="h-5 w-5" />
            </Button>
            <Link to="/auth">
              <Button className="hidden sm:inline-flex">
                Connexion
              </Button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <nav className="flex flex-col space-y-3">
              <Link
                to="/services"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/ministries"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ministères
              </Link>
              <Link
                to="/calculator"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Calculateur
              </Link>
              <Link
                to="/guide"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Guide
              </Link>
              <div className="pt-2">
                <Link to="/auth" className="block">
                  <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    Connexion
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export { Header };
export default Header;
