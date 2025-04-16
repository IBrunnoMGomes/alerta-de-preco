import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import AddProductForm from "@/components/product/AddProductForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface DashboardHeaderProps {
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onAddProduct }) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  };

  return (
    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard de Monitoramento</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Acompanhe os preços dos seus produtos favoritos
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <ThemeToggle />
        <AddProductForm onAddProduct={onAddProduct} />
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
