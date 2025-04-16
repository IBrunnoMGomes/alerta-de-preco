
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from '@/components/ui/sonner';
import { Product } from '@/types/product';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ProductList from '@/components/dashboard/ProductList';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      url, 
      store, 
      current_price, 
      previous_price, 
      image_url, 
      is_on_sale, 
      price_target, 
      last_checked,
      price_history(id, price, checked_at)
    `);
  
  if (error) throw error;
  
  // Filtrar para não mostrar produtos indefinidos/vazios
  return data
    .filter(item => 
      item && 
      item.name && 
      item.url && 
      item.current_price !== undefined && 
      item.current_price !== null
    )
    .map((item: any) => {
      const currentPrice = item.current_price;
      const previousPrice = item.previous_price;
      let priceChange = 0;
      
      if (previousPrice && currentPrice !== previousPrice) {
        priceChange = parseFloat((((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2));
      }
      
      return {
        id: item.id,
        name: item.name,
        url: item.url,
        store: item.store,
        currentPrice: item.current_price,
        previousPrice: item.previous_price,
        priceChange: priceChange,
        imageUrl: item.image_url || 'https://via.placeholder.com/300',
        isOnSale: item.is_on_sale || false,
        lastUpdated: item.last_checked,
        priceTarget: item.price_target,
        priceHistory: (item.price_history || []).map((history: any) => ({
          date: history.checked_at,
          price: history.price
        }))
      };
    });
};

const Dashboard = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Erro de autenticação", {
          description: "Você precisa estar logado para adicionar produtos."
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          url: newProduct.url,
          store: newProduct.store,
          current_price: newProduct.currentPrice,
          previous_price: newProduct.previousPrice,
          image_url: newProduct.imageUrl,
          is_on_sale: newProduct.isOnSale,
          price_target: newProduct.priceTarget,
          user_id: user.id,
          last_checked: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase
        .from('price_history')
        .insert({
          product_id: data.id,
          price: newProduct.currentPrice,
          checked_at: new Date().toISOString()
        });
      
      refetch();
      
      toast.success("Produto adicionado", {
        description: "O produto foi adicionado à sua lista de monitoramento."
      });
    } catch (error: any) {
      toast.error("Erro ao adicionar produto", {
        description: error.message
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      refetch();
      
      toast.success("Produto removido", {
        description: "O produto foi removido da sua lista de monitoramento."
      });
    } catch (error: any) {
      toast.error("Erro ao remover produto", {
        description: error.message
      });
    }
  };

  const handleViewDetails = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setShowHistoryDialog(true);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
      if (updates.previousPrice !== undefined) dbUpdates.previous_price = updates.previousPrice;
      if (updates.priceTarget !== undefined) dbUpdates.price_target = updates.priceTarget;
      if (updates.isOnSale !== undefined) dbUpdates.is_on_sale = updates.isOnSale;
      
      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      refetch();
    } catch (error: any) {
      toast.error("Erro ao atualizar produto", {
        description: error.message
      });
    }
  };

  return (
    <MainLayout>
      <DashboardHeader onAddProduct={handleAddProduct} />
      <DashboardStats products={products} />
      
      <h2 className="text-xl font-semibold mb-4">Produtos Monitorados</h2>
      <ProductList
        products={products}
        isLoading={isLoading}
        onDelete={handleDeleteProduct}
        onViewDetails={handleViewDetails}
        onUpdateProduct={handleUpdateProduct}
        onAddProduct={handleAddProduct}
      />

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Histórico de Preços</DialogTitle>
            <DialogDescription>
              Visualize as mudanças de preço ao longo do tempo
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="mt-4">
              <PriceHistoryChart
                priceHistory={selectedProduct.priceHistory}
                productName={selectedProduct.name}
              />
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => setShowHistoryDialog(false)} 
                  variant="outline"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Dashboard;
