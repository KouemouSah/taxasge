import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { CalculatorView } from "@/components/dashboard/CalculatorView";
import { ProfileView } from "@/components/dashboard/ProfileView";
import { DeclarationView } from "@/components/dashboard/DeclarationView";
import { PaymentView } from "@/components/dashboard/PaymentView";

const Dashboard = () => {
  const [currentView, setCurrentView] = useState("home");

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <DashboardHome />;
      case "calculator":
        return <CalculatorView />;
      case "declarations":
        return <DeclarationView />;
      case "payments":
        return <PaymentView />;
      case "profile":
        return <ProfileView />;
      default:
        return <DashboardHome />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case "home":
        return "Mon Tableau de Bord";
      case "calculator":
        return "Calculatrice";
      case "declarations":
        return "Déclarations";
      case "payments":
        return "Paiements";
      case "profile":
        return "Mon Profil";
      default:
        return "Mon Tableau de Bord";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">{getViewTitle()}</h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {renderView()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
